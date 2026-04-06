from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario
from auth_utils import verify_password, create_access_token, get_password_hash, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import timedelta
import traceback

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    perfil: str = "admin"

class UsuarioResponse(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    perfil: str
    ativo: bool

    class Config:
        from_attributes = True

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin_user(current_user: Usuario = Depends(get_current_user)):
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )
    return current_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        # Autenticação baseada no SQLAlchemy query
        user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
        
        if not user or not verify_password(form_data.password, user.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais incorretas ou acesso não autorizado",
                headers={"WWW-Authenticate": "Bearer"},
            )
                
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Exception: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    try:
        existing_user = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já está em uso")
            
        new_user = Usuario(
            nome=usuario_in.nome,
            email=usuario_in.email,
            senha_hash=get_password_hash(usuario_in.senha),
            perfil=usuario_in.perfil
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
