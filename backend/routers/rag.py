from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Documento, DocumentoChunk
from services.gemini_service import generate_embedding
import fitz  # PyMuPDF
from typing import List
import uuid

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
    titulo: str = Form(...),
    assunto: str = Form(...),
    setor: str = Form(None),
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Somente arquivos PDF permitidos")
        
    contents = await file.read()
    text = extract_text_from_pdf(contents)
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF vazio ou ilegível")

    # 1. Salvar Documento
    db_document = Documento(
        titulo=titulo,
        assunto=assunto,
        setor=setor,
        nome_arquivo=file.filename
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # 2. Chunking
    chunks = chunk_text(text)
    
    # 3. Embedding and Save
    for chunk in chunks:
        if chunk.strip():
            embedding_vector = generate_embedding(chunk)
            
            chunk_metadata = {
                "titulo": titulo,
                "assunto": assunto,
                "setor": setor,
                "nome_arquivo": file.filename
            }
            
            db_chunk = DocumentoChunk(
                documento_id=db_document.id,
                conteudo_texto=chunk,
                vetor_embedding=embedding_vector,
                metadata_=chunk_metadata
            )
            db.add(db_chunk)
            
    db.commit()
    
    return {"message": "Documento RAG processado e vetorizado com sucesso", "chunks_criados": len(chunks)}
    
@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Documento).all()
    return docs
