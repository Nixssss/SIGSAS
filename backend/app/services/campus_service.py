from app.models.usuario import Usuario
from app.models.campus import Campus


def buscar_campi_usuario(db, user_id):

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == int(user_id))
        .first()
    )

    if not usuario:
        return []

    if not usuario.idInstituicao:
        return []

    campi = (
        db.query(Campus)
        .filter(
            Campus.idInstituicao == usuario.idInstituicao
        )
        .all()
    )

    return campi