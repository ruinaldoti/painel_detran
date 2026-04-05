from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import DocumentoChunk
from ..services.gemini_service import generate_embedding, generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    query = request.message
    
    # 1. Obter Vetor da Pergunta
    query_vector = generate_embedding(query)
    
    # 2. Busca Semântica no PostgreSQL pgvector nativo
    # sqlalchemy pgvector utiliza um construtor de query específico como l2_distance
    results = db.query(DocumentoChunk).order_by(
        DocumentoChunk.embedding.l2_distance(query_vector)
    ).limit(5).all()
    
    # 3. Montar Contexto pro Gemini
    context_text = "\n\n".join([chunk.chunk_text for chunk in results])
    
    # 4. Gerar Resposta Final
    answer = generate_chat_response(query, context_text)
    
    return {
        "reply": answer,
        "contexts_used": len(results)
    }
