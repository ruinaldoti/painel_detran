from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import DocumentoChunk, Area, Duvida
from services.gemini_service import generate_embedding, generate_chat_response, find_related_area

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    area: str | None = None  # área selecionada no widget (opcional)


@router.post("/")
def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    query = request.message

    # 1. Gerar vetor da pergunta (reutilizado para busca vetorial E para matching de área)
    query_vector = generate_embedding(query)

    # 2. Busca semântica com pgvector (campo: vetor_embedding)
    try:
        results = db.query(DocumentoChunk).order_by(
            DocumentoChunk.vetor_embedding.l2_distance(query_vector)
        ).limit(5).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca vetorial: {str(e)}")

    # 3. Montar contexto a partir dos chunks recuperados
    context_parts = []
    for chunk in results:
        meta = chunk.metadata_ or {}
        parte = ""
        if meta.get("area"):
            parte += f"[Área: {meta['area']}] "
        if meta.get("titulo"):
            parte += f"[Documento: {meta['titulo']}] "
        parte += chunk.conteudo_texto
        context_parts.append(parte)

    context_text = "\n\n---\n\n".join(context_parts)

    # 4. Gerar resposta com o Gemini
    # Retorna {"reply": str, "answered": bool}
    result = generate_chat_response(query, context_text)
    answer = result["reply"]
    answered = result["answered"]

    # 5. Se não respondeu → tentar salvar na tabela duvidas
    if not answered:
        _try_save_duvida(query=query, query_vector=query_vector, db=db)

    return {
        "reply": answer,
        "contexts_used": len(results),
    }


def _try_save_duvida(query: str, query_vector: list[float], db: Session) -> None:
    """
    Verifica se a pergunta é relacionada a alguma área cadastrada.
    Se sim, salva na tabela `duvidas` com status 'pendente'.
    Se não (fora do escopo), descarta silenciosamente.

    Erros são capturados para nunca impactar a resposta ao usuário.
    """
    try:
        areas = db.query(Area).all()
        if not areas:
            return

        area_id, similarity = find_related_area(query_vector, areas)

        if area_id:
            duvida = Duvida(
                duvida=query,
                id_area=area_id,
                status="pendente",
                origem="chat_publico",
            )
            db.add(duvida)
            db.commit()
    except Exception:
        # Garantia: nunca deixar erro de logging afetar o usuário
        db.rollback()
