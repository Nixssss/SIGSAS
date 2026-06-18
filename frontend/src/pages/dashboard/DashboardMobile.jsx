import { useEffect, useMemo, useState } from "react"
import DashboardInicioMobile from "./DashboardInicioMobile"
import Salas from "../Salas"
import StatusReservas from "../StatusReservas"
import ChatFluxo from "../ChatFluxo"
import ReportarProblema from "../ReportarProblema"
import SugestaoMelhoria from "../SugestaoMelhoria"
import SistemaResumo from "../SistemaResumo"
import Admin from "../../components/admin/Admin"
import api from "../../services/api"
import "./DashboardMobile.css"

function ehPerfilAdmin(perfil) {
  const perfilNormalizado = String(perfil || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

  return perfilNormalizado === "admin" || perfilNormalizado === "administrador"
}

function Icon({ name }) {
  const icons = {
    menu: (
      <>
        <path d="M5 7h14M5 12h14M5 17h14" />
      </>
    ),
    close: (
      <>
        <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
      </>
    ),
    logo: (
      <>
        <path d="M12 3.3 19.2 7v8L12 20.7 4.8 15V7L12 3.3z" />
        <path d="M8.2 10.1 12 8l3.8 2.1-3.8 2.1-3.8-2.1z" />
        <path d="M8.2 13.1 12 15.2l3.8-2.1" />
      </>
    ),
    home: (
      <>
        <path d="m4 10 8-6.5 8 6.5v9.5a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 19.5V10z" />
        <path d="M9.5 21v-5.4h5V21" />
      </>
    ),
    rooms: (
      <>
        <rect x="4.2" y="3.2" width="15.6" height="17.6" rx="2.6" />
        <path d="M8 7.2h2M14 7.2h2M8 11.5h2M14 11.5h2M8 15.8h2M14 15.8h2M11 20.8v-4h2v4" />
      </>
    ),
    booking: (
      <>
        <rect x="4.2" y="5.2" width="15.6" height="14.3" rx="3" />
        <path d="M8 3.6v3.8M16 3.6v3.8M5.1 9.2h13.8" />
        <path d="M8.4 14.2l2.2 2.2 5.2-5.4" />
      </>
    ),
    chat: (
      <>
        <path d="M5.4 5.2h13.2c1 0 1.8.8 1.8 1.8v7.1c0 1-.8 1.8-1.8 1.8h-7.2L7.1 19v-3.1H5.4c-1 0-1.8-.8-1.8-1.8V7c0-1 .8-1.8 1.8-1.8z" />
        <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M18 10.2c0-3.5-2.1-5.9-6-5.9s-6 2.4-6 5.9c0 4-1.7 5.3-1.7 5.3h15.4S18 14.2 18 10.2z" />
        <path d="M9.5 19.2c.5.9 1.3 1.3 2.5 1.3s2-.4 2.5-1.3" />
      </>
    ),
    system: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
        <path d="M7.5 8.5h3.2v3.2H7.5zM13.5 8.5h3M13.5 11.7h3M7.5 15.8h9" />
      </>
    ),
    issue: (
      <>
        <path d="M12 4.2 20.2 19H3.8L12 4.2z" />
        <path d="M12 9.4v4.2M12 16.8h.01" />
      </>
    ),
    idea: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M8.4 14.3A5.3 5.3 0 1 1 15.6 14c-.9.8-1.4 1.6-1.6 2.5h-4c-.2-.8-.8-1.5-1.6-2.2z" />
      </>
    ),
    admin: (
      <>
        <circle cx="12" cy="12" r="3.1" />
        <path d="M19.2 13.5a7.7 7.7 0 0 0 .1-3L21 9.2l-1.8-3.1-2.1.7a8.3 8.3 0 0 0-2.6-1.5L14.1 3h-3.6l-.4 2.3A8.3 8.3 0 0 0 7.5 6.8l-2.1-.7L3.6 9.2l1.7 1.3a7.7 7.7 0 0 0 .1 3l-1.7 1.3 1.8 3.1 2.1-.7a8.3 8.3 0 0 0 2.6 1.5l.4 2.3h3.6l.4-2.3a8.3 8.3 0 0 0 2.6-1.5l2.1.7 1.8-3.1-1.9-1.3z" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </>
    ),
    moon: (
      <>
        <path d="M19.6 14.9A8.4 8.4 0 0 1 9.1 4.4 8.3 8.3 0 1 0 19.6 14.9z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5.6A1.6 1.6 0 0 0 4 5.6v12.8A1.6 1.6 0 0 0 5.6 20H10" />
        <path d="M14 8l4 4-4 4M18 12H9" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h13.5M14.2 6.8l5.1 5.2-5.1 5.2" />
      </>
    ),
  }

  return (
    <svg
      className={`sigsas-mobile-icon sigsas-mobile-icon-${name}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name] || icons.menu}
    </svg>
  )
}

function DashboardMobile({ sair }) {
  const perfil = localStorage.getItem("perfil")
  const isAdmin = ehPerfilAdmin(perfil)

  const [tela, setTela] = useState(() => (isAdmin ? "dashboard" : "sistema"))
  const [adminTela, setAdminTela] = useState("resumo")
  const [tema, setTema] = useState(() => localStorage.getItem("sigsas_tema") || "light")
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [drawerModo, setDrawerModo] = useState("menu")
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

  const totalNotificacoes =
    notificacoes.reservasPendentes +
    notificacoes.problemasAbertos +
    notificacoes.sugestoesNovas

  const tituloTela = useMemo(() => {
    const titulos = {
      dashboard: "Início",
      sistema: "Visão do Sistema",
      salas: "Salas e Ambientes",
      statusReservas: "Reservas",
      chatbot: "Assistente de Reservas",
      problema: "Reportar Problema",
      sugestao: "Sugestões",
      admin: "Administração",
    }

    return titulos[tela] || "SIGSAS"
  }, [tela])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema)
    document.body.setAttribute("data-theme", tema)
    localStorage.setItem("sigsas_tema", tema)
  }, [tema])

  useEffect(() => {
    if (!isAdmin && (tela === "dashboard" || tela === "admin")) {
      setTela("sistema")
      setAdminTela("resumo")
    }
  }, [isAdmin, tela])

  useEffect(() => {
    if (isAdmin) {
      carregarNotificacoes()
    }
  }, [isAdmin])

  async function carregarNotificacoes() {
    if (!isAdmin) return

    try {
      const resultados = await Promise.allSettled([
        api.get("/reservas"),
        api.get("/reportes-problemas"),
        api.get("/sugestoes-melhorias"),
      ])

      const reservas =
        resultados[0].status === "fulfilled" && Array.isArray(resultados[0].value.data)
          ? resultados[0].value.data
          : []

      const problemas =
        resultados[1].status === "fulfilled" && Array.isArray(resultados[1].value.data)
          ? resultados[1].value.data
          : []

      const sugestoes =
        resultados[2].status === "fulfilled" && Array.isArray(resultados[2].value.data)
          ? resultados[2].value.data
          : []

      setNotificacoes({
        reservasPendentes: reservas.filter((item) => Number(item.idStatusReserva) === 1).length,
        problemasAbertos: problemas.filter((item) =>
          ["Aberto", "Em análise"].includes(item.status)
        ).length,
        sugestoesNovas: sugestoes.filter((item) =>
          ["Nova", "Em análise"].includes(item.status)
        ).length,
      })
    } catch (error) {
      console.error("Erro ao carregar notificações mobile:", error)
    }
  }

  function alternarTema() {
    setTema((atual) => (atual === "dark" ? "light" : "dark"))
  }

  function fecharDrawer() {
    setDrawerAberto(false)
    setDrawerModo("menu")
  }

  function abrirDrawer(modo = "menu") {
    setDrawerModo(modo)
    setDrawerAberto(true)
  }

  function navegar(id) {
    if (!isAdmin && (id === "dashboard" || id === "admin")) {
      setTela("sistema")
      fecharDrawer()
      return
    }

    setTela(id)
    fecharDrawer()
  }

  function abrirAdmin(telaAdmin = "resumo") {
    if (!isAdmin) {
      navegar("sistema")
      return
    }

    setTela("admin")
    setAdminTela(telaAdmin)
    fecharDrawer()
  }

  function handleSair() {
    localStorage.removeItem("token")
    localStorage.removeItem("perfil")
    localStorage.removeItem("logado")
    sair()
  }

  function abrirNotificacao(tipo) {
    if (tipo === "reservas") abrirAdmin("reservas")
    if (tipo === "problemas") abrirAdmin("problemas")
    if (tipo === "sugestoes") abrirAdmin("sugestoes")
  }

  function renderizarConteudo() {
    if (tela === "dashboard" && isAdmin) {
      return (
        <DashboardInicioMobile
          nomeUsuario={nomeUsuario}
          onNavegar={navegar}
          onAbrirAdmin={abrirAdmin}
        />
      )
    }

    if (tela === "sistema") return <SistemaResumo />
    if (tela === "salas") return <Salas />
    if (tela === "statusReservas") return <StatusReservas />
    if (tela === "chatbot") return <ChatFluxo />
    if (tela === "problema") return <ReportarProblema />
    if (tela === "sugestao") return <SugestaoMelhoria />
    if (tela === "admin" && isAdmin) return <Admin adminTela={adminTela} />

    return <SistemaResumo />
  }

  const itensDrawer = [
    ...(isAdmin
      ? [
          {
            id: "dashboard",
            label: "Início",
            icon: "home",
          },
        ]
      : [
          {
            id: "sistema",
            label: "Início",
            icon: "home",
          },
        ]),
    {
      id: "sistema",
      label: "Visão do Sistema",
      icon: "system",
    },
    {
      id: "salas",
      label: "Salas e Ambientes",
      icon: "rooms",
    },
    {
      id: "statusReservas",
      label: "Reservas",
      icon: "booking",
    },
    {
      id: "chatbot",
      label: "Assistente de Reservas",
      icon: "chat",
    },
    {
      id: "problema",
      label: "Reportar problema",
      icon: "issue",
    },
    {
      id: "sugestao",
      label: "Sugestões",
      icon: "idea",
    },
  ]

  const itensAdmin = [
    ["resumo", "Resumo"],
    ["instituicoes", "Instituições"],
    ["campi", "Campi"],
    ["edificios", "Edifícios"],
    ["salas", "Salas"],
    ["reservas", "Reservas"],
    ["usuarios", "Usuários"],
    ["auditoria", "Auditoria"],
    ["chatbotb", "Histórico chatbotb"],
    ["problemas", "Problemas"],
    ["sugestoes", "Sugestões"],
    ["cadastro", "Cadastro"],
  ]

  return (
    <div className={`sigsas-mobile-shell ${drawerAberto ? "is-drawer-open" : ""}`}>
      <header className="sigsas-mobile-header">
        <button
          type="button"
          className="sigsas-mobile-header-button"
          onClick={() => abrirDrawer("menu")}
          aria-label="Abrir menu"
        >
          <Icon name="menu" />
        </button>

        <div className="sigsas-mobile-header-brand">
          <span className="sigsas-mobile-logo">
            <Icon name="logo" />
          </span>

          <div>
            <strong>SIGSAS</strong>
            <small>{tituloTela}</small>
          </div>
        </div>

        <div className="sigsas-mobile-header-actions">
          {isAdmin && (
            <button
              type="button"
              className="sigsas-mobile-header-button sigsas-mobile-bell-button"
              onClick={() => abrirDrawer("notificacoes")}
              aria-label="Abrir notificações"
            >
              <Icon name="bell" />
              {totalNotificacoes > 0 && (
                <span className="sigsas-mobile-notification-count">
                  {totalNotificacoes > 9 ? "9+" : totalNotificacoes}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            className="sigsas-mobile-profile-button"
            onClick={() => abrirDrawer("menu")}
            aria-label="Abrir perfil e menu"
          >
            {inicialUsuario}
          </button>
        </div>
      </header>

      <main className="sigsas-mobile-content">
        <div className="sigsas-mobile-page-transition">{renderizarConteudo()}</div>
      </main>

      <nav className="sigsas-mobile-bottom-nav" aria-label="Navegação principal">
        <button
          type="button"
          className={
            (isAdmin ? tela === "dashboard" : tela === "sistema") ? "active" : ""
          }
          onClick={() => navegar(isAdmin ? "dashboard" : "sistema")}
        >
          <Icon name="home" />
          <span>Início</span>
        </button>

        <button
          type="button"
          className={tela === "salas" ? "active" : ""}
          onClick={() => navegar("salas")}
        >
          <Icon name="rooms" />
          <span>Salas</span>
        </button>

        <button
          type="button"
          className={tela === "statusReservas" ? "active" : ""}
          onClick={() => navegar("statusReservas")}
        >
          <Icon name="booking" />
          <span>Reservas</span>
        </button>

        <button
          type="button"
          className={tela === "chatbot" ? "active" : ""}
          onClick={() => navegar("chatbot")}
        >
          <Icon name="chat" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          className={drawerAberto || tela === "admin" ? "active" : ""}
          onClick={() => abrirDrawer("menu")}
        >
          <Icon name="menu" />
          <span>Menu</span>
        </button>
      </nav>

      {drawerAberto && (
        <div className="sigsas-mobile-drawer-layer">
          <button
            type="button"
            className="sigsas-mobile-drawer-backdrop"
            onClick={fecharDrawer}
            aria-label="Fechar menu"
          />

          <aside className="sigsas-mobile-drawer">
            <div className="sigsas-mobile-drawer-top">
              <div className="sigsas-mobile-drawer-brand">
                <span className="sigsas-mobile-logo">
                  <Icon name="logo" />
                </span>

                <div>
                  <strong>{drawerModo === "notificacoes" ? "Notificações" : "SIGSAS"}</strong>
                  <small>
                    {drawerModo === "notificacoes"
                      ? `${totalNotificacoes} pendência(s) para acompanhar`
                      : "Gestão Inteligente de Salas"}
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="sigsas-mobile-drawer-close"
                onClick={fecharDrawer}
                aria-label="Fechar menu"
              >
                <Icon name="close" />
              </button>
            </div>

            {drawerModo === "notificacoes" && isAdmin ? (
              <section className="sigsas-mobile-notifications">
                <button type="button" onClick={() => abrirNotificacao("reservas")}>
                  <span className="sigsas-mobile-notification-icon booking">
                    <Icon name="booking" />
                  </span>
                  <span>
                    <strong>{notificacoes.reservasPendentes}</strong>
                    <small>Reservas pendentes para análise</small>
                  </span>
                  <Icon name="arrow" />
                </button>

                <button type="button" onClick={() => abrirNotificacao("problemas")}>
                  <span className="sigsas-mobile-notification-icon issue">
                    <Icon name="issue" />
                  </span>
                  <span>
                    <strong>{notificacoes.problemasAbertos}</strong>
                    <small>Problemas abertos ou em análise</small>
                  </span>
                  <Icon name="arrow" />
                </button>

                <button type="button" onClick={() => abrirNotificacao("sugestoes")}>
                  <span className="sigsas-mobile-notification-icon idea">
                    <Icon name="idea" />
                  </span>
                  <span>
                    <strong>{notificacoes.sugestoesNovas}</strong>
                    <small>Sugestões novas ou em análise</small>
                  </span>
                  <Icon name="arrow" />
                </button>

                {totalNotificacoes === 0 && (
                  <div className="sigsas-mobile-notifications-empty">
                    Nenhuma pendência no momento.
                  </div>
                )}

                <button
                  type="button"
                  className="sigsas-mobile-notifications-refresh"
                  onClick={carregarNotificacoes}
                >
                  Atualizar notificações
                </button>
              </section>
            ) : (
              <>
                <section className="sigsas-mobile-user-card">
                  <span>{inicialUsuario}</span>
                  <div>
                    <strong>{nomeUsuario}</strong>
                    <small>{cargoUsuario}</small>
                  </div>
                </section>

                <nav className="sigsas-mobile-drawer-nav">
                  {itensDrawer.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={tela === item.id ? "active" : ""}
                      onClick={() => navegar(item.id)}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                {isAdmin && (
                  <section className="sigsas-mobile-admin-card">
                    <div className="sigsas-mobile-drawer-section-title">
                      <span>
                        <Icon name="admin" />
                        Administração
                      </span>
                      <small>Acesso administrativo</small>
                    </div>

                    <div className="sigsas-mobile-admin-grid">
                      {itensAdmin.map(([id, label]) => (
                        <button
                          type="button"
                          className={
                            tela === "admin" && adminTela === id ? "active" : ""
                          }
                          key={id}
                          onClick={() => abrirAdmin(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="sigsas-mobile-drawer-footer">
                  <button
                    type="button"
                    className="sigsas-mobile-theme-button"
                    onClick={alternarTema}
                  >
                    <Icon name={tema === "dark" ? "moon" : "sun"} />
                    <span>{tema === "dark" ? "Tema escuro" : "Tema claro"}</span>
                  </button>

                  <button
                    type="button"
                    className="sigsas-mobile-exit-button"
                    onClick={handleSair}
                  >
                    <Icon name="logout" />
                    <span>Sair da conta</span>
                  </button>
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default DashboardMobile
