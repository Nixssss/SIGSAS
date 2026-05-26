from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso
from app.models.tipo_sala_recurso import TipoSalaRecurso
from app.models.cargo import Cargo


router = APIRouter(prefix="/seed", tags=["Seed"])


TIPOS_SALA = [
    "Sala normal",
    "Laboratório de informática",
    "Laboratório de química",
    "Laboratório de física",
    "Laboratório de biologia",
    "Sala de cozinha",
    "Auditório",
    "Biblioteca",
    "Sala de reunião",
    "Sala de professores",
    "Sala administrativa",
    "Oficina",
    "Estúdio",
    "Ginásio",
    "Quadra",
]


RECURSOS = [
    "Carteiras",
    "Cadeiras",
    "Mesa do professor",
    "Lousa",
    "Quadro branco",
    "Projetor",
    "Tela de projeção",
    "Televisão",
    "Computador",
    "Computadores",
    "Notebook",
    "Internet",
    "Wi-Fi",
    "Ar-condicionado",
    "Ventilador",
    "Caixas de som",
    "Microfone",
    "Sistema de som",
    "Bancadas",
    "Pias",
    "Chuveiro de emergência",
    "Extintor",
    "Capela de exaustão",
    "Vidrarias",
    "Reagentes",
    "Equipamentos de proteção",
    "Microscópios",
    "Modelos anatômicos",
    "Esqueleto didático",
    "Fogão",
    "Forno",
    "Geladeira",
    "Freezer",
    "Bancada culinária",
    "Utensílios de cozinha",
    "Poltronas",
    "Palco",
    "Mesa de reunião",
    "Biblioteca física",
    "Estantes",
    "Cabines de estudo",
    "Impressora",
    "Scanner",
    "Armários",
    "Ferramentas",
    "Máquinas",
    "Câmera",
    "Iluminação",
    "Fundo infinito",
    "Equipamento de gravação",
    "Tatame",
    "Bolas",
    "Redes",
    "Arquibancada",
]


CARGOS = [
    "Professor",
    "Coordenador",
    "Diretor",
    "Técnico Administrativo",
    "Técnico de Laboratório",
    "Aluno",
    "Monitor",
    "Secretário",
    "Bibliotecário",
    "Administrador",
    "Supervisor",
    "Orientador",
    "Pesquisador",
    "Convidado",
]


RECURSOS_POR_TIPO = {
    "Sala normal": [
        "Carteiras",
        "Cadeiras",
        "Mesa do professor",
        "Lousa",
        "Projetor",
        "Ar-condicionado",
        "Wi-Fi",
    ],
    "Laboratório de informática": [
        "Computadores",
        "Mesa do professor",
        "Projetor",
        "Ar-condicionado",
        "Internet",
        "Wi-Fi",
        "Quadro branco",
    ],
    "Laboratório de química": [
        "Bancadas",
        "Pias",
        "Chuveiro de emergência",
        "Extintor",
        "Capela de exaustão",
        "Vidrarias",
        "Reagentes",
        "Equipamentos de proteção",
    ],
    "Laboratório de física": [
        "Bancadas",
        "Projetor",
        "Quadro branco",
        "Equipamentos de proteção",
        "Armários",
    ],
    "Laboratório de biologia": [
        "Microscópios",
        "Bancadas",
        "Pias",
        "Modelos anatômicos",
        "Esqueleto didático",
        "Projetor",
        "Equipamentos de proteção",
    ],
    "Sala de cozinha": [
        "Fogão",
        "Forno",
        "Geladeira",
        "Freezer",
        "Bancada culinária",
        "Utensílios de cozinha",
        "Pias",
    ],
    "Auditório": [
        "Poltronas",
        "Palco",
        "Projetor",
        "Tela de projeção",
        "Microfone",
        "Sistema de som",
        "Ar-condicionado",
    ],
    "Biblioteca": [
        "Biblioteca física",
        "Estantes",
        "Cabines de estudo",
        "Computador",
        "Internet",
        "Wi-Fi",
        "Impressora",
    ],
    "Sala de reunião": [
        "Mesa de reunião",
        "Cadeiras",
        "Televisão",
        "Projetor",
        "Wi-Fi",
        "Ar-condicionado",
    ],
    "Sala de professores": [
        "Mesa de reunião",
        "Cadeiras",
        "Computador",
        "Impressora",
        "Armários",
        "Wi-Fi",
    ],
    "Sala administrativa": [
        "Computador",
        "Impressora",
        "Scanner",
        "Mesa de reunião",
        "Cadeiras",
        "Armários",
        "Wi-Fi",
    ],
    "Oficina": [
        "Bancadas",
        "Ferramentas",
        "Máquinas",
        "Extintor",
        "Equipamentos de proteção",
        "Armários",
    ],
    "Estúdio": [
        "Câmera",
        "Iluminação",
        "Fundo infinito",
        "Microfone",
        "Sistema de som",
        "Equipamento de gravação",
    ],
    "Ginásio": [
        "Tatame",
        "Bolas",
        "Redes",
        "Arquibancada",
        "Sistema de som",
    ],
    "Quadra": [
        "Bolas",
        "Redes",
        "Arquibancada",
        "Sistema de som",
    ],
}


