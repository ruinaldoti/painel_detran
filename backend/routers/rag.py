from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlmodel import Session, select
from ..database import get_session
from ..models import Document, DocumentChunk
from ..services.gemini_service import generate_embedding
import fitz  # PyMuPDF
from typing import List

router = APIRouter(prefix="/rag", tags=["rag"])

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Somente arquivos PDF permitidos")
        
    contents = await file.read()
    text = extract_text_from_pdf(contents)
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF vazio ou ilegível")

    # 1. Salvar Documento
    db_document = Document(
        filename=file.filename,
        content_type=file.content_type
    )
    session.add(db_document)
    session.commit()
    session.refresh(db_document)
    
    # 2. Chunking
    chunks = chunk_text(text)
    
    # 3. Embedding and Save
    for chunk in chunks:
        if chunk.strip():
            embedding_vector = generate_embedding(chunk)
            db_chunk = DocumentChunk(
                document_id=db_document.id,
                chunk_text=chunk,
                embedding=embedding_vector
            )
            session.add(db_chunk)
            
    session.commit()
    
    return {"message": "Documento RAG processado e vetorizado com sucesso", "chunks_criados": len(chunks)}
    
@router.get("/documents")
def list_documents(session: Session = Depends(get_session)):
    docs = session.exec(select(Document)).all()
    return docs
