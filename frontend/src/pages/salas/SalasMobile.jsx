import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import "./SalasMobile.css"
import {
  salasService,
  edificiosService,
  campiService,
  instituicoesService,
  reservasService,
  tiposSalaService,
  recursosService,
} from "../../services/adminService"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]

const HORARIOS_RESERVA = Array.from({ length: 61 }, (_, index) => {
  const totalMinutos = 8 * 60 + index * 15
  const hora = String(Math.floor(totalMinutos / 60)).padStart(2, "0")
  const minuto = String(totalMinutos % 60).padStart(2, "0")

  return `${hora}:${minuto}`
})

function formatarDataInput(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function formatarDataVisual(valor) {
  if (!valor) return ""

  const [ano, mes, dia] = valor.split("-")
  return `${dia}/${mes}/${ano}`
}

function criarDataLocal(valor) {
  if (!valor) return null

  const [ano, mes, dia] = valor.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function datasMesmoDia(dataA, dataB) {
  if (!dataA || !dataB) return false

  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  )
}

function IconeReserva({ tipo }) {
  if (tipo === "calendario") {
    return (
      <svg viewBox="0 0 24 24" className="reserva-input-icon-svg">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="reserva-input-icon-svg">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
      <path d="M7 3.5 4.5 6M17 3.5 19.5 6" />
    </svg>
  )
}


function IconeSalaMobile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4.2" y="3.2" width="15.6" height="17.6" rx="2.6" />
      <path d="M8 7.2h2M14 7.2h2M8 11.5h2M14 11.5h2M8 15.8h2M14 15.8h2" />
      <path d="M11 20.8v-4h2v4" />
    </svg>
  )
}

function IconeBuscaMobile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function IconeCapacidadeMobile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="9" cy="8.8" r="3" />
      <circle cx="17" cy="9.8" r="2.3" />
      <path d="M4.2 18.7c.8-2.8 2.7-4.3 5.8-4.3s5 1.5 5.8 4.3" />
      <path d="M15.3 18.3c.5-1.9 1.9-3 4.2-3.2" />
    </svg>
  )
}

function IconeLocalMobile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 21s6.4-5.4 6.4-11.2A6.4 6.4 0 1 0 5.6 9.8C5.6 15.6 12 21 12 21z" />
      <circle cx="12" cy="9.7" r="2.2" />
    </svg>
  )
}

function IconeRecursoMobile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.6 20 8v8l-8 4.4L4 16V8l8-4.4z" />
      <path d="m8.2 10.1 3.8 2.1 3.8-2.1M12 12.2V17" />
    </svg>
  )
}

function IconeSetaMobile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h13.5" />
      <path d="m14.2 6.8 5.1 5.2-5.1 5.2" />
    </svg>
  )
}


function horarioParaMinutos(horario) {
  if (!horario) return null

  const [hora, minuto] = String(horario).split(":").map(Number)

  if (Number.isNaN(hora) || Number.isNaN(minuto)) return null

  return hora * 60 + minuto
}

function somarMinutosHorario(horario, minutosAdicionar) {
  const minutos = horarioParaMinutos(horario)

  if (minutos === null) return ""

  const total = minutos + minutosAdicionar
  const hora = String(Math.floor(total / 60)).padStart(2, "0")
  const minuto = String(total % 60).padStart(2, "0")

  return `${hora}:${minuto}`
}

function obterMesesLetivosDisponiveis(dataBase) {
  const hoje = new Date(dataBase)
  hoje.setHours(0, 0, 0, 0)

  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth()
  const meses = []

  function adicionarIntervalo(ano, inicio, fim) {
    for (let mes = inicio; mes <= fim; mes += 1) {
      const ultimoDiaMes = new Date(ano, mes + 1, 0)
      ultimoDiaMes.setHours(23, 59, 59, 999)

      if (ultimoDiaMes >= hoje) {
        meses.push(new Date(ano, mes, 1))
      }
    }
  }

  if (mesAtual <= 5) {
    adicionarIntervalo(anoAtual, Math.max(1, mesAtual), 5)
  } else if (mesAtual === 6) {
    adicionarIntervalo(anoAtual, 7, 11)
  } else if (mesAtual <= 11) {
    adicionarIntervalo(anoAtual, Math.max(7, mesAtual), 11)
  }

  if (meses.length === 0) {
    adicionarIntervalo(anoAtual + 1, 1, 5)
  }

  return meses
}

