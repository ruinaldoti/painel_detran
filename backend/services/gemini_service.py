import math
import os
from functools import lru_cache
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from sqlalchemy import text

API_KEY = os.getenv("GEMINI_API_KEY", "")

# Frase exata que o LLM usa quando não encontra resposta no contexto.
# Usada para detectar se a pergunta ficou sem resposta.
_NOT_FOUND_MARKER = "Não encontrei essa informação nos nossos documentos"

# Threshold de similaridade cosine para associar uma pergunta a uma área.
# Abaixo disso, a pergunta é considerada fora do escopo e não é salva.
_AREA_SIMILARITY_THRESHOLD = 0.40


def get_client():
    from google import genai
    return genai.Client(api_key=API_KEY)


def generate_embedding(text: str) -> list[float] | None:
    try:
        client = get_client()
        # gemini-embedding-001 com 768 dimensões (para compatibilidade com pgvector)
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        return response.embeddings[0].values
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return None
        raise e

@lru_cache(maxsize=256)
def generate_embedding_cached(text: str) -> tuple[float, ...] | None:
    result = generate_embedding(text)
    return tuple(result) if result else None


def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calcula cosine similarity entre dois vetores (sem numpy)."""
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def find_related_area(
    query_vector: list[float],
    db: Session,
) -> tuple[str | None, float]:
    """
    Identifica a área mais relacionada à pergunta usando busca vetorial direta no pgvector
    na tabela assuntos.
    
    Retorna (area_id, similarity) se encontrar assunto com similarity >= threshold,
    ou (None, melhor_similaridade) caso contrário.
    """
    try:
        query = text("""
            SELECT id, id_area, nome,
                   1 - (embedding <=> CAST(:embedding AS vector(768))) AS similaridade
            FROM public.assuntos
            ORDER BY embedding <=> CAST(:embedding AS vector(768))
            LIMIT 1
        """)
        embedding_str = "[" + ",".join(map(str, query_vector)) + "]"
        resultado = db.execute(query, {"embedding": embedding_str}).fetchone()

        if resultado:
            if resultado.similaridade >= _AREA_SIMILARITY_THRESHOLD:
                return str(resultado.id_area), resultado.similaridade
            return None, resultado.similaridade
            
    except Exception as e:
        print(f"Erro na busca vetorial da área: {e}")
        
    return None, 0.0


def generate_chat_response(query: str, context: str) -> dict:
    """
    Gera resposta do assistente virtual com base no contexto RAG.

    Retorna:
        dict com:
            "reply"    (str)  — texto da resposta ao usuário
            "answered" (bool) — True se o LLM respondeu com base no contexto,
                                False se não encontrou informação
    """
    client = get_client()

    # Sem contexto: definitivamente não respondeu
    if not context.strip():
        return {
            "reply": (
                "Olá! Não encontrei informações sobre esse assunto nos nossos "
                "documentos ainda. Estou em processo de aprendizado! 😊\n"
                "Por favor, entre em contato com o DETRAN-CE pelo canal oficial "
                "para mais esclarecimentos."
            ),
            "answered": False,
        }

    prompt = f"""Você é o assistente virtual do DETRAN-CE.

REGRAS DE RESPOSTA ATUALIZADAS:
- RESPONDA EXATAMENTE O QUE FOI PERGUNTADO E NADA MAIS. Se a pergunta for sobre PROCEDIMENTOS, mostre apenas os Procedimentos. Se a pergunta for sobre DOCUMENTOS, mostre todos os documentos exigidos. Nunca misture os assuntos a menos que seja explicitamente solicitado.
- NUNCA omita nenhum documento de uma lista. Caso a pergunta seja sobre documentos necessários, cite ABSOLUTAMENTE TODOS os documentos exigidos.
- NÃO MISTURE PROCEDIMENTOS DIFERENTES: Se o contexto contiver mais de um procedimento (ex: "Defesa de Multa" e "Recurso ao Cetran"), forneça as informações EXCLUSIVAS do procedimento que corresponde à pergunta do usuário. Não junte documentos de dois procedimentos distintos em uma única lista.
- SEJA TOTALMENTE DIRETO. Sem introduções amigáveis do tipo "Olá!", "Para o procedimento X...", "O processo deverá ser...", etc. Inicie imediatamente a resposta com o conteúdo útil.
- Reproduza fielmente as informações do manual, sem acrescentar enfeites, rodeios ou explicações adicionais que não constem no texto original.
- Responda APENAS com base no CONTEXTO FORNECIDO abaixo
- NUNCA invente leis, regulamentos, valores, prazos ou procedimentos
- Não cite que está lendo um contexto ou documento

ATENÇÃO: Se a informação NÃO estiver no contexto, responda EXATAMENTE:
"Não encontrei essa informação nos nossos documentos ainda. Estou em processo de aprendizado! 😊 Por favor, entre em contato com o DETRAN-CE pelo canal oficial."

CONTEXTO FORNECIDO:
{context}

PERGUNTA DO USUÁRIO:
{query}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    reply = response.text
    answered = _NOT_FOUND_MARKER not in reply

    return {"reply": reply, "answered": answered}
