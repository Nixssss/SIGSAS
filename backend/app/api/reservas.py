from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.db.session import get_db
from app.models.reserva import Reserva
from app.models.sala import Sala
from app.models.usuario import Usuario
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
from app.schemas.reserva import (
    ReservaCreate,
    ReservaUpdate,
    ReservaStatusUpdate,
    ReservaRead,
)
from app.services.auditoria_service import registrar_log
from app.services.email_resend_service import (
    enviar_email_reserva_criada,
    enviar_email_reserva_aprovada,
    enviar_email_reserva_recusada,
    enviar_email_reserva_cancelada,
)


router = APIRouter(prefix="/reservas", tags=["Reservas"])


STATUS_EMAIL_RESERVA = {
    1: "Pendente",
    2: "Aprovada",
    3: "Recusada",
    4: "Cancelada",
}


def buscar_usuario_reserva(db: Session, reserva: Reserva):
    if not reserva.idUsuarioReserva:
        return None

    return db.query(Usuario).filter(Usuario.id == reserva.idUsuarioReserva).first()


def buscar_nome_sala(db: Session, id_sala: int | None):
    if not id_sala:
        return "Não informada"

    sala = db.query(Sala).filter(Sala.idSala == id_sala).first()

    if not sala:
        return f"Sala #{id_sala}"

    if sala.numero:
        return f"{sala.nome} - nº {sala.numero}"

    return sala.nome


def montar_dados_email_reserva(db: Session, reserva: Reserva):
    return {
        "nome_sala": buscar_nome_sala(db, reserva.idSala),
        "solicitante": reserva.nomeUsuarioReserva,
        "matricula": reserva.matriculaUsuarioReserva,
        "cargo": reserva.cargoUsuarioReserva,
        "instituicao": reserva.instituicaoUsuarioReserva,
        "curso": reserva.cursoUsuarioReserva,
        "data_inicio": reserva.dataInicio,
        "hora_inicio": reserva.horaInicio,
        "data_fim": reserva.dataFim,
        "hora_fim": reserva.horaFim,
        "motivo": reserva.motivo,
        "qtd_pessoas": reserva.qtdPessoas,
    }


def registrar_erro_email_reserva(
    db: Session,
    request: Request,
    reserva: Reserva,
    error: Exception,
    acao: str,
):
    registrar_log(
        db=db,
        acao=acao,
        modulo="Reservas",
        etapa="email",
        descricao=f"Erro ao enviar email da reserva #{reserva.idReserva}",
        status="erro",
        erro=str(error),
        id_usuario=reserva.idUsuarioReserva,
        request=request,
    )


def tentar_enviar_email_reserva_criada(
    db: Session,
    request: Request,
    reserva: Reserva,
):
    usuario = buscar_usuario_reserva(db, reserva)

    if not usuario or not usuario.email:
        return

    try:
        enviar_email_reserva_criada(
            email=usuario.email,
            **montar_dados_email_reserva(db, reserva),
        )
    except Exception as error:
        registrar_erro_email_reserva(
            db=db,
            request=request,
            reserva=reserva,
            error=error,
            acao="EMAIL_RESERVA_CRIADA_ERRO",
        )


def tentar_enviar_email_status_reserva(
    db: Session,
    request: Request,
    reserva: Reserva,
):
    usuario = buscar_usuario_reserva(db, reserva)

    if not usuario or not usuario.email:
        return

    dados_email = montar_dados_email_reserva(db, reserva)
    justificativa = reserva.justificativa or None

    try:
        if reserva.idStatusReserva == 2:
            enviar_email_reserva_aprovada(
                email=usuario.email,
                justificativa=justificativa,
                **dados_email,
            )

        elif reserva.idStatusReserva == 3:
            enviar_email_reserva_recusada(
                email=usuario.email,
                justificativa=justificativa,
                **dados_email,
            )

        elif reserva.idStatusReserva == 4:
            enviar_email_reserva_cancelada(
                email=usuario.email,
                justificativa=justificativa,
                **dados_email,
            )

    except Exception as error:
        registrar_erro_email_reserva(
            db=db,
            request=request,
            reserva=reserva,
            error=error,
            acao="EMAIL_STATUS_RESERVA_ERRO",
        )


