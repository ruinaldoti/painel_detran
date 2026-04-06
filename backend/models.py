from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from pgvector.sqlalchemy import Vector
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String, nullable=False, default="Admin")
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    perfil = Column(String, default="admin")
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    ultimo_acesso = Column(DateTime, nullable=True)

class Documento(Base):
    __tablename__ = "documentos"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255), nullable=False)
    nome_arquivo = Column(String(255), nullable=True)
    criado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

class DocumentoChunk(Base):
    __tablename__ = "documento_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=False)
    conteudo_texto = Column(Text, nullable=False)
    vetor_embedding = Column(Vector(768))
    pagina = Column(Integer, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    documento = relationship("Documento", backref="chunks")
