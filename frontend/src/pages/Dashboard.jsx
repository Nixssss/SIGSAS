import { useEffect, useMemo, useState } from "react"
import DashboardInicio from "./DashboardInicio"
import Salas from "./Salas"
import StatusReservas from "./StatusReservas"
import ChatFluxo from "./ChatFluxo"
import ReportarProblema from "./ReportarProblema"
import SugestaoMelhoria from "./SugestaoMelhoria"
import SistemaResumo from "./SistemaResumo"
import Admin from "../components/admin/Admin"
import Chat from "./Chat"
import api from "../services/api"



function ehPerfilAdmin(perfil) {
  const perfilNormalizado = String(perfil || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

  return perfilNormalizado === "admin" || perfilNormalizado === "administrador"
}

function Dashboard({ sair }) {
  const perfil = localStorage.getItem("perfil")
  const isAdmin = ehPerfilAdmin(perfil)

  const [tela, setTela] = useState(() => (isAdmin ? "dashboard" : "salas"))
  const [adminTela, setAdminTela] = useState("resumo")
  const [tema, setTema] = useState("dark")
  
  const [buscaGlobal, setBuscaGlobal] = useState("")
  const [buscandoGlobal, setBuscandoGlobal] = useState(false)
  const [resultadosBusca, setResultadosBusca] = useState([])

  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  const [campiSidebar, setCampiSidebar] = useState([])
  const [instituicoesSidebar, setInstituicoesSidebar] = useState([])
  const [carregandoCampi, setCarregandoCampi] = useState(true)
  const [mensagemChat, setMensagemChat] = useState("")
  const [chatResposta, setChatResposta] = useState(null)
  const [carregandoChat, setCarregandoChat] = useState(false)

  const [notificacoes, setNotificacoes] = useState({
    reservasPendentes: 0,
    problemasAbertos: 0,
    sugestoesNovas: 0,
  })

  const usuarioLogado = (() => {
    try {
      return JSON.parse(localStorage.getItem("logado") || "{}")
    } catch {
      return {}
    }
  })()

  const nomeUsuario = usuarioLogado?.nome || "Usuário"
  const cargoUsuario =
    usuarioLogado?.cargo || usuarioLogado?.perfil || perfil || "SIGSAS"
  const inicialUsuario = nomeUsuario?.charAt(0)?.toUpperCase() || "U"

  useEffect(() => {
    if (!isAdmin && (tela === "dashboard" || tela === "admin")) {
      setTela("salas")
      setAdminTela("resumo")
    }
  }, [isAdmin, tela])

  useEffect(() => {
    const temaSalvo = localStorage.getItem("sigsas_tema") || "dark"

    setTema(temaSalvo)
    document.documentElement.setAttribute("data-theme", temaSalvo)
    document.body.setAttribute("data-theme", temaSalvo)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema)
    document.body.setAttribute("data-theme", tema)
    localStorage.setItem("sigsas_tema", tema)
  }, [tema])

  useEffect(() => {
    carregarCampiSidebar()

    function atualizarCampiSidebar() {
      carregarCampiSidebar()
    }

    window.addEventListener("focus", atualizarCampiSidebar)
    window.addEventListener("campi-atualizados", atualizarCampiSidebar)
    window.addEventListener("instituicoes-atualizadas", atualizarCampiSidebar)

    return () => {
      window.removeEventListener("focus", atualizarCampiSidebar)
      window.removeEventListener("campi-atualizados", atualizarCampiSidebar)
      window.removeEventListener("instituicoes-atualizadas", atualizarCampiSidebar)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      carregarNotificacoes()
    }
  }, [isAdmin])

  useEffect(() => {
    const termo = buscaGlobal.trim()

    if (termo.length < 2) {
      setResultadosBusca([])
      return
    }

    const timeout = setTimeout(() => {
      buscarNoSistema(termo)
    }, 350)

    return () => clearTimeout(timeout)
  }, [buscaGlobal])

  const totalNotificacoes =
    notificacoes.reservasPendentes +
    notificacoes.problemasAbertos +
    notificacoes.sugestoesNovas

  function extrairListaDaResposta(response, chavePrincipal) {
    const dados = response?.data

    if (Array.isArray(dados)) return dados
    if (Array.isArray(dados?.data)) return dados.data
    if (Array.isArray(dados?.dados)) return dados.dados
    if (Array.isArray(dados?.items)) return dados.items
    if (Array.isArray(dados?.results)) return dados.results
    if (Array.isArray(dados?.[chavePrincipal])) return dados[chavePrincipal]

    return []
  }

  async function carregarCampiSidebar() {
    try {
      setCarregandoCampi(true)

      const [campiResponse, instituicoesResponse] = await Promise.all([
        api.get("/campi"),
        api.get("/instituicoes"),
      ])

      const campi = extrairListaDaResposta(campiResponse, "campi")
      const instituicoes = extrairListaDaResposta(
        instituicoesResponse,
        "instituicoes"
      )

      console.log("[SIGSAS] Campi sidebar:", campi)
      console.log("[SIGSAS] Instituições sidebar:", instituicoes)

      setCampiSidebar(campi)
      setInstituicoesSidebar(instituicoes)
    } catch (error) {
      console.error("Erro ao carregar campi na sidebar:", error)
      setCampiSidebar([])
      setInstituicoesSidebar([])
    } finally {
      setCarregandoCampi(false)
    }
  }

  async function carregarNotificacoes() {
    if (!isAdmin) return

    try {
      const resultados = await Promise.allSettled([
        api.get("/reservas"),
        api.get("/reportes-problemas"),
        api.get("/sugestoes-melhorias"),
      ])

      const reservas =
        resultados[0].status === "fulfilled" &&
        Array.isArray(resultados[0].value.data)
          ? resultados[0].value.data
          : []

      const problemas =
        resultados[1].status === "fulfilled" &&
        Array.isArray(resultados[1].value.data)
          ? resultados[1].value.data
          : []

      const sugestoes =
        resultados[2].status === "fulfilled" &&
        Array.isArray(resultados[2].value.data)
          ? resultados[2].value.data
          : []

      setNotificacoes({
        reservasPendentes: reservas.filter((r) => r.idStatusReserva === 1)
          .length,
        problemasAbertos: problemas.filter((p) =>
          ["Aberto", "Em análise"].includes(p.status)
        ).length,
        sugestoesNovas: sugestoes.filter((s) =>
          ["Nova", "Em análise"].includes(s.status)
        ).length,
      })
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    }
  }

  function alternarTema() {
    setTema((atual) => (atual === "dark" ? "light" : "dark"))
  }

  function handleSair() {
    localStorage.removeItem("token")
    localStorage.removeItem("perfil")
    localStorage.removeItem("logado")
    sair()
  }

  function fecharPaineisFlutuantes() {
    setNotificacoesAbertas(false)
    setPerfilAberto(false)
    setMenuMobileAberto(false)
  }

  function selecionarTela(id) {
    if (!isAdmin && (id === "dashboard" || id === "admin")) {
      setTela("salas")
      setAdminTela("resumo")
      fecharPaineisFlutuantes()
      return
    }

    setTela(id)
    fecharPaineisFlutuantes()
  }

  function abrirMenuMobile() {
    setMenuMobileAberto(true)
    setNotificacoesAbertas(false)
    setPerfilAberto(false)
  }

  function abrirAdmin(telaAdmin = "resumo") {
    if (!isAdmin) {
      setTela("salas")
      setAdminTela("resumo")
      fecharPaineisFlutuantes()
      return
    }

    setTela("admin")
    setAdminTela(telaAdmin)
    fecharPaineisFlutuantes()
  }

  function irParaDashboard() {
    if (!isAdmin) {
      setTela("salas")
      fecharPaineisFlutuantes()
      return
    }

    setTela("dashboard")
    fecharPaineisFlutuantes()
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getIdCampus(campus) {
    return (
      campus?.idCampus ||
      campus?.id ||
      campus?.id_campus ||
      campus?.idcampus ||
      campus?.codigo ||
      campus?.nome
    )
  }

  function getNomeCampus(campus) {
    return (
      campus?.nome ||
      campus?.nomeCampus ||
      campus?.nome_campus ||
      campus?.descricao ||
      "Campus sem nome"
    )
  }

  function getIdInstituicaoCampus(campus) {
    return (
      campus?.idInstituicao ||
      campus?.id_instituicao ||
      campus?.instituicaoId ||
      campus?.idInstituicaoFk ||
      campus?.instituicao_id ||
      campus?.instituicao?.id ||
      campus?.instituicao?.idInstituicao
    )
  }

  function getIdInstituicao(instituicao) {
    return (
      instituicao?.idInstituicao ||
      instituicao?.id ||
      instituicao?.id_instituicao ||
      instituicao?.codigo ||
      instituicao?.nome
    )
  }

  function getNomeInstituicao(instituicao) {
    return (
      instituicao?.nome ||
      instituicao?.nomeInstituicao ||
      instituicao?.nome_instituicao ||
      instituicao?.sigla ||
      "Instituição sem nome"
    )
  }

  function getNomeInstituicaoDoCampus(campus) {
    if (campus?.instituicao?.nome) return campus.instituicao.nome
    if (campus?.instituicao?.sigla) return campus.instituicao.sigla
    if (campus?.nomeInstituicao) return campus.nomeInstituicao
    if (campus?.instituicaoNome) return campus.instituicaoNome
    if (campus?.instituicao) {
      if (typeof campus.instituicao === "string") return campus.instituicao
    }

    const idInstituicaoCampus = getIdInstituicaoCampus(campus)

    const instituicaoEncontrada = instituicoesSidebar.find(
      (instituicao) =>
        String(getIdInstituicao(instituicao)) === String(idInstituicaoCampus)
    )

    return instituicaoEncontrada
      ? getNomeInstituicao(instituicaoEncontrada)
      : "Instituição não informada"
  }

  function campusEstaAtivo(campus) {
    if (campus?.ativo === undefined || campus?.ativo === null) return true

    return (
      campus.ativo === true ||
      campus.ativo === 1 ||
      campus.ativo === "1" ||
      String(campus.ativo).toLowerCase() === "true" ||
      String(campus.ativo).toLowerCase() === "ativo"
    )
  }

  async function buscarNoSistema(termo) {
    setBuscandoGlobal(true)

    try {
      const requisicoes = [
        api.get("/salas"),
        api.get("/reservas"),
        api.get("/reportes-problemas"),
        api.get("/sugestoes-melhorias"),
      ]

      if (isAdmin) {
        requisicoes.push(api.get("/usuarios"))
      }

      const resultados = await Promise.allSettled(requisicoes)

      const salas =
        resultados[0].status === "fulfilled" &&
        Array.isArray(resultados[0].value.data)
          ? resultados[0].value.data
          : []

      const reservas =
        resultados[1].status === "fulfilled" &&
        Array.isArray(resultados[1].value.data)
          ? resultados[1].value.data
          : []

      const problemas =
        resultados[2].status === "fulfilled" &&
        Array.isArray(resultados[2].value.data)
          ? resultados[2].value.data
          : []

      const sugestoes =
        resultados[3].status === "fulfilled" &&
        Array.isArray(resultados[3].value.data)
          ? resultados[3].value.data
          : []

      const usuarios =
        isAdmin &&
        resultados[4]?.status === "fulfilled" &&
        Array.isArray(resultados[4].value.data)
          ? resultados[4].value.data
          : []

      const termoNormalizado = normalizarTexto(termo)
      const itens = []

      salas.forEach((sala) => {
        const texto = [
          sala.nome,
          sala.numero,
          sala.andar,
          sala.tipo,
          sala.tipoSala,
          sala.campus,
          sala.edificio,
          sala.instituicao,
        ].join(" ")

        if (normalizarTexto(texto).includes(termoNormalizado)) {
          itens.push({
            id: `sala-${sala.id || sala.id}`,
            tipo: "Sala",
            titulo: `${sala.nome || "Sala"} ${
              sala.numero ? `| nº ${sala.numero}` : ""
            }`,
            descricao: `${sala.tipo || sala.tipoSala || "Ambiente"} • Capacidade ${
              sala.capacidade || "—"
            } pessoas`,
            destino: "salas",
            icone: "▦",
          })
        }
      })

      reservas.forEach((reserva) => {
        const texto = [
          reserva.idReserva,
          reserva.nomeUsuarioReserva,
          reserva.motivo,
          reserva.instituicaoUsuarioReserva,
          reserva.cargoUsuarioReserva,
          reserva.dataInicio,
          reserva.horaInicio,
          reserva.idStatusReserva,
        ].join(" ")

        if (normalizarTexto(texto).includes(termoNormalizado)) {
          itens.push({
            id: `reserva-${reserva.idReserva}`,
            tipo: "Reserva",
            titulo: `Reserva #${reserva.idReserva}`,
            descricao: `${reserva.nomeUsuarioReserva || "Usuário"} • ${
              reserva.dataInicio || "Data não informada"
            } ${reserva.horaInicio || ""}`,
            destino: "statusReservas",
            icone: "◷",
          })
        }
      })

      problemas.forEach((problema) => {
        const texto = [
          problema.titulo,
          problema.descricao,
          problema.status,
          problema.modulo,
          problema.nomeUsuario,
          problema.emailUsuario,
        ].join(" ")

        if (normalizarTexto(texto).includes(termoNormalizado)) {
          itens.push({
            id: `problema-${problema.id}`,
            tipo: "Problema",
            titulo: problema.titulo,
            descricao: `${problema.status || "Aberto"} • ${
              problema.modulo || "Sem módulo"
            }`,
            destino: isAdmin ? "admin-problemas" : "problema",
            icone: "⚠",
          })
        }
      })

      sugestoes.forEach((sugestao) => {
        const texto = [
          sugestao.titulo,
          sugestao.descricao,
          sugestao.status,
          sugestao.modulo,
          sugestao.categoria,
          sugestao.nomeUsuario,
          sugestao.emailUsuario,
        ].join(" ")

        if (normalizarTexto(texto).includes(termoNormalizado)) {
          itens.push({
            id: `sugestao-${sugestao.id}`,
            tipo: "Sugestão",
            titulo: sugestao.titulo,
            descricao: `${sugestao.status || "Nova"} • ${
              sugestao.categoria || "Melhoria"
            }`,
            destino: isAdmin ? "admin-sugestoes" : "sugestao",
            icone: "◇",
          })
        }
      })

      usuarios.forEach((usuario) => {
        const texto = [
          usuario.nome,
          usuario.email,
          usuario.perfil,
          usuario.matricula,
          usuario.cargo,
          usuario.instituicao,
        ].join(" ")

        if (normalizarTexto(texto).includes(termoNormalizado)) {
          itens.push({
            id: `usuario-${usuario.id}`,
            tipo: "Usuário",
            titulo: usuario.nome,
            descricao: `${usuario.email} • ${usuario.perfil}`,
            destino: "admin-usuarios",
            icone: "👤",
          })
        }
      })

      setResultadosBusca(itens.slice(0, 8))
    } catch (error) {
      console.error("Erro na busca global:", error)
      setResultadosBusca([])
    } finally {
      setBuscandoGlobal(false)
    }
  }

  function abrirResultado(resultado) {
    if (resultado.destino === "admin-problemas") {
      abrirAdmin("problemas")
    } else if (resultado.destino === "admin-sugestoes") {
      abrirAdmin("sugestoes")
    } else if (resultado.destino === "admin-usuarios") {
      abrirAdmin("usuarios")
    } else {
      setTela(resultado.destino)
      fecharPaineisFlutuantes()
    }

    setBuscaGlobal("")
    setResultadosBusca([])
  }

  function abrirNotificacao(tipo) {
    if (!isAdmin) return

    if (tipo === "reservas") {
      abrirAdmin("reservas")
    }

    if (tipo === "problemas") {
      abrirAdmin("problemas")
    }

    if (tipo === "sugestoes") {
      abrirAdmin("sugestoes")
    }

    setNotificacoesAbertas(false)
  }

  function BotaoMenu({ id, icon, children, onClick }) {
    return (
      <button
        className={tela === id ? "active" : ""}
        onClick={onClick || (() => selecionarTela(id))}
      >
        <span>{icon}</span>
        {children}
      </button>
    )
  }

  const tituloTela = useMemo(() => {
    if (tela === "dashboard" && isAdmin) return "Dashboard"
    if (tela === "sistema") return "Visão do Sistema"
    if (tela === "salas") return "Salas e Ambientes"
    if (tela === "statusReservas") return "Reservas"
    if (tela === "chatbot") return "Chatbot SIGSAS"
    if (tela === "problema") return "Reportar Problema"
    if (tela === "sugestao") return "Sugestões"
    if (tela === "admin" && isAdmin) return "Administração"
    return "Salas e Ambientes"
  }, [tela, isAdmin])

  return (
    <div className={`dashboard app-shell ${menuMobileAberto ? "mobile-menu-open" : ""}`}>
      <header className="mobile-appbar">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={abrirMenuMobile}
          aria-label="Abrir menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="mobile-appbar-brand">
          <div className="mobile-brand-icon">⬡</div>
          <div>
            <strong>SIGSAS</strong>
            <small>{tituloTela}</small>
          </div>
        </div>

        <div className="mobile-appbar-actions">
          {isAdmin && (
            <button
              type="button"
              className="mobile-icon-button"
              onClick={() => abrirMenuMobile()}
              aria-label="Abrir notificações"
            >
              🔔
              {totalNotificacoes > 0 && (
                <span className="mobile-notification-count">{totalNotificacoes}</span>
              )}
            </button>
          )}

          <button
            type="button"
            className="mobile-profile-chip"
            onClick={abrirMenuMobile}
            aria-label="Abrir perfil"
          >
            {inicialUsuario}
          </button>
        </div>
      </header>

      {menuMobileAberto && (
        <div className="mobile-menu-layer">
          <button
            type="button"
            className="mobile-menu-backdrop"
            onClick={() => setMenuMobileAberto(false)}
            aria-label="Fechar menu"
          />

          <aside className="mobile-drawer">
            <div className="mobile-drawer-header">
              <div className="sidebar-brand mobile-drawer-brand">
                <div className="brand-icon">⬡</div>

                <div>
                  <h2>SIGSAS</h2>
                  <span>Gestão Inteligente de Salas</span>
                </div>
              </div>

              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMenuMobileAberto(false)}
                aria-label="Fechar menu"
              >
                ×
              </button>
            </div>

            <div className="mobile-user-card">
              <span className="profile-avatar large">{inicialUsuario}</span>

              <div>
                <strong>{nomeUsuario}</strong>
                <small>{cargoUsuario}</small>
              </div>
            </div>

            <div className="mobile-search-card">
              <label>Busca rápida</label>
              <input
                value={buscaGlobal}
                onChange={(e) => setBuscaGlobal(e.target.value)}
                placeholder={
                  isAdmin
                    ? "Buscar salas, reservas, usuários..."
                    : "Buscar salas e reservas..."
                }
              />

              {buscaGlobal.trim().length >= 2 && (
                <div className="mobile-search-results">
                  {buscandoGlobal && <span>Buscando...</span>}

                  {!buscandoGlobal && resultadosBusca.length === 0 && (
                    <span>Nenhum resultado encontrado.</span>
                  )}

                  {!buscandoGlobal &&
                    resultadosBusca.map((resultado) => (
                      <button
                        key={resultado.id}
                        type="button"
                        onClick={() => abrirResultado(resultado)}
                      >
                        <span>{resultado.icone}</span>
                        <div>
                          <strong>{resultado.titulo}</strong>
                          <small>{resultado.tipo} • {resultado.descricao}</small>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <nav className="mobile-drawer-nav">
              {isAdmin && (
                <button
                  type="button"
                  className={tela === "dashboard" ? "active" : ""}
                  onClick={() => selecionarTela("dashboard")}
                >
                  <span>⌂</span>
                  Dashboard
                </button>
              )}

              <button
                type="button"
                className={tela === "sistema" ? "active" : ""}
                onClick={() => selecionarTela("sistema")}
              >
                <span>◎</span>
                Visão do Sistema
              </button>

              <button
                type="button"
                className={tela === "salas" ? "active" : ""}
                onClick={() => selecionarTela("salas")}
              >
                <span>▦</span>
                Salas e Ambientes
              </button>

              <button
                type="button"
                className={tela === "statusReservas" ? "active" : ""}
                onClick={() => selecionarTela("statusReservas")}
              >
                <span>◷</span>
                Reservas
              </button>

              <button
                type="button"
                className={tela === "chatbot" ? "active" : ""}
                onClick={() => selecionarTela("chatbot")}
              >
                <span>☻</span>
                Chatbot
              </button>

              <button
                type="button"
                className={tela === "problema" ? "active" : ""}
                onClick={() => selecionarTela("problema")}
              >
                <span>⚠</span>
                Reportar Problema
              </button>

              <button
                type="button"
                className={tela === "sugestao" ? "active" : ""}
                onClick={() => selecionarTela("sugestao")}
              >
                <span>◇</span>
                Sugestões
              </button>
            </nav>

            {isAdmin && (
              <section className="mobile-admin-section">
                <div className="mobile-section-title">
                  <strong>Administração</strong>
                  <small>Acesso administrativo</small>
                </div>

                <div className="mobile-admin-grid">
                  <button className={tela === "admin" && adminTela === "resumo" ? "active" : ""} onClick={() => abrirAdmin("resumo")} type="button">Resumo</button>
                  <button className={tela === "admin" && adminTela === "instituicoes" ? "active" : ""} onClick={() => abrirAdmin("instituicoes")} type="button">Instituições</button>
                  <button className={tela === "admin" && adminTela === "campi" ? "active" : ""} onClick={() => abrirAdmin("campi")} type="button">Campi</button>
                  <button className={tela === "admin" && adminTela === "edificios" ? "active" : ""} onClick={() => abrirAdmin("edificios")} type="button">Edifícios</button>
                  <button className={tela === "admin" && adminTela === "salas" ? "active" : ""} onClick={() => abrirAdmin("salas")} type="button">Salas</button>
                  <button className={tela === "admin" && adminTela === "reservas" ? "active" : ""} onClick={() => abrirAdmin("reservas")} type="button">Reservas</button>
                  <button className={tela === "admin" && adminTela === "usuarios" ? "active" : ""} onClick={() => abrirAdmin("usuarios")} type="button">Usuários</button>
                  <button className={tela === "admin" && adminTela === "auditoria" ? "active" : ""} onClick={() => abrirAdmin("auditoria")} type="button">Auditoria</button>
                  <button className={tela === "admin" && adminTela === "problemas" ? "active" : ""} onClick={() => abrirAdmin("problemas")} type="button">Problemas</button>
                  <button className={tela === "admin" && adminTela === "sugestoes" ? "active" : ""} onClick={() => abrirAdmin("sugestoes")} type="button">Sugestões</button>
                  <button className={tela === "admin" && adminTela === "cadastro" ? "active" : ""} onClick={() => abrirAdmin("cadastro")} type="button">Cadastro</button>
                </div>
              </section>
            )}

            {isAdmin && (
              <section className="mobile-notifications-card">
                <div className="mobile-section-title">
                  <strong>Notificações</strong>
                  <small>{totalNotificacoes} pendência(s)</small>
                </div>

                <div className="mobile-notifications-grid">
                  <button type="button" onClick={() => abrirNotificacao("reservas")}>
                    <strong>{notificacoes.reservasPendentes}</strong>
                    <span>Reservas</span>
                  </button>

                  <button type="button" onClick={() => abrirNotificacao("problemas")}>
                    <strong>{notificacoes.problemasAbertos}</strong>
                    <span>Problemas</span>
                  </button>

                  <button type="button" onClick={() => abrirNotificacao("sugestoes")}>
                    <strong>{notificacoes.sugestoesNovas}</strong>
                    <span>Sugestões</span>
                  </button>
                </div>
              </section>
            )}

            <section className="mobile-campi-card">
              <div className="mobile-section-title">
                <strong>Campi cadastrados</strong>
                <button type="button" onClick={carregarCampiSidebar}>↻</button>
              </div>

              <div className="mobile-campi-list">
                {carregandoCampi && <span>Carregando campi...</span>}

                {!carregandoCampi && campiSidebar.length === 0 && (
                  <span>Nenhum campus cadastrado.</span>
                )}

                {!carregandoCampi &&
                  campiSidebar.map((campus) => {
                    const ativo = campusEstaAtivo(campus)

                    return (
                      <div className="mobile-campus-item" key={getIdCampus(campus)}>
                        <div>
                          <strong>{getNomeCampus(campus)}</strong>
                          <small>{getNomeInstituicaoDoCampus(campus)}</small>
                        </div>

                        <i className={ativo ? "online" : "offline"} />
                      </div>
                    )
                  })}
              </div>
            </section>

            <div className="mobile-drawer-footer">
              <button type="button" onClick={alternarTema}>
                {tema === "dark" ? "☀ Tema claro" : "☾ Tema escuro"}
              </button>

              <button type="button" className="danger" onClick={handleSair}>
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="sidebar modern-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">⬡</div>

          <div>
            <h2>SIGSAS</h2>
            <span>Gestão Inteligente de Salas</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <BotaoMenu id="dashboard" icon="⌂">
              Dashboard
            </BotaoMenu>
          )}

          <BotaoMenu id="sistema" icon="◎">
            Visão do Sistema
          </BotaoMenu>

          <BotaoMenu id="salas" icon="▦">
            Salas e Ambientes
          </BotaoMenu>

          <BotaoMenu id="statusReservas" icon="◷">
            Reservas
          </BotaoMenu>

          <BotaoMenu id="chatbot" icon="☻">
            Chatbot
          </BotaoMenu>

          <BotaoMenu id="problema" icon="⚠">
            Reportar Problema
          </BotaoMenu>

          <BotaoMenu id="sugestao" icon="◇">
            Sugestões
          </BotaoMenu>
          <BotaoMenu id="chat" icon="☻">
            Chatbot
          </BotaoMenu>

          {isAdmin && (
            <>
              <button
                className={tela === "admin" ? "active" : ""}
                onClick={() => abrirAdmin("resumo")}
              >
                <span>⚙</span>
                Admin
              </button>

              {tela === "admin" && (
                <div className="admin-submenu modern-submenu">
                  <button
                    className={adminTela === "resumo" ? "active" : ""}
                    onClick={() => abrirAdmin("resumo")}
                  >
                    Resumo
                  </button>

                  <button
                    className={adminTela === "instituicoes" ? "active" : ""}
                    onClick={() => abrirAdmin("instituicoes")}
                  >
                    Instituições
                  </button>

                  <button
                    className={adminTela === "campi" ? "active" : ""}
                    onClick={() => abrirAdmin("campi")}
                  >
                    Campi
                  </button>

                  <button
                    className={adminTela === "edificios" ? "active" : ""}
                    onClick={() => abrirAdmin("edificios")}
                  >
                    Edifícios
                  </button>

                  <button
                    className={adminTela === "salas" ? "active" : ""}
                    onClick={() => abrirAdmin("salas")}
                  >
                    Salas Admin
                  </button>

                  <button
                    className={adminTela === "reservas" ? "active" : ""}
                    onClick={() => abrirAdmin("reservas")}
                  >
                    Reservas
                  </button>

                  <button
                    className={adminTela === "usuarios" ? "active" : ""}
                    onClick={() => abrirAdmin("usuarios")}
                  >
                    Usuários
                  </button>

                  <button
                    className={adminTela === "auditoria" ? "active" : ""}
                    onClick={() => abrirAdmin("auditoria")}
                  >
                    Auditoria
                  </button>

                  <button
                    className={adminTela === "problemas" ? "active" : ""}
                    onClick={() => abrirAdmin("problemas")}
                  >
                    Problemas
                  </button>

                  <button
                    className={adminTela === "sugestoes" ? "active" : ""}
                    onClick={() => abrirAdmin("sugestoes")}
                  >
                    Sugestões
                  </button>

                  <button
                    className={adminTela === "cadastro" ? "active" : ""}
                    onClick={() => abrirAdmin("cadastro")}
                  >
                    Cadastro
                  </button>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-campi-card">
          <div className="sidebar-campi-header">
            <strong>Campi cadastrados</strong>

            <button
              type="button"
              onClick={carregarCampiSidebar}
              title="Atualizar campi"
            >
              ↻
            </button>
          </div>

          {carregandoCampi && (
            <div className="sidebar-campus-card">
              <div>
                <strong>Carregando...</strong>
                <span>Buscando campi</span>
              </div>

              <div className="mini-pulse" />
            </div>
          )}

          {!carregandoCampi && campiSidebar.length === 0 && (
            <div className="sidebar-campus-card">
              <div>
                <strong>Nenhum campus</strong>
                <span>Cadastrar no Admin</span>
              </div>

              <div className="mini-pulse offline" />
            </div>
          )}

          {!carregandoCampi &&
            campiSidebar.map((campus) => {
              const ativo = campusEstaAtivo(campus)

              return (
                <div className="sidebar-campus-card" key={getIdCampus(campus)}>
                  <div>
                    <strong>{getNomeCampus(campus)}</strong>
                    <span className="campus-instituicao-sidebar">
                      {getNomeInstituicaoDoCampus(campus)}
                    </span>
                    <small>{ativo ? "Online" : "Inativo"}</small>
                  </div>

                  <div className={ativo ? "mini-pulse" : "mini-pulse offline"} />
                </div>
              )
            })}
        </div>

        <div className="sidebar-wave-card">
          <div className="wave-lines">
            <span />
            <span />
            <span />
          </div>

          <strong>SIGSAS Acadêmico</strong>
          <p>Gestão eficiente de espaços para o sucesso acadêmico.</p>
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={alternarTema}>
            {tema === "dark" ? "☀ Tema claro" : "☾ Tema escuro"}
          </button>

          <button className="logout-btn" onClick={handleSair}>
            Sair
          </button>
        </div>
      </aside>

      <main className="content modern-content">
        <div className="topbar">
          <div>
            <span className="topbar-label">SIGSAS</span>
            <h1>{tituloTela}</h1>
          </div>

          <div className="topbar-actions">
            <div className="global-search">
              <input
                value={buscaGlobal}
                onChange={(e) => setBuscaGlobal(e.target.value)}
                placeholder={
                  isAdmin
                    ? "Buscar salas, reservas, usuários..."
                    : "Buscar salas e reservas..."
                }
              />

              {buscaGlobal.trim().length >= 2 && (
                <div className="global-search-panel">
                  <div className="global-search-header">
                    <strong>Busca global</strong>
                    <span>
                      {buscandoGlobal
                        ? "Buscando..."
                        : `${resultadosBusca.length} resultado(s)`}
                    </span>
                  </div>

                  {buscandoGlobal && (
                    <div className="global-search-loading">
                      Consultando dados do sistema...
                    </div>
                  )}

                  {!buscandoGlobal &&
                    resultadosBusca.map((resultado) => (
                      <button
                        key={resultado.id}
                        className="global-result"
                        onClick={() => abrirResultado(resultado)}
                      >
                        <span className="global-result-icon">
                          {resultado.icone}
                        </span>

                        <div>
                          <strong>{resultado.titulo}</strong>
                          <small>
                            {resultado.tipo} • {resultado.descricao}
                          </small>
                        </div>
                      </button>
                    ))}

                  {!buscandoGlobal && resultadosBusca.length === 0 && (
                    <div className="global-search-empty">
                      Nenhum resultado encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="topbar-notifications">
                <button
                  type="button"
                  className="notification-button"
                  onClick={() => {
                    setNotificacoesAbertas((atual) => !atual)
                    setPerfilAberto(false)
                  }}
                >
                  🔔
                  {totalNotificacoes > 0 && (
                    <span className="notification-count">
                      {totalNotificacoes}
                    </span>
                  )}
                </button>

                {notificacoesAbertas && (
                  <div className="notifications-panel">
                    <div className="notifications-header">
                      <strong>Notificações</strong>
                      <button onClick={carregarNotificacoes}>Atualizar</button>
                    </div>

                    <button
                      className="notification-item"
                      onClick={() => abrirNotificacao("reservas")}
                    >
                      <span className="notification-icon warning">◷</span>
                      <div>
                        <strong>{notificacoes.reservasPendentes}</strong>
                        <small>Reservas pendentes para análise</small>
                      </div>
                    </button>

                    <button
                      className="notification-item"
                      onClick={() => abrirNotificacao("problemas")}
                    >
                      <span className="notification-icon danger">⚠</span>
                      <div>
                        <strong>{notificacoes.problemasAbertos}</strong>
                        <small>Problemas abertos ou em análise</small>
                      </div>
                    </button>

                    <button
                      className="notification-item"
                      onClick={() => abrirNotificacao("sugestoes")}
                    >
                      <span className="notification-icon info">◇</span>
                      <div>
                        <strong>{notificacoes.sugestoesNovas}</strong>
                        <small>Sugestões novas ou em análise</small>
                      </div>
                    </button>

                    {totalNotificacoes === 0 && (
                      <div className="notifications-empty">
                        Nenhuma pendência no momento.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="topbar-profile">
              <button
                type="button"
                className="profile-button"
                onClick={() => {
                  setPerfilAberto((atual) => !atual)
                  setNotificacoesAbertas(false)
                }}
              >
                <span className="profile-avatar">{inicialUsuario}</span>

                <div className="profile-info">
                  <strong>{nomeUsuario}</strong>
                  <small>{cargoUsuario}</small>
                </div>
              </button>

              {perfilAberto && (
                <div className="profile-panel">
                  <div className="profile-panel-header">
                    <span className="profile-avatar large">
                      {inicialUsuario}
                    </span>

                    <div>
                      <strong>{nomeUsuario}</strong>
                      <small>{cargoUsuario}</small>
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      className="profile-panel-item"
                      onClick={irParaDashboard}
                    >
                      <span>⌂</span>
                      Ir para Dashboard
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="profile-panel-item"
                      onClick={() => {
                        setTela("salas")
                        setPerfilAberto(false)
                      }}
                    >
                      <span>▦</span>
                      Ir para Salas e Ambientes
                    </button>
                  )}

                  <button
                    type="button"
                    className="profile-panel-item"
                    onClick={() => {
                      alternarTema()
                      setPerfilAberto(false)
                    }}
                  >
                    <span>{tema === "dark" ? "☀" : "☾"}</span>
                    {tema === "dark"
                      ? "Ativar tema claro"
                      : "Ativar tema escuro"}
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="profile-panel-item"
                      onClick={() => {
                        abrirAdmin("usuarios")
                        setPerfilAberto(false)
                      }}
                    >
                      <span>👤</span>
                      Gestão de usuários
                    </button>
                  )}

                  <button
                    type="button"
                    className="profile-panel-item danger"
                    onClick={handleSair}
                  >
                    <span>↪</span>
                    Sair do sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>


        {isAdmin && tela === "admin" && (
          <section className="mobile-admin-quickbar" aria-label="Atalhos administrativos">
            <div className="mobile-admin-quickbar-title">
              <strong>Administração</strong>
              <small>Escolha uma área para gerenciar</small>
            </div>

            <div className="mobile-admin-quickbar-scroll">
              <button className={adminTela === "resumo" ? "active" : ""} type="button" onClick={() => abrirAdmin("resumo")}>Resumo</button>
              <button className={adminTela === "instituicoes" ? "active" : ""} type="button" onClick={() => abrirAdmin("instituicoes")}>Instituições</button>
              <button className={adminTela === "campi" ? "active" : ""} type="button" onClick={() => abrirAdmin("campi")}>Campi</button>
              <button className={adminTela === "edificios" ? "active" : ""} type="button" onClick={() => abrirAdmin("edificios")}>Edifícios</button>
              <button className={adminTela === "salas" ? "active" : ""} type="button" onClick={() => abrirAdmin("salas")}>Salas</button>
              <button className={adminTela === "reservas" ? "active" : ""} type="button" onClick={() => abrirAdmin("reservas")}>Reservas</button>
              <button className={adminTela === "usuarios" ? "active" : ""} type="button" onClick={() => abrirAdmin("usuarios")}>Usuários</button>
              <button className={adminTela === "auditoria" ? "active" : ""} type="button" onClick={() => abrirAdmin("auditoria")}>Auditoria</button>
              <button className={adminTela === "problemas" ? "active" : ""} type="button" onClick={() => abrirAdmin("problemas")}>Problemas</button>
              <button className={adminTela === "sugestoes" ? "active" : ""} type="button" onClick={() => abrirAdmin("sugestoes")}>Sugestões</button>
              <button className={adminTela === "cadastro" ? "active" : ""} type="button" onClick={() => abrirAdmin("cadastro")}>Cadastro</button>
            </div>
          </section>
        )}

        <div className="page-transition">
          {tela === "dashboard" && isAdmin && <DashboardInicio />}

          {tela === "sistema" && <SistemaResumo />}

          {tela === "salas" && <Salas />}

          {tela === "statusReservas" && <StatusReservas />}

          {tela === "chatbot" && <ChatFluxo />}

          {tela === "problema" && <ReportarProblema />}

          {tela === "sugestao" && <SugestaoMelhoria />}
           {tela === "chat" && <Chat />}

          {tela === "admin" && isAdmin && <Admin adminTela={adminTela} />}


          {!isAdmin && (tela === "dashboard" || tela === "admin") && <Salas />}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal mobile">
        {isAdmin ? (
          <>
            <button
              type="button"
              className={tela === "dashboard" ? "active" : ""}
              onClick={() => selecionarTela("dashboard")}
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              type="button"
              className={tela === "salas" ? "active" : ""}
              onClick={() => selecionarTela("salas")}
            >
              <span>▦</span>
              Salas
            </button>

            <button
              type="button"
              className={tela === "statusReservas" ? "active" : ""}
              onClick={() => selecionarTela("statusReservas")}
            >
              <span>◷</span>
              Reservas
            </button>

            <button
              type="button"
              className={tela === "admin" ? "active" : ""}
              onClick={() => abrirAdmin("resumo")}
            >
              <span>⚙</span>
              Admin
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={tela === "sistema" ? "active" : ""}
              onClick={() => selecionarTela("sistema")}
            >
              <span>◎</span>
              Sistema
            </button>

            <button
              type="button"
              className={tela === "salas" ? "active" : ""}
              onClick={() => selecionarTela("salas")}
            >
              <span>▦</span>
              Salas
            </button>

            <button
              type="button"
              className={tela === "statusReservas" ? "active" : ""}
              onClick={() => selecionarTela("statusReservas")}
            >
              <span>◷</span>
              Reservas
            </button>

            <button
              type="button"
              className={tela === "chatbot" ? "active" : ""}
              onClick={() => selecionarTela("chatbot")}
            >
              <span>☻</span>
              Chatbot
            </button>
          </>
        )}
      </nav>
    </div>
  )
}

export default Dashboard