def montar_datetime_reserva(data_reserva, hora_reserva):
    if isinstance(data_reserva, datetime):
        data_texto = data_reserva.date().isoformat()
    elif isinstance(data_reserva, date):
        data_texto = data_reserva.isoformat()
    else:
        data_texto = str(data_reserva or "").strip()[:10]

    hora_texto = str(hora_reserva or "").strip()

    if len(hora_texto) == 5:
        hora_texto = f"{hora_texto}:00"

    return datetime.fromisoformat(f"{data_texto}T{hora_texto}")


def buscar_conflito_reserva(
    db: Session,
    id_sala: int,
    data_inicio,
    hora_inicio,
    data_fim,
    hora_fim,
    ignorar_id_reserva: int | None = None,
):
    inicio_novo = montar_datetime_reserva(data_inicio, hora_inicio)
    fim_novo = montar_datetime_reserva(data_fim or data_inicio, hora_fim)

    if fim_novo <= inicio_novo:
        raise HTTPException(
            status_code=400,
            detail="O horário final precisa ser maior que o horário inicial",
        )

    query = db.query(Reserva).filter(
        Reserva.idSala == id_sala,
        Reserva.idStatusReserva.in_([1, 2]),
    )

    if ignorar_id_reserva is not None:
        query = query.filter(Reserva.idReserva != ignorar_id_reserva)

    reservas = query.all()

    for reserva_existente in reservas:
        try:
            inicio_existente = montar_datetime_reserva(
                reserva_existente.dataInicio,
                reserva_existente.horaInicio,
            )
            fim_existente = montar_datetime_reserva(
                reserva_existente.dataFim or reserva_existente.dataInicio,
                reserva_existente.horaFim,
            )
        except Exception:
            continue

        if inicio_novo < fim_existente and fim_novo > inicio_existente:
            return reserva_existente

    return None


@router.get("", response_model=list[ReservaRead])
def listar_reservas(db: Session = Depends(get_db)):
    try:
        return db.query(Reserva).order_by(Reserva.idReserva.desc()).all()

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_RESERVAS_ERRO",
            modulo="Reservas",
            etapa="listar",
            descricao="Erro ao listar reservas",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(status_code=500, detail="Erro ao listar reservas")


@router.get("/coordenador/{idUsuario}", response_model=list[ReservaRead])
def listar_reservas_coordenador(
    idUsuario: int,
    somente_pendentes: bool = True,
    db: Session = Depends(get_db),
):
    try:
        areas_resultado = (
            db.query(Curso.id_area_curso)
            .join(UsuarioCurso, UsuarioCurso.idCurso == Curso.id)
            .filter(
                UsuarioCurso.idUsuario == idUsuario,
                Curso.id_area_curso.isnot(None),
            )
            .distinct()
            .all()
        )

        ids_areas = [linha[0] for linha in areas_resultado if linha[0] is not None]

        if not ids_areas:
            return []

        query = (
            db.query(Reserva)
            .join(Curso, Curso.id == Reserva.idCursoReserva)
            .filter(Curso.id_area_curso.in_(ids_areas))
        )

        if somente_pendentes:
            query = query.filter(Reserva.idStatusReserva == 1)

        return query.order_by(Reserva.idReserva.desc()).all()

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_RESERVAS_COORDENADOR_ERRO",
            modulo="Reservas",
            etapa="listar_coordenador",
            descricao=f"Erro ao listar reservas do coordenador #{idUsuario}",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Erro ao listar reservas do coordenador",
        )


