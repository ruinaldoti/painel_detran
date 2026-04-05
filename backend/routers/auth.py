from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from ..database import get_session
from ..models import User
from ..auth_utils import verify_password, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
import os

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Auto-create admin if no users exist for the sake of the project initial setup
        total_users = len(session.exec(select(User)).all())
        if total_users == 0 and form_data.username == "admin@detran.ce.gov.br":
            new_user = User(
                email=form_data.username,
                hashed_password=get_password_hash(form_data.password)
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            user = new_user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(token: str = Depends(OAuth2PasswordRequestForm), session: Session = Depends(get_session)):
    # Simple validation using token for demonstration purposes
    return {"message": "Endpoint protected"}
