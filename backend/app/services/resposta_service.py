from app.models.resposta import Resposta


# =========================
# CHATBOT
# =========================

def buscar_resposta(codigo, db):

    resposta = (
        db.query(Resposta)
        .filter(Resposta.codigo == codigo)
        .first()
    )

    if resposta:
        return resposta.texto

    return "Resposta não cadastrada."


# =========================
# CRUD
# =========================

def get_all(db):
    return db.query(Resposta).all()


def get_by_id(db, id):
    return (
        db.query(Resposta)
        .filter(Resposta.id == id)
        .first()
    )


def create(db, obj_in):

    obj = Resposta(
        codigo=obj_in.codigo,
        texto=obj_in.texto
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


def update(db, id, obj_in):

    obj = get_by_id(db, id)

    if not obj:
        return None

    dados = obj_in.model_dump(exclude_unset=True)

    for campo, valor in dados.items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)

    return obj


def delete(db, id):

    obj = get_by_id(db, id)

    if obj:
        db.delete(obj)
        db.commit()