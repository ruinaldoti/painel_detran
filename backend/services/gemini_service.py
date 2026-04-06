import os
from google import genai
from google.genai import types

# Using the new Google GenAI SDK interface.
# Note: google-genai package gets initialized without API explicit passing if environment GOOGLE_API_KEY is available.
# We'll configure it directly using the env variable.

API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_client():
    from google import genai
    return genai.Client(api_key=API_KEY)

def generate_embedding(text: str) -> list[float]:
    client = get_client()
    # gemini-embedding-001 com precisão de 768 dimensões devido ao PgVector
    response = client.models.embed_content(
        model="gemini-embedding-001",   
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    return response.embeddings[0].values

def generate_chat_response(query: str, context: str) -> str:
    client = get_client()
    
    if not context.strip():
        return (
            "Olá! Não encontrei informações sobre esse assunto nos nossos documentos ainda. "
            "Estou em processo de aprendizado! 😊 \n"
            "Por favor, entre em contato com o DETRAN-CE pelo canal oficial para mais esclarecimentos."
        )
    
    prompt = f"""Você é o assistente virtual oficial do DETRAN-CE.

INSTRUÇÕES OBRIGATÓRIAS:
1. Responda APENAS com base no CONTEXTO FORNECIDO abaixo.
2. Se a informação solicitada NÃO estiver no contexto, responda exatamente: 
   "Não encontrei essa informação nos nossos documentos ainda. Estou em processo de aprendizado! 😊 Por favor, entre em contato com o DETRAN-CE pelo canal oficial."
3. NUNCA invente leis, regulamentos, valores, prazos ou procedimentos.
4. Seja sempre educado, cordial e objetivo.
5. Responda sempre em português do Brasil.
6. Não cite que está usando um contexto ou documento — responda naturalmente.

CONTEXTO FORNECIDO:
{context}

PERGUNTA DO USUÁRIO:
{query}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text
