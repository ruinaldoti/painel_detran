from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from ..database import get_session
from ..models import DocumentChunk
from ..services.gemini_service import generate_embedding, generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def chat_with_bot(request: ChatRequest, session: Session = Depends(get_session)):
    query = request.message
    
    # 1. Generate embedding for query
    query_vector = generate_embedding(query)
    
    # 2. Semantic Search (PostgreSQL pgvector L2 distance / cosine similarity)
    # the l2_distance function is supported natively in pgvector's SQLAlchemy integration
    results = session.exec(
        select(DocumentChunk)
        .order_by(DocumentChunk.embedding.l2_distance(query_vector))
        .limit(5)
    ).all()
    
    # 3. Build Context
    context_text = "\n\n".join([chunk.chunk_text for chunk in results])
    
    # 4. Generate Answer
    answer = generate_chat_response(query, context_text)
    
    return {
        "reply": answer,
        "contexts_used": len(results)
    }