def obter_ou_criar_tipo(db: Session, nome: str):
    tipo = db.query(TipoSala).filter(TipoSala.nome == nome).first()

    if tipo:
        return tipo

    tipo = TipoSala(nome=nome)
    db.add(tipo)
    db.commit()
    db.refresh(tipo)

    return tipo


def obter_ou_criar_recurso(db: Session, nome: str):
    recurso = db.query(Recurso).filter(Recurso.nome == nome).first()

    if recurso:
        return recurso

    recurso = Recurso(nome=nome)
    db.add(recurso)
    db.commit()
    db.refresh(recurso)

    return recurso


def obter_ou_criar_cargo(db: Session, nome: str):
    cargo = db.query(Cargo).filter(Cargo.nome == nome).first()

    if cargo:
        return cargo

    cargo = Cargo(nome=nome, ativo=True)
    db.add(cargo)
    db.commit()
    db.refresh(cargo)

    return cargo


@router.post("/dados-iniciais")
def popular_dados_iniciais(db: Session = Depends(get_db)):
    tipos_criados = []
    recursos_criados = []
    cargos_criados = []
    vinculos_criados = 0

    for nome_tipo in TIPOS_SALA:
        tipo = obter_ou_criar_tipo(db, nome_tipo)
        tipos_criados.append(tipo.nome)

    for nome_recurso in RECURSOS:
        recurso = obter_ou_criar_recurso(db, nome_recurso)
        recursos_criados.append(recurso.nome)

    for nome_cargo in CARGOS:
        cargo = obter_ou_criar_cargo(db, nome_cargo)
        cargos_criados.append(cargo.nome)

    for nome_tipo, nomes_recursos in RECURSOS_POR_TIPO.items():
        tipo = obter_ou_criar_tipo(db, nome_tipo)

        for nome_recurso in nomes_recursos:
            recurso = obter_ou_criar_recurso(db, nome_recurso)

            vinculo_existente = (
                db.query(TipoSalaRecurso)
                .filter(
                    TipoSalaRecurso.idTipoSala == tipo.id,
                    TipoSalaRecurso.idRecurso == recurso.id,
                )
                .first()
            )

            if not vinculo_existente:
                vinculo = TipoSalaRecurso(
                    idTipoSala=tipo.id,
                    idRecurso=recurso.id,
                )

                db.add(vinculo)
                vinculos_criados += 1

    db.commit()

    return {
        "message": "Dados iniciais cadastrados com sucesso",
        "tiposSala": len(tipos_criados),
        "recursos": len(recursos_criados),
        "cargos": len(cargos_criados),
        "vinculosTipoSalaRecursosCriados": vinculos_criados,
    }