from fastapi import APIRouter

router = APIRouter()

from app.api.usuario_router import router as usuarios_router
from app.api.sala_router import router as salas_router
from app.api.reserva import router as reservas_router
from app.api.tabela_router import router as tabelas_router
from app.api.cargos_router import router as cargos_router
from app.api.cursos_router import router as cursos_router
from app.api.tipo_sala import router as tipos_sala_router
from app.api.recurso import router as recursos_router
from app.api.sala_recurso import router as sala_recursos_router
from app.api.status_reserva import router as status_reservas_router
from app.api.frase import router as frases_router
from app.api.resposta import router as respostas_router
from app.api.assunto_router import router as assuntos_router
from app.api.palavras_router import router as palavras_router
from app.api.peso_palavra import router as pesos_palavra_router
from app.api.erro_palavras import router as erros_palavra_router
from app.api.chatfluxo_router import router as chatfluxo

router.include_router(usuarios_router)
router.include_router(salas_router)
router.include_router(reservas_router)
router.include_router(tabelas_router)
router.include_router(cargos_router)
router.include_router(cursos_router)
router.include_router(tipos_sala_router)
router.include_router(recursos_router)
router.include_router(sala_recursos_router)
router.include_router(status_reservas_router)
router.include_router(frases_router)
router.include_router(respostas_router)
router.include_router(assuntos_router)
router.include_router(palavras_router)
router.include_router(pesos_palavra_router)
router.include_router(erros_palavra_router)
router.include_router(
    chatfluxo,
    prefix="/chatbot-fluxo",
    tags=["Chatbot Fluxo"]
)


