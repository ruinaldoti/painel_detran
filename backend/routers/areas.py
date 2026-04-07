from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Area, Documento, Assunto
from uuid import UUID
import traceback

router = APIRouter(prefix="/areas", tags=["areas"])

# ──────────────────── SCHEMAS ────────────────────

class AreaCreate(BaseModel):
    area: str

class AreaResponse(BaseModel):
    id: UUID
    area: str
    class Config:
        from_attributes = True

class DocumentoTituloResponse(BaseModel):
    id: UUID
    titulo: str
    assunto: str
    class Config:
        from_attributes = True

# ──────────────────── AREAS ────────────────────

@router.get("/", response_model=list[AreaResponse])
def list_areas(db: Session = Depends(get_db)):
    return db.query(Area).order_by(Area.area).all()

@router.post("/", response_model=AreaResponse, status_code=201)
def create_area(body: AreaCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(Area).filter(Area.area == body.area.strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Área já cadastrada")
        nova = Area(area=body.area.strip())
        db.add(nova)
        db.commit()
        db.refresh(nova)
        return nova
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}\n{traceback.format_exc()}")

@router.delete("/{area_id}", status_code=200)
def delete_area(area_id: str, db: Session = Depends(get_db)):
    try:
        area = db.query(Area).filter(Area.id == area_id).first()
        if not area:
            raise HTTPException(status_code=404, detail="Área não encontrada")
        db.delete(area)
        db.commit()
        return {"message": "Área excluída com sucesso"}
    except Exception as e:
        db.rollback()
        # Captura erro de FK constraint (como Dúvidas associadas a Área)
        if "Foreign key violation" in str(e) or "psycopg2.errors.ForeignKeyViolation" in str(e) or "IntegrityError" in str(type(e).__name__):
            raise HTTPException(status_code=400, detail="Não é possível excluir esta Área pois existem Dúvidas Pendentes ou Documentos atrelados a ela. Exclua eles primeiro.")
        raise HTTPException(status_code=500, detail=f"Erro banco de dados: {str(e)}")

# ──────────────────── ASSUNTOS ────────────────────
# Retorna os nomes dos assuntos vinculados à área (nova tabela Assuntos)
# O modelo do frontend (DocumentoTituloResponse) ainda espera o campo 'titulo', então mapeamos nome -> titulo.

@router.get("/{area_id}/assuntos", response_model=list[DocumentoTituloResponse])
def list_assuntos_by_area(area_id: str, db: Session = Depends(get_db)):
    # Verifica quais Assuntos já tem pelo menos um Documento (arquivo) associado (vetorizado)
    docs_area = db.query(Documento.assunto).filter(Documento.id_area == area_id).all()
    assuntos_vetorizados = {d[0].strip().lower() for d in docs_area if d[0]}

    assuntos = (
        db.query(Assunto)
        .filter(Assunto.id_area == area_id)
        .order_by(Assunto.nome)
        .all()
    )
    
    # Mapeia apenas os que já têm documento associado
    result = []
    for a in assuntos:
        if a.nome.strip().lower() in assuntos_vetorizados:
            result.append(DocumentoTituloResponse(id=a.id, titulo=a.nome, assunto=a.nome))
            
    return result
