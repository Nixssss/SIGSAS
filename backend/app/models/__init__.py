# 1. Tabelas totalmente independentes (não dependem de ninguém)
from .cargos import Cargo
from .curso import Curso
from .tipo_sala import TipoSala
from .status_reserva import StatusReserva

# 2. Tabelas que dependem das de cima
from .usuario import Usuario
from .sala import Sala

# 3. Tabelas que dependem de Usuário e Sala
from .reserva import Reserva
from .sala_recurso import SalaRecurso

# 4. Outras tabelas
from .assunto import Assunto
from .erro_palavra import ErroPalavra
from .frase import Frase
from .palavras import Palavra
from .peso_palavra import PesoPalavra
from .recurso import Recurso
from .resposta import Resposta
from .tabela import Tabela

__all__ = [
    "Cargo", "Curso", "TipoSala", "StatusReserva",
    "Usuario", "Sala", "Reserva", "SalaRecurso",
    "Assunto", "ErroPalavra", "Frase", "Palavra",
    "PesoPalavra", "Recurso", "Resposta", "Tabela"
]
