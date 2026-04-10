from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Assunto, Area, Documento, Duvida
from uuid import UUID
from datetime import datetime
from services.gemini_service import generate_embedding
import traceback

router = APIRouter(prefix="/assuntos", tags=["assuntos"])

# ──────────────────── SCHEMAS ────────────────────

class AssuntoCreate(BaseModel):
    id_area: UUID
    assunto: str

class AssuntoUpdate(BaseModel):
    id_area: UUID
    assunto: str

class AssuntoResponse(BaseModel):
    id: UUID
    id_area: UUID
    assunto: str
    contexto: str
    criado_em: datetime
    class Config:
        from_attributes = True

# ──────────────────── ASSUNTOS ────────────────────

@router.get("/", response_model=list[AssuntoResponse])
def list_assuntos(db: Session = Depends(get_db)):
    assuntos_db = db.query(Assunto).order_by(Assunto.nome).all()
    return [{**a.__dict__, "assunto": a.nome} for a in assuntos_db]

@router.get("/area/{area_id}", response_model=list[AssuntoResponse])
def list_assuntos_pela_area(area_id: UUID, db: Session = Depends(get_db)):
    assuntos_db = db.query(Assunto).filter(Assunto.id_area == area_id).order_by(Assunto.nome).all()
    return [{**a.__dict__, "assunto": a.nome} for a in assuntos_db]

@router.post("/", response_model=AssuntoResponse, status_code=201)
def create_assunto(body: AssuntoCreate, db: Session = Depends(get_db)):
    try:
        area = db.query(Area).filter(Area.id == body.id_area).first()
        if not area:
            raise HTTPException(status_code=404, detail="Área não encontrada")

        contexto = f"{area.area} {body.assunto.strip()}"
        
        # Gera o embedding usando a API do Gemini
        try:
            vetor = generate_embedding(contexto)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao gerar embedding: {str(e)}")

        novo = Assunto(
            id_area=body.id_area,
            nome=body.assunto.strip(),
            contexto=contexto,
            embedding=vetor
        )
        db.add(novo)
        db.commit()
        db.refresh(novo)
        
        return {**novo.__dict__, "assunto": novo.nome}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro banco de dados: {str(e)}\n{traceback.format_exc()}")

@router.put("/{assunto_id}", response_model=AssuntoResponse)
def update_assunto(assunto_id: UUID, body: AssuntoUpdate, db: Session = Depends(get_db)):
    try:
        assunto_db = db.query(Assunto).filter(Assunto.id == assunto_id).first()
        if not assunto_db:
            raise HTTPException(status_code=404, detail="Assunto não encontrado")

        area = db.query(Area).filter(Area.id == body.id_area).first()
        if not area:
            raise HTTPException(status_code=404, detail="Área não encontrada")

        novo_contexto = f"{area.area} {body.assunto.strip()}"
        
        # Só regenera o embedding se o contexto mudou
        if novo_contexto != assunto_db.contexto:
            try:
                vetor = generate_embedding(novo_contexto)
                assunto_db.embedding = vetor
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao gerar embedding: {str(e)}")

        assunto_db.id_area = body.id_area
        assunto_db.nome = body.assunto.strip()
        assunto_db.contexto = novo_contexto

        db.commit()
        db.refresh(assunto_db)
        return {**assunto_db.__dict__, "assunto": assunto_db.nome}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro banco de dados: {str(e)}")

@router.delete("/{assunto_id}", status_code=200)
def delete_assunto(assunto_id: UUID, db: Session = Depends(get_db)):
    assunto_db = db.query(Assunto).filter(Assunto.id == assunto_id).first()
    if not assunto_db:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")

    # Verifica se há Dúvidas atreladas
    duvida_vinculada = db.query(Duvida).filter(Duvida.id_assunto == assunto_id).first()
    if duvida_vinculada:
        raise HTTPException(status_code=400, detail="Não é possível excluir este Assunto pois existem Dúvidas vinculadas a ele.")

    # Verifica se há Documentos atrelados
    documento_vinculado = db.query(Documento).filter(
        Documento.id_area == assunto_db.id_area,
        Documento.assunto == assunto_db.nome
    ).first()
    if documento_vinculado:
        raise HTTPException(status_code=400, detail="Não é possível excluir este Assunto pois existem Documentos vinculados a ele.")
    
    db.delete(assunto_db)
    db.commit()
    return {"message": "Assunto excluído com sucesso"}
