# 1. Tabelas Independentes (Base)
from .cargos import Cargo
from .curso import Curso
from .tipo_sala import TipoSala
from .status_reserva import StatusReserva
from .recurso import Recurso
from .assunto import Assunto
from .erro_palavra import ErroPalavra
from .frase import Frase
from .palavras import Palavra
from .peso_palavra import PesoPalavra
from .resposta import Resposta
from .tabela import Tabela

# 2. Tabelas que dependem da Base
from .usuario import Usuario
from .sala import Sala

# 3. Tabelas que dependem de tudo (Devem vir por último!)
from .reserva import Reserva
from .sala_recurso import SalaRecurso

__all__ = [
    "Assunto",
    "Cargo",
    "Curso",
    "ErroPalavra",
    "Frase",
    "Palavra",
    "PesoPalavra",
    "Recurso",
    "Reserva",
    "Resposta",
    "SalaRecurso",
    "Sala",
    "StatusReserva",
    "Tabela",
    "TipoSala",
    "Usuario"
]