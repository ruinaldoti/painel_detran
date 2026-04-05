from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from pgvector.sqlalchemy import Vector
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class Documento(Base):
    __tablename__ = "documentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    content_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)

class DocumentoChunk(Base):
    __tablename__ = "documento_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(768)) # Embedding gerado via Gemini
    
    documento = relationship("Documento", backref="chunks")