function RelogioReserva({
  label,
  valor,
  onChange,
  aberto,
  onAbrir,
  onFechar,
  horarioMinimo = "08:00",
}) {
  const horariosDisponiveis = HORARIOS_RESERVA.filter((horario) => {
    const minutosHorario = horarioParaMinutos(horario)
    const minutosMinimo = horarioParaMinutos(horarioMinimo)

    if (minutosHorario === null || minutosMinimo === null) return true

    return minutosHorario >= minutosMinimo
  })

  function selecionarHorario(horario) {
    onChange(horario)
    onFechar()
  }

  return (
    <div className="relogio-reserva-box">
      <label className="relogio-reserva-label">{label}</label>

      <button
        type="button"
        className={`relogio-reserva-input ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor || "--:--"}</span>
        <strong>
          <IconeReserva tipo="relogio" />
        </strong>
      </button>

      {aberto && (
        <div className="relogio-reserva-panel">
          <div className="relogio-reserva-panel-header">
            <strong>{label}</strong>
            <span>08:00 às 23:00 • intervalos de 15 min</span>
          </div>

          <div className="relogio-reserva-lista">
            {horariosDisponiveis.length === 0 && (
              <span className="relogio-reserva-empty">
                Nenhum horário disponível após o início selecionado.
              </span>
            )}

            {horariosDisponiveis.map((horario) => (
              <button
                key={horario}
                type="button"
                className={
                  valor === horario
                    ? "relogio-reserva-opcao selecionado"
                    : "relogio-reserva-opcao"
                }
                onClick={() => selecionarHorario(horario)}
              >
                {horario}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarioReserva({
  label,
  valor,
  onChange,
  isDiaIndisponivel,
  minDate,
  aberto,
  onAbrir,
  onFechar,
}) {
  const hoje = new Date(minDate || new Date())
  hoje.setHours(0, 0, 0, 0)

  const mesesDisponiveis = useMemo(
    () => obterMesesLetivosDisponiveis(hoje),
    [hoje.getTime()]
  )

  function obterIndiceInicial() {
    if (!valor) return 0

    const dataSelecionada = criarDataLocal(valor)

    if (!dataSelecionada) return 0

    const indiceEncontrado = mesesDisponiveis.findIndex(
      (mes) =>
        mes.getFullYear() === dataSelecionada.getFullYear() &&
        mes.getMonth() === dataSelecionada.getMonth()
    )

    return indiceEncontrado >= 0 ? indiceEncontrado : 0
  }

  const [indiceMes, setIndiceMes] = useState(obterIndiceInicial)

  useEffect(() => {
    setIndiceMes(obterIndiceInicial())
  }, [valor, mesesDisponiveis.length])

  const mesVisivel = mesesDisponiveis[indiceMes] || mesesDisponiveis[0]
  const dataSelecionada = valor ? criarDataLocal(valor) : null

  const diasDoCalendario = useMemo(() => {
    if (!mesVisivel) return []

    const ano = mesVisivel.getFullYear()
    const mes = mesVisivel.getMonth()
    const primeiroDiaMes = new Date(ano, mes, 1)
    const ultimoDiaMes = new Date(ano, mes + 1, 0)
    const lista = []

    for (let i = 0; i < primeiroDiaMes.getDay(); i += 1) {
      lista.push(null)
    }

    for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia += 1) {
      lista.push(new Date(ano, mes, dia))
    }

    return lista
  }, [mesVisivel])

  function voltarMes() {
    setIndiceMes((indiceAtual) => Math.max(0, indiceAtual - 1))
  }

  function avancarMes() {
    setIndiceMes((indiceAtual) =>
      Math.min(mesesDisponiveis.length - 1, indiceAtual + 1)
    )
  }

  function selecionarDia(data) {
    if (!data) return

    const dataComparacao = new Date(data)
    dataComparacao.setHours(0, 0, 0, 0)

    const bloqueado =
      data.getDay() === 0 ||
      dataComparacao < hoje ||
      isDiaIndisponivel(data)

    if (bloqueado) return

    onChange(formatarDataInput(data))
    onFechar()
  }

  return (
    <div className="calendario-reserva-box">
      <label className="calendario-reserva-label">{label}</label>

      <button
        type="button"
        className={`calendario-reserva-input ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor ? formatarDataVisual(valor) : "Selecione uma data"}</span>
        <strong>
          <IconeReserva tipo="calendario" />
        </strong>
      </button>

      {aberto && (
        <div className="calendario-reserva">
          <div className="calendario-reserva-header">
            <button type="button" onClick={voltarMes} disabled={indiceMes === 0}>
              ‹
            </button>

            <strong>
              {MESES[mesVisivel.getMonth()]} de {mesVisivel.getFullYear()}
            </strong>

            <button
              type="button"
              onClick={avancarMes}
              disabled={indiceMes === mesesDisponiveis.length - 1}
            >
              ›
            </button>
          </div>

          <div className="calendario-reserva-semana">
            {DIAS_SEMANA.map((dia, index) => (
              <span
                key={`${dia}-${index}`}
                className={index === 0 ? "domingo" : ""}
              >
                {dia}
              </span>
            ))}
          </div>

          <div className="calendario-reserva-dias">
            {diasDoCalendario.map((data, index) => {
              if (!data) {
                return <span key={`vazio-${index}`} className="dia-vazio" />
              }

              const dataComparacao = new Date(data)
              dataComparacao.setHours(0, 0, 0, 0)

              const domingo = data.getDay() === 0
              const passado = dataComparacao < hoje
              const indisponivel = isDiaIndisponivel(data)
              const selecionado = datasMesmoDia(data, dataSelecionada)

              return (
                <button
                  key={formatarDataInput(data)}
                  type="button"
                  className={[
                    "calendario-dia",
                    domingo ? "domingo" : "",
                    indisponivel || passado ? "indisponivel" : "",
                    selecionado ? "selecionado" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={domingo || indisponivel || passado}
                  onClick={() => selecionarDia(data)}
                  title={
                    domingo
                      ? "Domingo indisponível"
                      : indisponivel
                      ? "Sem salas disponíveis nesta data"
                      : passado
                      ? "Data já passou"
                      : "Selecionar data"
                  }
                >
                  {data.getDate()}
                </button>
              )
            })}
          </div>

          <div className="calendario-reserva-legenda">
            <span>
              <i className="legenda-disponivel" /> Disponível
            </span>

            <span>
              <i className="legenda-indisponivel" /> Indisponível
            </span>

            <small>Meses letivos do semestre atual.</small>
          </div>
        </div>
      )}
    </div>
  )
}


function ConfirmarCancelamentoReserva({ onContinuar, onConfirmar }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(15, 23, 42, 0.18)",
        backdropFilter: "blur(1.5px)",
      }}
      onMouseDown={(evento) => evento.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-cancelamento-reserva-titulo"
        style={{
          width: "min(420px, 100%)",
          padding: "26px 24px 22px",
          borderRadius: "22px",
          background: "#ffffff",
          border: "1px solid rgba(203, 213, 225, 0.95)",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.34)",
          textAlign: "center",
        }}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 15px",
            display: "grid",
            placeItems: "center",
            borderRadius: "999px",
            background: "rgba(249, 115, 22, 0.12)",
            color: "#f59e0b",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={{
              width: "34px",
              height: "34px",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }}
          >
            <path d="M12 4.2 20.2 19H3.8L12 4.2z" />
            <path d="M12 9.3v4.4" />
            <path d="M12 16.8h.01" />
          </svg>
        </div>

        <h3
          id="confirmar-cancelamento-reserva-titulo"
          style={{
            margin: "0 0 8px",
            color: "#082f55",
            fontSize: "25px",
            lineHeight: 1.15,
            fontWeight: 950,
            letterSpacing: "-0.03em",
          }}
        >
          Cancelar reserva?
        </h3>

        <p
          style={{
            maxWidth: "320px",
            margin: "0 auto 20px",
            color: "#475569",
            fontSize: "15px",
            lineHeight: 1.45,
            fontWeight: 750,
          }}
        >
          Tem certeza que deseja sair? Os dados preenchidos não serão salvos.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onContinuar}
            style={{
              minHeight: "46px",
              padding: "0 14px",
              borderRadius: "14px",
              border: "1px solid #cbd5e1",
              background: "#eef2f7",
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Continuar editando
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            style={{
              minHeight: "46px",
              padding: "0 14px",
              borderRadius: "14px",
              border: "1px solid rgba(239, 68, 68, 0.22)",
              background: "#ef4444",
              color: "#ffffff",
              boxShadow: "0 12px 24px rgba(239, 68, 68, 0.22)",
              fontSize: "14px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Sair e cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function SalasMobile() {
  const [salas, setSalas] = useState([])
  const [edificios, setEdificios] = useState([])
  const [campi, setCampi] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [reservas, setReservas] = useState([])
  const [tiposSala, setTiposSala] = useState([])
  const [recursosDisponiveis, setRecursosDisponiveis] = useState([])

  const [busca, setBusca] = useState("")
  const [salaSelecionada, setSalaSelecionada] = useState(null)
  const [confirmacaoSaidaAberta, setConfirmacaoSaidaAberta] = useState(false)

  const [dataInicio, setDataInicio] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [motivo, setMotivo] = useState("")
  const [justificativa, setJustificativa] = useState("")
  const [qtdPessoas, setQtdPessoas] = useState("")
  const [erroReserva, setErroReserva] = useState("")
  const [sucessoReserva, setSucessoReserva] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [relogioAberto, setRelogioAberto] = useState("")
  const [calendarioAberto, setCalendarioAberto] = useState("")

  async function carregarDados() {
    try {
      setCarregandoDados(true)
      setErroReserva("")

      const [
        salasApi,
        edificiosApi,
        campiApi,
        instituicoesApi,
        reservasApi,
        tiposSalaApi,
        recursosApi,
      ] = await Promise.all([
        salasService.listar(),
        edificiosService.listar(),
        campiService.listar(),
        instituicoesService.listar(),
        reservasService.listar(),
        tiposSalaService.listar(),
        recursosService.listar(),
      ])

      setSalas(Array.isArray(salasApi) ? salasApi : [])
      setEdificios(Array.isArray(edificiosApi) ? edificiosApi : [])
      setCampi(Array.isArray(campiApi) ? campiApi : [])
      setInstituicoes(Array.isArray(instituicoesApi) ? instituicoesApi : [])
      setReservas(Array.isArray(reservasApi) ? reservasApi : [])
      setTiposSala(Array.isArray(tiposSalaApi) ? tiposSalaApi : [])
      setRecursosDisponiveis(Array.isArray(recursosApi) ? recursosApi : [])
    } catch (error) {
      console.error("Erro ao carregar dados de salas:", error)
      setErroReserva("Erro ao carregar dados das salas.")
      setSalas([])
      setEdificios([])
      setCampi([])
      setInstituicoes([])
      setReservas([])
      setTiposSala([])
      setRecursosDisponiveis([])
    } finally {
      setCarregandoDados(false)
    }
  }

  useEffect(() => {
    carregarDados()

    function atualizarSalasEReservas() {
      carregarDados()
    }

    window.addEventListener("focus", atualizarSalasEReservas)
    window.addEventListener("reservas-atualizadas", atualizarSalasEReservas)

    return () => {
      window.removeEventListener("focus", atualizarSalasEReservas)
      window.removeEventListener("reservas-atualizadas", atualizarSalasEReservas)
    }
  }, [])

  useEffect(() => {
    if (salaSelecionada || sucessoReserva) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [salaSelecionada, sucessoReserva])

  useEffect(() => {
    if (!horaInicio || !horaFim) return

    const minutosInicio = horarioParaMinutos(horaInicio)
    const minutosFim = horarioParaMinutos(horaFim)

    if (minutosInicio !== null && minutosFim !== null && minutosFim <= minutosInicio) {
      setHoraFim("")
    }
  }, [horaInicio, horaFim])

  function normalizarTexto(texto) {
    return (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getIdGenerico(item) {
    return Number(
      item?.id ||
        item?.idSala ||
        item?.idEdificio ||
        item?.idCampus ||
        item?.idInstituicao ||
        item?.idTipoSala ||
        item?.idRecurso
    )
  }

  function getTipoSala(id) {
    return (
      tiposSala.find((t) => getIdGenerico(t) === Number(id))?.nome ||
      tiposSala.find((t) => Number(t.idTipoSala) === Number(id))?.nome ||
      "?"
    )
  }

  function getNomeRecurso(id) {
    return (
      recursosDisponiveis.find((r) => getIdGenerico(r) === Number(id))?.nome ||
      recursosDisponiveis.find((r) => Number(r.idRecurso) === Number(id))
        ?.nome ||
      "?"
    )
  }

  function extrairIdsRecursos(sala) {
    if (!sala) return []

    if (Array.isArray(sala.recursos)) {
      return sala.recursos.map((recurso) => {
        if (typeof recurso === "object") {
          return getIdGenerico(recurso)
        }

        return Number(recurso)
      })
    }

    if (Array.isArray(sala.idsRecursos)) {
      return sala.idsRecursos.map((id) => Number(id))
    }

    if (Array.isArray(sala.recursosIds)) {
      return sala.recursosIds.map((id) => Number(id))
    }

    return []
  }

  function getNomesRecursos(ids = []) {
    return ids.map((id) => getNomeRecurso(id)).filter((nome) => nome !== "?")
  }

  function getNomeEdificio(id) {
    return (
      edificios.find((e) => getIdGenerico(e) === Number(id))?.nome ||
      edificios.find((e) => Number(e.idEdificio) === Number(id))?.nome ||
      "?"
    )
  }

  function getCampusPorEdificio(idEdificio) {
    const edificio = edificios.find(
      (e) =>
        getIdGenerico(e) === Number(idEdificio) ||
        Number(e.idEdificio) === Number(idEdificio)
    )

    if (!edificio) return null

    const idCampus =
      edificio.idCampus ||
      edificio.id_campus ||
      edificio.campusId ||
      edificio.idCampusFk

    return (
      campi.find((c) => getIdGenerico(c) === Number(idCampus)) ||
      campi.find((c) => Number(c.idCampus) === Number(idCampus)) ||
      null
    )
  }

  function getInstituicaoPorCampus(idCampus) {
    const campus = campi.find(
      (c) =>
        getIdGenerico(c) === Number(idCampus) ||
        Number(c.idCampus) === Number(idCampus)
    )

    if (!campus) return null

    const idInstituicao =
      campus.idInstituicao ||
      campus.id_instituicao ||
      campus.instituicaoId ||
      campus.idInstituicaoFk

    return (
      instituicoes.find((i) => getIdGenerico(i) === Number(idInstituicao)) ||
      instituicoes.find(
        (i) => Number(i.idInstituicao) === Number(idInstituicao)
      ) ||
      null
    )
  }

  function getUsuarioLogado() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")

    return {
      id: Number(usuario?.id || usuario?.idUsuario || 1),
      nome: usuario?.nome || usuario?.email || "Usuário não identificado",
      matricula: usuario?.matricula || "Não informada",
      cargo: usuario?.cargo || usuario?.perfil || "Não informado",
      instituicao: usuario?.instituicao || "Não informada",
    }
  }

  function dataHoraParaTimestamp(data, hora) {
    return new Date(`${data}T${hora}`).getTime()
  }

  function formatarDataReservaBR(data) {
    if (!data) return "Não informada"

    const texto = String(data).trim()

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      const [ano, mes, dia] = texto.slice(0, 10).split("-")
      return `${dia}/${mes}/${ano}`
    }

    const dataConvertida = new Date(texto)

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Não informada"
    }

    return dataConvertida.toLocaleDateString("pt-BR")
  }

  function formatarHoraReservaBR(hora) {
    if (!hora) return "Não informada"

    const texto = String(hora).trim()

    if (/^\d{2}:\d{2}/.test(texto)) {
      return texto.slice(0, 5)
    }

    return texto
  }

  function formatarPeriodoReserva(reserva) {
    const dataInicioFormatada = formatarDataReservaBR(reserva.dataInicio)
    const dataFimFormatada = formatarDataReservaBR(reserva.dataFim)
    const horaInicioFormatada = formatarHoraReservaBR(reserva.horaInicio)
    const horaFimFormatada = formatarHoraReservaBR(reserva.horaFim)

    if (dataInicioFormatada === dataFimFormatada) {
      return `${dataInicioFormatada}, das ${horaInicioFormatada} às ${horaFimFormatada}`
    }

    return `${dataInicioFormatada} às ${horaInicioFormatada} até ${dataFimFormatada} às ${horaFimFormatada}`
  }

  function reservaBloqueiaDia(reserva, data) {
    if (!reserva?.dataInicio || !reserva?.dataFim) return false

    if (
      Number(reserva.idStatusReserva) === 3 ||
      Number(reserva.idStatusReserva) === 4
    ) {
      return false
    }

    const inicio = criarDataLocal(reserva.dataInicio)
    const fim = criarDataLocal(reserva.dataFim)

    if (!inicio || !fim) return false

    inicio.setHours(0, 0, 0, 0)
    fim.setHours(23, 59, 59, 999)

    const dataComparacao = new Date(data)
    dataComparacao.setHours(12, 0, 0, 0)

    return dataComparacao >= inicio && dataComparacao <= fim
  }

  function salaDisponivelNoDia(sala, data) {
    if (!sala?.ativo) return false

    const reservaDaSala = reservas.find(
      (reserva) =>
        Number(reserva.idSala) === Number(sala.idSala) &&
        reservaBloqueiaDia(reserva, data)
    )

    return !reservaDaSala
  }

  function diaSemDisponibilidade(data) {
    if (data.getDay() === 0) return true

    const salasAtivas = salas.filter((sala) => sala.ativo)

    if (salasAtivas.length === 0) return true

    const existeSalaDisponivel = salasAtivas.some((sala) =>
      salaDisponivelNoDia(sala, data)
    )

    return !existeSalaDisponivel
  }

  function salaSelecionadaIndisponivelNoDia(data) {
    if (!salaSelecionada) return false

    if (data.getDay() === 0) return true

    return !salaDisponivelNoDia(salaSelecionada, data)
  }

  function existeConflitoReserva(novaReserva) {
    const inicioNova = dataHoraParaTimestamp(
      novaReserva.dataInicio,
      novaReserva.horaInicio
    )

    const fimNova = dataHoraParaTimestamp(
      novaReserva.dataFim,
      novaReserva.horaFim
    )

    return reservas.some((r) => {
      if (Number(r.idSala) !== Number(novaReserva.idSala)) return false

      if (Number(r.idStatusReserva) === 3 || Number(r.idStatusReserva) === 4) {
        return false
      }

      const inicioExistente = dataHoraParaTimestamp(r.dataInicio, r.horaInicio)
      const fimExistente = dataHoraParaTimestamp(r.dataFim, r.horaFim)

      return inicioNova < fimExistente && fimNova > inicioExistente
    })
  }

  function getReservaBloqueanteDaSala(idSala) {
    return reservas.find(
      (r) =>
        Number(r.idSala) === Number(idSala) &&
        (Number(r.idStatusReserva) === 1 || Number(r.idStatusReserva) === 2)
    )
  }

  function salaEstaAtiva(sala) {
    return sala?.ativo === true || sala?.ativo === 1 || sala?.ativo === "1"
  }

  function salaEstaBloqueada(sala) {
    return !salaEstaAtiva(sala) || Boolean(getReservaBloqueanteDaSala(sala.idSala))
  }

  function abrirReserva(sala) {
    const reservaBloqueante = getReservaBloqueanteDaSala(sala.idSala)

    if (!salaEstaAtiva(sala)) return
    if (reservaBloqueante) return

    setSalaSelecionada(sala)
    setConfirmacaoSaidaAberta(false)
    setErroReserva("")
    setDataInicio("")
    setHoraInicio("08:00")
    setDataFim("")
    setHoraFim("")
    setMotivo("")
    setJustificativa("")
    setQtdPessoas("")
    setRelogioAberto("")
    setCalendarioAberto("")
  }

  function solicitarFechamentoReserva() {
    if (carregando) return

    setRelogioAberto("")
    setCalendarioAberto("")
    setConfirmacaoSaidaAberta(true)
  }

  function continuarEditandoReserva() {
    setConfirmacaoSaidaAberta(false)
  }

  function fecharReservaConfirmado() {
    if (carregando) return

    setSalaSelecionada(null)
    setErroReserva("")
    setRelogioAberto("")
    setCalendarioAberto("")
    setConfirmacaoSaidaAberta(false)
  }

  async function confirmarReserva(e) {
    e.preventDefault()

    if (!salaSelecionada) return

    if (
      !dataInicio ||
      !horaInicio ||
      !dataFim ||
      !horaFim ||
      !motivo.trim() ||
      !qtdPessoas
    ) {
      setErroReserva("Preencha todos os campos obrigatórios.")
      return
    }

    const dataInicioObj = criarDataLocal(dataInicio)
    const dataFimObj = criarDataLocal(dataFim)

    if (
      diaSemDisponibilidade(dataInicioObj) ||
      diaSemDisponibilidade(dataFimObj)
    ) {
      setErroReserva("A data selecionada está indisponível para reservas.")
      return
    }

    if (
      salaSelecionadaIndisponivelNoDia(dataInicioObj) ||
      salaSelecionadaIndisponivelNoDia(dataFimObj)
    ) {
      setErroReserva("Esta sala não está disponível na data selecionada.")
      return
    }

    const quantidade = Number(qtdPessoas)

    if (quantidade <= 0) {
      setErroReserva("A quantidade de pessoas deve ser maior que zero.")
      return
    }

    if (quantidade > Number(salaSelecionada.capacidade)) {
      setErroReserva(
        `A quantidade excede a capacidade da sala (${salaSelecionada.capacidade}).`
      )
      return
    }

    const inicio = dataHoraParaTimestamp(dataInicio, horaInicio)
    const fim = dataHoraParaTimestamp(dataFim, horaFim)

    if (Number.isNaN(inicio) || Number.isNaN(fim)) {
      setErroReserva("Data ou horário inválido.")
      return
    }

    if (fim <= inicio) {
      setErroReserva("A data/hora final deve ser pelo menos 15 minutos após o início.")
      return
    }

    const usuarioReserva = getUsuarioLogado()

    const novaReserva = {
      idSala: salaSelecionada.idSala,
      idUsuarioReserva: usuarioReserva.id,
      nomeUsuarioReserva: usuarioReserva.nome,
      matriculaUsuarioReserva: usuarioReserva.matricula,
      cargoUsuarioReserva: usuarioReserva.cargo,
      instituicaoUsuarioReserva: usuarioReserva.instituicao,
      dataInicio,
      horaInicio,
      dataFim,
      horaFim,
      motivo: motivo.trim(),
      qtdPessoas: quantidade,
    }

    if (justificativa.trim()) {
      novaReserva.justificativa = justificativa.trim()
    }

    if (existeConflitoReserva(novaReserva)) {
      setErroReserva("Já existe uma reserva para essa sala nesse intervalo.")
      return
    }

    try {
      setCarregando(true)

      const reservaCriada = await reservasService.criar(novaReserva)

      setReservas((prev) => [...prev, reservaCriada])
      fecharReservaConfirmado()

      setSucessoReserva(true)
      window.dispatchEvent(new Event("reservas-atualizadas"))

      setTimeout(() => {
        setSucessoReserva(false)
      }, 2500)
    } catch (error) {
      console.error("Erro ao solicitar reserva:", error)

      if (error.response?.status === 409) {
        setErroReserva("Já existe uma reserva para essa sala nesse intervalo.")
      } else if (error.response?.data?.detail) {
        setErroReserva(error.response.data.detail)
      } else {
        setErroReserva("Erro ao solicitar reserva.")
      }
    } finally {
      setCarregando(false)
    }
  }

  const termoBusca = normalizarTexto(busca)

  const salasFiltradas = salas.filter((s) => {
    const campus = getCampusPorEdificio(s.idEdificio)
    const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
    const recursosSala = extrairIdsRecursos(s)
    const nomesRecursos = getNomesRecursos(recursosSala)

    return (
      normalizarTexto(s.nome).includes(termoBusca) ||
      normalizarTexto(s.numero).includes(termoBusca) ||
      normalizarTexto(getTipoSala(s.idTipoSala)).includes(termoBusca) ||
      normalizarTexto(getNomeEdificio(s.idEdificio)).includes(termoBusca) ||
      normalizarTexto(campus?.nome).includes(termoBusca) ||
      normalizarTexto(instituicao?.nome).includes(termoBusca) ||
      normalizarTexto(nomesRecursos.join(" ")).includes(termoBusca)
    )
  })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const modalReserva =
    salaSelecionada &&
    createPortal(
      <div className="salas-mobile-reserva-overlay" onMouseDown={solicitarFechamentoReserva}>
        <div
          className="salas-mobile-reserva-modal"
          onMouseDown={(evento) => evento.stopPropagation()}
        >
          <header className="salas-mobile-reserva-modal-header">
            <div>
              <span>Nova solicitação</span>
              <h3>Reservar ambiente</h3>
              <p>Escolha o período e informe os dados da sua reserva.</p>
            </div>

            <button
              type="button"
              className="salas-mobile-reserva-modal-close"
              onClick={solicitarFechamentoReserva}
              disabled={carregando}
              aria-label="Fechar reserva"
            >
              ×
            </button>
          </header>

          <div className="salas-mobile-reserva-modal-content">
            <section className="salas-mobile-reserva-room-summary">
              <span className="salas-mobile-reserva-room-icon">
                <IconeSalaMobile />
              </span>

              <div>
                <strong>{salaSelecionada.nome}</strong>
                <small>
                  {getTipoSala(salaSelecionada.idTipoSala)} · Capacidade de{" "}
                  {salaSelecionada.capacidade} pessoas
                </small>
              </div>
            </section>

            <form onSubmit={confirmarReserva} className="salas-mobile-reserva-form">
              <div className="salas-mobile-reserva-period">
                <span>Período da reserva</span>

                <CalendarioReserva
                  label="Data de início *"
                  valor={dataInicio}
                  onChange={setDataInicio}
                  isDiaIndisponivel={salaSelecionadaIndisponivelNoDia}
                  minDate={hoje}
                  aberto={calendarioAberto === "inicio"}
                  onAbrir={() => {
                    setRelogioAberto("")
                    setCalendarioAberto("inicio")
                  }}
                  onFechar={() => setCalendarioAberto("")}
                />

                <RelogioReserva
                  label="Hora de início *"
                  valor={horaInicio}
                  onChange={setHoraInicio}
                  aberto={relogioAberto === "inicio"}
                  onAbrir={() => {
                    setCalendarioAberto("")
                    setRelogioAberto("inicio")
                  }}
                  onFechar={() => setRelogioAberto("")}
                  horarioMinimo="08:00"
                />

                <CalendarioReserva
                  label="Data de fim *"
                  valor={dataFim}
                  onChange={setDataFim}
                  isDiaIndisponivel={salaSelecionadaIndisponivelNoDia}
                  minDate={hoje}
                  aberto={calendarioAberto === "fim"}
                  onAbrir={() => {
                    setRelogioAberto("")
                    setCalendarioAberto("fim")
                  }}
                  onFechar={() => setCalendarioAberto("")}
                />

                <RelogioReserva
                  label="Hora de fim *"
                  valor={horaFim}
                  onChange={setHoraFim}
                  aberto={relogioAberto === "fim"}
                  onAbrir={() => {
                    setCalendarioAberto("")
                    setRelogioAberto("fim")
                  }}
                  onFechar={() => setRelogioAberto("")}
                  horarioMinimo={
                    horaInicio ? somarMinutosHorario(horaInicio, 15) : "08:00"
                  }
                />
              </div>

              <label className="salas-mobile-reserva-form-full">
                <span>Motivo da reserva *</span>
                <input
                  placeholder="Ex.: Aula, reunião ou apresentação"
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  required
                />
              </label>

              <label>
                <span>Quantidade de pessoas *</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex.: 30"
                  value={qtdPessoas}
                  onChange={(evento) => setQtdPessoas(evento.target.value)}
                  required
                />
              </label>

              <label>
                <span>Justificativa adicional</span>
                <input
                  placeholder="Opcional"
                  value={justificativa}
                  onChange={(evento) => setJustificativa(evento.target.value)}
                />
              </label>

              {erroReserva && (
                <p className="salas-mobile-reserva-error salas-mobile-reserva-form-full">
                  {erroReserva}
                </p>
              )}

              <footer className="salas-mobile-reserva-actions">
                <button
                  type="button"
                  className="salas-mobile-reserva-cancel"
                  onClick={solicitarFechamentoReserva}
                  disabled={carregando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="salas-mobile-reserva-submit"
                  disabled={carregando}
                >
                  {carregando ? "Solicitando..." : "Confirmar reserva"}
                </button>
              </footer>
            </form>
          </div>
        </div>

        {confirmacaoSaidaAberta && (
          <ConfirmarCancelamentoReserva
            onContinuar={continuarEditandoReserva}
            onConfirmar={fecharReservaConfirmado}
          />
        )}
      </div>,
      document.body
    )

  const modalSucesso =
    sucessoReserva &&
    createPortal(
      <div className="salas-mobile-reserva-overlay">
        <div className="salas-mobile-reserva-success">
          <span>✓</span>
          <h3>Reserva solicitada!</h3>
          <p>Agora aguarde a aprovação do administrador.</p>
        </div>
      </div>,
      document.body
    )

  return (
    <div className="salas-mobile-page">
      <section className="salas-mobile-hero">
        <div className="salas-mobile-hero-decoration" aria-hidden="true">
          <span />
          <i />
        </div>

        <div>
          <span>AMBIENTES SIGSAS</span>
          <h1>Encontre a sala ideal.</h1>
          <p>Consulte capacidade, recursos e disponibilidade para a sua atividade.</p>
        </div>

        <span className="salas-mobile-hero-icon" aria-hidden="true">
          <IconeSalaMobile />
        </span>
      </section>

      <section className="salas-mobile-search-section">
        <label htmlFor="busca-salas-mobile">Pesquisar ambientes</label>

        <div className="salas-mobile-search-input">
          <IconeBuscaMobile />
          <input
            id="busca-salas-mobile"
            placeholder="Sala, tipo, recurso ou local..."
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>

        <p>
          <strong>{carregandoDados ? "—" : salasFiltradas.length}</strong>
          {salasFiltradas.length === 1 ? " ambiente encontrado" : " ambientes encontrados"}
        </p>
      </section>

      {carregandoDados && (
        <section className="salas-mobile-loading">
          <span />
          <strong>Carregando ambientes...</strong>
          <small>Buscando salas e disponibilidade no SIGSAS.</small>
        </section>
      )}

      {!carregandoDados && salasFiltradas.length > 0 && (
        <section className="salas-mobile-list">
          {salasFiltradas.map((sala) => {
            const campus = getCampusPorEdificio(sala.idEdificio)
            const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
            const reservaBloqueante = getReservaBloqueanteDaSala(sala.idSala)
            const bloqueada = salaEstaBloqueada(sala)
            const recursosSala = getNomesRecursos(extrairIdsRecursos(sala))
            const statusTexto = !salaEstaAtiva(sala)
              ? "Inativa"
              : reservaBloqueante
              ? "Indisponível"
              : "Disponível"

            return (
              <article
                className={`salas-mobile-card ${bloqueada ? "is-blocked" : "is-available"}`}
                key={sala.idSala}
              >
                <header className="salas-mobile-card-header">
                  <span className="salas-mobile-card-icon">
                    <IconeSalaMobile />
                  </span>

                  <div>
                    <small>{getTipoSala(sala.idTipoSala)}</small>
                    <h2>{sala.nome}</h2>
                    <p>{sala.numero ? `Sala ${sala.numero}` : "Ambiente acadêmico"}</p>
                  </div>

                  <span
                    className={`salas-mobile-status ${
                      statusTexto === "Disponível"
                        ? "available"
                        : statusTexto === "Inativa"
                        ? "inactive"
                        : "blocked"
                    }`}
                  >
                    {statusTexto}
                  </span>
                </header>

                <div className="salas-mobile-card-facts">
                  <div>
                    <IconeCapacidadeMobile />
                    <span>
                      <small>Capacidade</small>
                      <strong>{sala.capacidade || 0} pessoas</strong>
                    </span>
                  </div>

                  <div>
                    <IconeLocalMobile />
                    <span>
                      <small>Local</small>
                      <strong>{getNomeEdificio(sala.idEdificio)}</strong>
                    </span>
                  </div>
                </div>

                <div className="salas-mobile-resources">
                  <div className="salas-mobile-resources-title">
                    <IconeRecursoMobile />
                    <span>Recursos disponíveis</span>
                  </div>

                  {recursosSala.length ? (
                    <div className="salas-mobile-resource-chips">
                      {recursosSala.slice(0, 6).map((recurso) => (
                        <span key={`${sala.idSala}-${recurso}`}>{recurso}</span>
                      ))}

                      {recursosSala.length > 6 && (
                        <span className="salas-mobile-resource-more">
                          +{recursosSala.length - 6}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p>Nenhum recurso informado.</p>
                  )}
                </div>

                {reservaBloqueante && (
                  <div className="salas-mobile-reservation-alert">
                    <strong>Ambiente indisponível</strong>
                    <span>{formatarPeriodoReserva(reservaBloqueante)}</span>
                    <small>
                      Status: {STATUS_RESERVA[reservaBloqueante.idStatusReserva]}
                    </small>
                  </div>
                )}

                <details className="salas-mobile-details">
                  <summary>
                    <span>Ver detalhes do ambiente</span>
                    <IconeSetaMobile />
                  </summary>

                  <div>
                    <p>
                      <small>Instituição</small>
                      <strong>{instituicao?.nome || "Não informada"}</strong>
                    </p>
                    <p>
                      <small>Campus</small>
                      <strong>{campus?.nome || "Não informado"}</strong>
                    </p>
                    <p>
                      <small>Andar</small>
                      <strong>{sala.andar || "Não informado"}</strong>
                    </p>
                    <p>
                      <small>Metragem</small>
                      <strong>{sala.metragem ? `${sala.metragem} m²` : "Não informada"}</strong>
                    </p>
                  </div>
                </details>

                <button
                  type="button"
                  className={
                    bloqueada
                      ? "salas-mobile-book-button disabled"
                      : "salas-mobile-book-button"
                  }
                  disabled={bloqueada}
                  onClick={() => abrirReserva(sala)}
                >
                  {bloqueada ? (
                    !salaEstaAtiva(sala) ? "Sala inativa" : "Indisponível no momento"
                  ) : (
                    <>
                      Reservar esta sala
                      <IconeSetaMobile />
                    </>
                  )}
                </button>
              </article>
            )
          })}
        </section>
      )}

      {!carregandoDados && salasFiltradas.length === 0 && (
        <section className="salas-mobile-empty">
          <span>
            <IconeBuscaMobile />
          </span>
          <h2>Nenhum ambiente encontrado</h2>
          <p>Altere a pesquisa ou tente outro termo para localizar uma sala.</p>
          {busca && (
            <button type="button" onClick={() => setBusca("")}>
              Limpar busca
            </button>
          )}
        </section>
      )}

      {modalReserva}
      {modalSucesso}
    </div>
  )
}


export default SalasMobile
