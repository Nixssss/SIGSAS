import { useState } from "react"
import api from "../../services/api"
import "./ReportarProblemaMobile.css"

const MODULOS = [
  "Login",
  "Cadastro",
  "Salas",
  "Reservas",
  "Chatbot",
  "Admin",
  "Auditoria",
  "Outro",
]

const PRIORIDADES = [
  {
    valor: "Baixa",
    descricao: "Não bloqueia o uso",
    icone: "↓",
  },
  {
    valor: "Média",
    descricao: "Afeta parcialmente",
    icone: "•",
  },
  {
    valor: "Alta",
    descricao: "Dificulta o uso",
    icone: "!",
  },
  {
    valor: "Crítica",
    descricao: "Bloqueia uma função",
    icone: "×",
  },
]

const formInicial = {
  titulo: "",
  descricao: "",
  modulo: "",
  prioridade: "Média",
}

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("logado") || "null")
  } catch {
    return null
  }
}

function IconeProblemaMobile({ tipo }) {
  const desenhos = {
    alerta: (
      <>
        <path d="M12 4.1 20.3 19H3.7L12 4.1z" />
        <path d="M12 9.4v4.2M12 16.8h.01" />
      </>
    ),
    enviar: (
      <>
        <path d="m4 12 16-8-5.5 16-2.8-6.1L4 12z" />
        <path d="M11.7 13.9 20 4" />
      </>
    ),
    seta: (
      <>
        <path d="M5 12h13.5" />
        <path d="m14.2 6.8 5.1 5.2-5.1 5.2" />
      </>
    ),
    check: (
      <>
        <path d="m5.6 12.3 4 4 8.8-9.2" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {desenhos[tipo] || desenhos.alerta}
    </svg>
  )
}

function ReportarProblemaMobile() {
  const [form, setForm] = useState(formInicial)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [erro, setErro] = useState("")

  function alterarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  function selecionarModulo(modulo) {
    alterarCampo("modulo", form.modulo === modulo ? "" : modulo)
  }

  async function enviarReporte(evento) {
    evento.preventDefault()

    setMensagem("")
    setErro("")

    if (!form.titulo.trim()) {
      setErro("Informe o título do problema.")
      return
    }

    if (!form.descricao.trim()) {
      setErro("Descreva o problema encontrado.")
      return
    }

    const usuario = getUsuarioLogado()

    const payload = {
      idUsuario: usuario?.id || usuario?.idUsuario || null,
      nomeUsuario: usuario?.nome || null,
      emailUsuario: usuario?.email || null,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      modulo: form.modulo || null,
      prioridade: form.prioridade,
    }

    setEnviando(true)

    try {
      await api.post("/reportes-problemas", payload)

      setMensagem("Problema reportado com sucesso. A administração irá analisar.")
      setForm(formInicial)
    } catch (error) {
      console.error(error)
      setErro("Erro ao enviar o reporte de problema.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="problemas-mobile-page">
      <section className="problemas-mobile-hero">
        <div className="problemas-mobile-hero-decoration" aria-hidden="true">
          <span />
          <i />
        </div>

        <span className="problemas-mobile-hero-icon" aria-hidden="true">
          <IconeProblemaMobile tipo="alerta" />
        </span>

        <div>
          <span>SUPORTE SIGSAS</span>
          <h1>Encontrou um problema?</h1>
          <p>
            Descreva o que aconteceu para que a administração possa analisar e
            corrigir.
          </p>
        </div>
      </section>

      <form className="problemas-mobile-form-card" onSubmit={enviarReporte}>
        <header className="problemas-mobile-form-header">
          <div>
            <span>NOVO REPORTE</span>
            <h2>Detalhes do problema</h2>
          </div>

          <span className="problemas-mobile-form-step">01</span>
        </header>

        {mensagem && (
          <div className="problemas-mobile-alert success">
            <span>
              <IconeProblemaMobile tipo="check" />
            </span>
            <p>{mensagem}</p>
          </div>
        )}

        {erro && (
          <div className="problemas-mobile-alert error">
            <span>
              <IconeProblemaMobile tipo="alerta" />
            </span>
            <p>{erro}</p>
          </div>
        )}

        <label className="problemas-mobile-field">
          <span>Título do problema</span>
          <input
            value={form.titulo}
            onChange={(evento) => alterarCampo("titulo", evento.target.value)}
            placeholder="Ex.: Não consigo reservar uma sala"
            disabled={enviando}
          />
        </label>

        <section className="problemas-mobile-group">
          <div className="problemas-mobile-group-title">
            <span>Módulo relacionado</span>
            <small>{form.modulo || "Opcional"}</small>
          </div>

          <div className="problemas-mobile-module-grid">
            {MODULOS.map((modulo) => (
              <button
                key={modulo}
                type="button"
                className={form.modulo === modulo ? "selected" : ""}
                onClick={() => selecionarModulo(modulo)}
                disabled={enviando}
              >
                {modulo}
              </button>
            ))}
          </div>
        </section>

        <section className="problemas-mobile-group">
          <div className="problemas-mobile-group-title">
            <span>Prioridade</span>
            <small>Como isso afeta seu uso?</small>
          </div>

          <div className="problemas-mobile-priority-list">
            {PRIORIDADES.map((prioridade) => (
              <button
                key={prioridade.valor}
                type="button"
                className={[
                  `priority-${prioridade.valor
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()}`,
                  form.prioridade === prioridade.valor ? "selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => alterarCampo("prioridade", prioridade.valor)}
                disabled={enviando}
              >
                <span>{prioridade.icone}</span>
                <div>
                  <strong>{prioridade.valor}</strong>
                  <small>{prioridade.descricao}</small>
                </div>
                {form.prioridade === prioridade.valor && (
                  <i>
                    <IconeProblemaMobile tipo="check" />
                  </i>
                )}
              </button>
            ))}
          </div>
        </section>

        <label className="problemas-mobile-field problemas-mobile-description">
          <span>Descrição</span>
          <textarea
            value={form.descricao}
            onChange={(evento) =>
              alterarCampo("descricao", evento.target.value)
            }
            placeholder="Explique o que aconteceu, em qual tela e o que você estava tentando fazer."
            rows={6}
            disabled={enviando}
          />
          <small>
            Quanto mais detalhes você incluir, mais fácil será analisar o
            problema.
          </small>
        </label>

        <button
          type="submit"
          className="problemas-mobile-submit"
          disabled={enviando}
        >
          <span>{enviando ? "Enviando reporte..." : "Enviar problema"}</span>
          <IconeProblemaMobile tipo="enviar" />
        </button>
      </form>

      <section className="problemas-mobile-info-card">
        <span>
          <IconeProblemaMobile tipo="check" />
        </span>

        <div>
          <strong>Seu reporte será acompanhado</strong>
          <p>
            A administração receberá as informações e poderá responder pelo
            painel de feedback.
          </p>
        </div>
      </section>
    </div>
  )
}

export default ReportarProblemaMobile
