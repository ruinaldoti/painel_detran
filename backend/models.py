from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column
import uuid

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)

class Document(SQLModel, table=True):
    __tablename__ = "documents"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    filename: str
    content_type: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)

class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="documents.id")
    chunk_text: str
    embedding: List[float] = Field(sa_column=Column(Vector(768))) # Gemini embedding dimention is typically 768