@router.get("/{idReserva}", response_model=ReservaRead)
def buscar_reserva(idReserva: int, db: Session = Depends(get_db)):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        return reserva

    except HTTPException:
        raise

    except Exception as error:
        registrar_log(
            db=db,
            acao="BUSCAR_RESERVA_ERRO",
            modulo="Reservas",
            etapa="buscar",
            descricao=f"Erro ao buscar reserva #{idReserva}",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(status_code=500, detail="Erro ao buscar reserva")


@router.post("", response_model=ReservaRead)
def criar_reserva(
    reserva: ReservaCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        registrar_log(
            db=db,
            acao="RESERVA_MANUAL_INICIADA",
            modulo="Reservas",
            etapa="criar",
            descricao=(
                f"Usuário iniciou criação manual de reserva para sala #{reserva.idSala}, "
                f"período {reserva.dataInicio} {reserva.horaInicio} até "
                f"{reserva.dataFim} {reserva.horaFim}"
            ),
            status="iniciado",
            id_usuario=reserva.idUsuarioReserva,
            request=request,
        )

        sala = db.query(Sala).filter(Sala.idSala == reserva.idSala).first()

        if not sala:
            registrar_log(
                db=db,
                acao="RESERVA_MANUAL_ERRO",
                modulo="Reservas",
                etapa="validar_sala",
                descricao=f"Tentativa de criar reserva para sala inexistente #{reserva.idSala}",
                status="erro",
                erro="Sala não encontrada",
                id_usuario=reserva.idUsuarioReserva,
                request=request,
            )

            raise HTTPException(status_code=404, detail="Sala não encontrada")

        curso = None

        if reserva.idCursoReserva:
            curso = db.query(Curso).filter(Curso.id == reserva.idCursoReserva).first()

            if not curso:
                raise HTTPException(status_code=404, detail="Curso não encontrado")

        conflito = buscar_conflito_reserva(
            db=db,
            id_sala=reserva.idSala,
            data_inicio=reserva.dataInicio,
            hora_inicio=reserva.horaInicio,
            data_fim=reserva.dataFim,
            hora_fim=reserva.horaFim,
        )

        if conflito:
            registrar_log(
                db=db,
                acao="RESERVA_MANUAL_CONFLITO",
                modulo="Reservas",
                etapa="validar_conflito",
                descricao=(
                    f"Tentativa de criar reserva em conflito para sala #{reserva.idSala}. "
                    f"Conflito com reserva #{conflito.idReserva}"
                ),
                status="erro",
                erro="Conflito de reserva",
                id_usuario=reserva.idUsuarioReserva,
                request=request,
            )

            raise HTTPException(
                status_code=409,
                detail="Já existe uma reserva pendente ou aprovada para essa sala nesse período",
            )

        nova_reserva = Reserva(
            idSala=reserva.idSala,
            idUsuarioReserva=reserva.idUsuarioReserva,
            nomeUsuarioReserva=reserva.nomeUsuarioReserva,
            matriculaUsuarioReserva=reserva.matriculaUsuarioReserva,
            cargoUsuarioReserva=reserva.cargoUsuarioReserva,
            instituicaoUsuarioReserva=reserva.instituicaoUsuarioReserva,
            idCursoReserva=reserva.idCursoReserva,
            cursoUsuarioReserva=reserva.cursoUsuarioReserva or (curso.nome if curso else None),
            idStatusReserva=1,
            dataInicio=reserva.dataInicio,
            horaInicio=reserva.horaInicio,
            dataFim=reserva.dataFim,
            horaFim=reserva.horaFim,
            motivo=reserva.motivo,
            qtdPessoas=reserva.qtdPessoas,
        )

        db.add(nova_reserva)
        db.commit()
        db.refresh(nova_reserva)

        tentar_enviar_email_reserva_criada(
            db=db,
            request=request,
            reserva=nova_reserva,
        )

        registrar_log(
            db=db,
            acao="RESERVA_MANUAL_CONCLUIDA",
            modulo="Reservas",
            etapa="concluido",
            descricao=(
                f"Reserva #{nova_reserva.idReserva} criada manualmente para sala "
                f"#{nova_reserva.idSala} por {nova_reserva.nomeUsuarioReserva}"
            ),
            status="sucesso",
            id_usuario=nova_reserva.idUsuarioReserva,
            request=request,
        )

        return nova_reserva

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="RESERVA_MANUAL_ERRO_INTERNO",
            modulo="Reservas",
            etapa="criar",
            descricao="Erro interno ao criar reserva manual",
            status="erro",
            erro=str(error),
            id_usuario=reserva.idUsuarioReserva,
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao criar reserva")


@router.put("/{idReserva}", response_model=ReservaRead)
def atualizar_reserva(
    idReserva: int,
    dados: ReservaUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        if dados.idSala is not None:
            sala = db.query(Sala).filter(Sala.idSala == dados.idSala).first()

            if not sala:
                raise HTTPException(status_code=404, detail="Sala não encontrada")

            reserva.idSala = dados.idSala

        if dados.idCursoReserva is not None:
            curso = db.query(Curso).filter(Curso.id == dados.idCursoReserva).first()

            if not curso:
                raise HTTPException(status_code=404, detail="Curso não encontrado")

            reserva.idCursoReserva = dados.idCursoReserva
            reserva.cursoUsuarioReserva = dados.cursoUsuarioReserva or curso.nome

        campos = dados.dict(exclude_unset=True)
        campos.pop("idSala", None)
        campos.pop("idCursoReserva", None)
        campos.pop("cursoUsuarioReserva", None)

        for campo, valor in campos.items():
            setattr(reserva, campo, valor)

        conflito = buscar_conflito_reserva(
            db=db,
            id_sala=reserva.idSala,
            data_inicio=reserva.dataInicio,
            hora_inicio=reserva.horaInicio,
            data_fim=reserva.dataFim or reserva.dataInicio,
            hora_fim=reserva.horaFim,
            ignorar_id_reserva=reserva.idReserva,
        )

        if conflito:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Já existe uma reserva pendente ou aprovada para essa sala "
                    f"nesse horário. Conflito com a reserva #{conflito.idReserva}"
                ),
            )

        db.commit()
        db.refresh(reserva)

        registrar_log(
            db=db,
            acao="ATUALIZAR_RESERVA",
            modulo="Reservas",
            etapa="atualizar",
            descricao=f"Reserva #{reserva.idReserva} foi atualizada",
            status="sucesso",
            id_usuario=reserva.idUsuarioReserva,
            request=request,
        )

        return reserva

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ATUALIZAR_RESERVA_ERRO_INTERNO",
            modulo="Reservas",
            etapa="atualizar",
            descricao=f"Erro interno ao atualizar reserva #{idReserva}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao atualizar reserva")


