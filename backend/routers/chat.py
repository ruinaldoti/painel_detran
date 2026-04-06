from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import DocumentoChunk
from services.gemini_service import generate_embedding, generate_chat_response
from pgvector.sqlalchemy import Vector
from sqlalchemy import cast

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    area: str | None = None  # área selecionada no widget (opcional)

@router.post("/")
def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    query = request.message

    # 1. Gerar vetor da pergunta
    query_vector = generate_embedding(query)

    # 2. Busca semântica com pgvector (campo correto: vetor_embedding)
    try:
        results = db.query(DocumentoChunk).order_by(
            DocumentoChunk.vetor_embedding.l2_distance(query_vector)
        ).limit(5).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca vetorial: {str(e)}")

    # 3. Montar contexto (campo correto: conteudo_texto)
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
    answer = generate_chat_response(query, context_text)

    return {
        "reply": answer,
        "contexts_used": len(results)
    }
