from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
import traceback

from database import get_db
from models import Usuario
from routers.auth import get_current_admin_user
from auth_utils import get_password_hash, verify_password

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# ──────────────────── SCHEMAS ────────────────────

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: str = "admin"

class UsuarioResponse(BaseModel):
    id: UUID
    nome: str
    email: str
    perfil: str
    ativo: bool

    class Config:
        from_attributes = True

class UsuarioUpdate(BaseModel):
    nome: str
    email: str
    ativo: bool

class UsuarioSenhaUpdate(BaseModel):
    senha_atual: str
    nova_senha: str
    confirmar_senha: str


# ──────────────────── ENDPOINTS ────────────────────

@router.get("/", response_model=list[UsuarioResponse])
def list_usuarios(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    return db.query(Usuario).order_by(Usuario.nome).all()


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    try:
        existing_user = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já está em uso")
            
        new_user = Usuario(
            nome=usuario_in.nome,
            email=usuario_in.email,
            senha_hash=get_password_hash(usuario_in.senha),
            perfil="admin", # Forçar que todo novo usuário criado aqui seja admin
            ativo=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Exception: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/{user_id}", response_model=UsuarioResponse)
def update_usuario(user_id: UUID, usuario_in: UsuarioUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    try:
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

        # Se mudou o e-mail, verificar se não pertence a outro usuário
        if user.email != usuario_in.email:
            existing_user = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
            if existing_user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já está em uso")

        user.nome = usuario_in.nome
        user.email = usuario_in.email
        user.ativo = usuario_in.ativo

        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Exception: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/{user_id}/senha", response_model=dict)
def update_senha(user_id: UUID, senhas_in: UsuarioSenhaUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    try:
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

        if not verify_password(senhas_in.senha_atual, user.senha_hash):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta")

        if senhas_in.nova_senha != senhas_in.confirmar_senha:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nova senha e confirmação não conferem")

        user.senha_hash = get_password_hash(senhas_in.nova_senha)
        db.commit()

        return {"message": "Senha alterada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Exception: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_msg)


@router.delete("/{user_id}", response_model=dict)
def delete_usuario(user_id: UUID, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    try:
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

        if user.id == current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode excluir a si mesmo")

        db.delete(user)
        db.commit()
        return {"message": "Usuário excluído com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Exception: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_msg)