@router.patch("/{idReserva}/status", response_model=ReservaRead)
def atualizar_status_reserva(
    idReserva: int,
    dados: ReservaStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        if dados.idStatusReserva not in [1, 2, 3, 4]:
            raise HTTPException(status_code=400, detail="Status inválido")

        status_anterior = reserva.idStatusReserva

        reserva.idStatusReserva = dados.idStatusReserva
        reserva.idUsuarioAprovacao = dados.idUsuarioAprovacao
        reserva.justificativa = dados.justificativa or ""

        db.commit()
        db.refresh(reserva)

        descricao_status = {
            1: "pendente",
            2: "aprovada",
            3: "recusada",
            4: "cancelada",
        }

        tentar_enviar_email_status_reserva(
            db=db,
            request=request,
            reserva=reserva,
        )

        registrar_log(
            db=db,
            acao="ALTERAR_STATUS_RESERVA",
            modulo="Reservas",
            etapa="status",
            descricao=(
                f"Reserva #{reserva.idReserva} teve status alterado de "
                f"{descricao_status.get(status_anterior, status_anterior)} para "
                f"{descricao_status.get(reserva.idStatusReserva, reserva.idStatusReserva)}"
            ),
            status="sucesso",
            id_usuario=dados.idUsuarioAprovacao or reserva.idUsuarioReserva,
            request=request,
        )

        return reserva

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ALTERAR_STATUS_RESERVA_ERRO_INTERNO",
            modulo="Reservas",
            etapa="status",
            descricao=f"Erro interno ao alterar status da reserva #{idReserva}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao alterar status da reserva")


@router.delete("/{idReserva}")
def excluir_reserva(
    idReserva: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        id_usuario = reserva.idUsuarioReserva
        descricao = f"Reserva #{reserva.idReserva} foi excluída"

        db.delete(reserva)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_RESERVA",
            modulo="Reservas",
            etapa="excluir",
            descricao=descricao,
            status="sucesso",
            id_usuario=id_usuario,
            request=request,
        )

        return {"message": "Reserva excluída com sucesso"}

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="EXCLUIR_RESERVA_ERRO_INTERNO",
            modulo="Reservas",
            etapa="excluir",
            descricao=f"Erro interno ao excluir reserva #{idReserva}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao excluir reserva")