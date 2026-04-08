from database import SessionLocal
from services.universo_detran import identificar_universo_detran

with SessionLocal() as db:
    pergunta = "Como tirar a primeira Habilitação?"
    pertence, id_area = identificar_universo_detran(pergunta, db, 0.50)
    print(f"[{pergunta}] Pertence: {pertence}, ID Area: {id_area}")

    pergunta = "Como tirar a primeira CNH?"
    pertence, id_area = identificar_universo_detran(pergunta, db, 0.50)
    print(f"[{pergunta}] Pertence: {pertence}, ID Area: {id_area}")
