import { useState } from "react"
import api from "../../services/api"
import "./SugestaoMelhoriaMobile.css"

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

const CATEGORIAS = [
  {
    valor: "Melhoria",
    descricao: "Aprimorar uma função existente",
    icone: "↗",
  },
  {
    valor: "Nova funcionalidade",
    descricao: "Adicionar uma nova possibilidade",
    icone: "+",
  },
  {
    valor: "Usabilidade",
    descricao: "Tornar o sistema mais simples",
    icone: "⌁",
  },
  {
    valor: "Performance",
    descricao: "Melhorar velocidade ou estabilidade",
    icone: "⚡",
  },
  {
    valor: "Acessibilidade",
    descricao: "Tornar o uso mais inclusivo",
    icone: "◌",
  },
  {
    valor: "Outro",
    descricao: "Outra ideia para o SIGSAS",
    icone: "…",
  },
]

const formInicial = {
  titulo: "",
  descricao: "",
  modulo: "",
  categoria: "Melhoria",
}

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("logado") || "null")
  } catch {
    return null
  }
}

function IconeSugestaoMobile({ tipo }) {
  const desenhos = {
    ideia: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M8.4 14.3A5.3 5.3 0 1 1 15.6 14c-.9.8-1.4 1.6-1.6 2.5h-4c-.2-.8-.8-1.5-1.6-2.2z" />
        <path d="M12 7.2v2.2" />
      </>
    ),
    enviar: (
      <>
        <path d="m4 12 16-8-5.5 16-2.8-6.1L4 12z" />
        <path d="M11.7 13.9 20 4" />
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
      {desenhos[tipo] || desenhos.ideia}
    </svg>
  )
}

function SugestaoMelhoriaMobile() {
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

  async function enviarSugestao(evento) {
    evento.preventDefault()

    setMensagem("")
    setErro("")

    if (!form.titulo.trim()) {
      setErro("Informe o título da sugestão.")
      return
    }

    if (!form.descricao.trim()) {
      setErro("Descreva sua sugestão.")
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
      categoria: form.categoria,
    }

    setEnviando(true)

    try {
      await api.post("/sugestoes-melhorias", payload)

      setMensagem("Sugestão enviada com sucesso. Obrigado pela contribuição.")
      setForm(formInicial)
    } catch (error) {
      console.error(error)
      setErro("Erro ao enviar sugestão de melhoria.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="sugestoes-mobile-page">
      <section className="sugestoes-mobile-hero">
        <div className="sugestoes-mobile-hero-decoration" aria-hidden="true">
          <span />
          <i />
        </div>

        <span className="sugestoes-mobile-hero-icon" aria-hidden="true">
          <IconeSugestaoMobile tipo="ideia" />
        </span>

        <div>
          <span>IDEIAS PARA O SIGSAS</span>
          <h1>Sua sugestão faz diferença.</h1>
          <p>
            Compartilhe uma ideia para tornar o sistema mais útil, simples e
            completo.
          </p>
        </div>
      </section>

      <form className="sugestoes-mobile-form-card" onSubmit={enviarSugestao}>
        <header className="sugestoes-mobile-form-header">
          <div>
            <span>NOVA SUGESTÃO</span>
            <h2>Conte sua ideia</h2>
          </div>

          <span className="sugestoes-mobile-form-step">01</span>
        </header>

        {mensagem && (
          <div className="sugestoes-mobile-alert success">
            <span>
              <IconeSugestaoMobile tipo="check" />
            </span>
            <p>{mensagem}</p>
          </div>
        )}

        {erro && (
          <div className="sugestoes-mobile-alert error">
            <span>
              <IconeSugestaoMobile tipo="ideia" />
            </span>
            <p>{erro}</p>
          </div>
        )}

        <label className="sugestoes-mobile-field">
          <span>Título da sugestão</span>
          <input
            value={form.titulo}
            onChange={(evento) => alterarCampo("titulo", evento.target.value)}
            placeholder="Ex.: Melhorar os filtros de salas"
            disabled={enviando}
          />
        </label>

        <section className="sugestoes-mobile-group">
          <div className="sugestoes-mobile-group-title">
            <span>Módulo relacionado</span>
            <small>{form.modulo || "Opcional"}</small>
          </div>

          <div className="sugestoes-mobile-module-grid">
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

        <section className="sugestoes-mobile-group">
          <div className="sugestoes-mobile-group-title">
            <span>Categoria da ideia</span>
            <small>Escolha a opção mais próxima</small>
          </div>

          <div className="sugestoes-mobile-category-list">
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria.valor}
                type="button"
                className={form.categoria === categoria.valor ? "selected" : ""}
                onClick={() => alterarCampo("categoria", categoria.valor)}
                disabled={enviando}
              >
                <span>{categoria.icone}</span>

                <div>
                  <strong>{categoria.valor}</strong>
                  <small>{categoria.descricao}</small>
                </div>

                {form.categoria === categoria.valor && (
                  <i>
                    <IconeSugestaoMobile tipo="check" />
                  </i>
                )}
              </button>
            ))}
          </div>
        </section>

        <label className="sugestoes-mobile-field sugestoes-mobile-description">
          <span>Descrição da ideia</span>
          <textarea
            value={form.descricao}
            onChange={(evento) =>
              alterarCampo("descricao", evento.target.value)
            }
            placeholder="Explique como a sugestão ajudaria o SIGSAS e quem se beneficiaria com ela."
            rows={6}
            disabled={enviando}
          />
          <small>
            Uma explicação clara ajuda a equipe a avaliar a sugestão com mais
            rapidez.
          </small>
        </label>

        <button
          type="submit"
          className="sugestoes-mobile-submit"
          disabled={enviando}
        >
          <span>{enviando ? "Enviando sugestão..." : "Enviar sugestão"}</span>
          <IconeSugestaoMobile tipo="enviar" />
        </button>
      </form>

      <section className="sugestoes-mobile-info-card">
        <span>
          <IconeSugestaoMobile tipo="check" />
        </span>

        <div>
          <strong>Ideias ajudam o sistema a evoluir</strong>
          <p>
            Sua contribuição será enviada ao painel de feedback para avaliação
            da administração.
          </p>
        </div>
      </section>
    </div>
  )
}

export default SugestaoMelhoriaMobile
