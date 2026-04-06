from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Area
from uuid import UUID
import traceback

router = APIRouter(prefix="/areas", tags=["areas"])

class AreaCreate(BaseModel):
    area: str

class AreaResponse(BaseModel):
    id: UUID
    area: str

    class Config:
        from_attributes = True

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
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada")
    db.delete(area)
    db.commit()
    return {"message": "Área excluída com sucesso"}
