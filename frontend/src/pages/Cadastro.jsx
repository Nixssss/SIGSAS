import { useEffect, useState } from "react"
import { registrar } from "../services/authService"
import {
  instituicoesService,
  cargosService,
} from "../services/adminService"
import { convitesService } from "../services/conviteService"
import "../styles/Auth.css"

function AuthLogo() {
  return (
    <div className="auth-logo-mark" aria-hidden="true">
      <div className="auth-logo-hex">
        <div className="auth-logo-core">
          <div className="auth-logo-cube-top" />
          <div className="auth-logo-cube-front" />
        </div>
      </div>
    </div>
  )
}

function AuthBrand() {
  return (
    <div className="auth-brand-row">
      <AuthLogo />

      <div className="auth-brand-text">
        <h1>SIGSAS</h1>
        <span>Gestão Inteligente de Salas</span>
      </div>
    </div>
  )
}

function AuthLeftPanel({ titulo, texto, rodape = "© 2026 SIGSAS" }) {
  return (
    <section className="auth-left-panel">
      <AuthBrand />

      <div className="auth-left-content">
        <span className="auth-kicker">Plataforma acadêmica</span>
        <h2>{titulo}</h2>
        <p>{texto}</p>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <strong>Controle institucional</strong>
            <span>Gestão integrada de instituições, campi e salas.</span>
          </div>

          <div className="auth-feature-item">
            <strong>Acesso seguro</strong>
            <span>Cadastro autorizado por convite administrativo.</span>
          </div>

          <div className="auth-feature-item">
            <strong>Organização acadêmica</strong>
            <span>Fluxos pensados para ambientes educacionais.</span>
          </div>
        </div>
      </div>

      <div className="auth-left-footer">{rodape}</div>
    </section>
  )
}

function Cadastro({ irLogin }) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")

  const [matricula, setMatricula] = useState("")
  const [cargo, setCargo] = useState("")
  const [idInstituicao, setIdInstituicao] = useState("")
  const [instituicoes, setInstituicoes] = useState([])
  const [cargos, setCargos] = useState([])

  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [conviteValido, setConviteValido] = useState(false)
  const [tokenConvite, setTokenConvite] = useState("")
  const [mensagemConvite, setMensagemConvite] = useState("Validando convite...")
  const [carregando, setCarregando] = useState(false)
  const [validando, setValidando] = useState(true)

  useEffect(() => {
    validarConvite()
    carregarInstituicoes()
    carregarCargos()
  }, [])

  async function carregarInstituicoes() {
    try {
      const dados = await instituicoesService.listar()
      setInstituicoes(Array.isArray(dados) ? dados : [])
    } catch (error) {
      console.error("Erro ao carregar instituições:", error)
      setErro("Erro ao carregar instituições.")
    }
  }

  async function carregarCargos() {
    try {
      const dados = await cargosService.listar()
      setCargos(Array.isArray(dados) ? dados : [])
    } catch (error) {
      console.error("Erro ao carregar cargos:", error)
      setErro("Erro ao carregar cargos.")
    }
  }

  async function validarConvite() {
    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get("token")

    if (!tokenUrl) {
      setConviteValido(false)
      setMensagemConvite(
        "Cadastro permitido somente por convite enviado pelo administrador."
      )
      setValidando(false)
      return
    }

    try {
      const resposta = await convitesService.validar(tokenUrl)

      if (!resposta.valido) {
        setConviteValido(false)
        setMensagemConvite(resposta.mensagem)
        setValidando(false)
        return
      }

      setConviteValido(true)
      setTokenConvite(tokenUrl)
      setEmail(resposta.email)
      setMensagemConvite("")
    } catch (error) {
      console.error("Erro ao validar convite:", error)
      setConviteValido(false)
      setMensagemConvite("Erro ao validar convite.")
    } finally {
      setValidando(false)
    }
  }

  function getId(item) {
    return item?.id || item?.idInstituicao || item?.idCargo
  }

  function getNome(item) {
    return item?.nome || item?.nomeInstituicao || item?.nomeCargo || "Sem nome"
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErro("")

    if (!conviteValido) {
      setErro("Cadastro bloqueado. Convite inválido.")
      return
    }

    if (!nome.trim()) {
      setErro("Informe seu nome completo.")
      return
    }

    if (!matricula.trim()) {
      setErro("Informe sua matrícula.")
      return
    }

    if (!cargo.trim()) {
      setErro("Selecione seu cargo.")
      return
    }

    if (!idInstituicao) {
      setErro("Selecione sua instituição.")
      return
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.")
      return
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    try {
      setCarregando(true)

      await registrar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        perfil: "usuario",
        matricula: matricula.trim(),
        cargo: cargo.trim(),
        idInstituicao: Number(idInstituicao),
      })

      await convitesService.usar(tokenConvite)

      setErro("")
      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2000)
    } catch (error) {
      console.error("ERRO:", error.response?.data)
      setErro(error.response?.data?.detail || "Erro ao cadastrar.")
    } finally {
      setCarregando(false)
    }
  }

  if (validando) {
    return (
      <div className="auth-page">
        <div className="auth-layout">
          <AuthLeftPanel
            titulo="Validando convite de acesso."
            texto="Aguarde enquanto verificamos se seu convite de cadastro está ativo e autorizado."
          />

          <section className="auth-right-panel">
            <div className="auth-card compact">
              <div className="auth-card-header">
                <div className="auth-logo-mark small">
                  <div className="auth-logo-hex">
                    <div className="auth-logo-core">
                      <div className="auth-logo-cube-top" />
                      <div className="auth-logo-cube-front" />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="auth-form-label">Validação</span>
                  <h3>Validando...</h3>
                  <p>Verificando convite de cadastro.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!conviteValido) {
    return (
      <div className="auth-page">
        <div className="auth-layout">
          <AuthLeftPanel
            titulo="Cadastro permitido somente por convite."
            texto="O acesso ao SIGSAS é controlado pelo administrador da instituição."
          />

          <section className="auth-right-panel">
            <div className="auth-card compact">
              <div className="auth-card-header">
                <div className="auth-logo-mark small">
                  <div className="auth-logo-hex">
                    <div className="auth-logo-core">
                      <div className="auth-logo-cube-top" />
                      <div className="auth-logo-cube-front" />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="auth-form-label">Convite inválido</span>
                  <h3>Acesso bloqueado</h3>
                  <p>{mensagemConvite}</p>
                </div>
              </div>

              <button type="button" className="auth-main-button" onClick={irLogin}>
                Voltar para login
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <AuthLeftPanel
          titulo="Crie sua conta institucional com segurança."
          texto="Finalize seu cadastro para acessar o SIGSAS e utilizar os recursos de organização acadêmica."
        />

        <section className="auth-right-panel">
          <div className="auth-card auth-card-wide">
            <div className="auth-card-header">
              <div className="auth-logo-mark small">
                <div className="auth-logo-hex">
                  <div className="auth-logo-core">
                    <div className="auth-logo-cube-top" />
                    <div className="auth-logo-cube-front" />
                  </div>
                </div>
              </div>

              <div>
                <span className="auth-form-label">Cadastro por convite</span>
                <h3>Criar conta</h3>
                <p>Preencha seus dados para concluir o acesso.</p>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleCadastro}>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label>Nome completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>E-mail</label>
                  <input type="email" value={email} disabled required />
                </div>

                <div className="auth-field">
                  <label>Matrícula</label>
                  <input
                    type="text"
                    placeholder="Sua matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>Cargo</label>
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  >
                    <option value="">Selecione seu cargo</option>
                    {cargos.map((cargoItem) => (
                      <option key={getId(cargoItem)} value={getNome(cargoItem)}>
                        {getNome(cargoItem)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="auth-field auth-field-full">
                  <label>Instituição</label>
                  <select
                    value={idInstituicao}
                    onChange={(e) => setIdInstituicao(e.target.value)}
                    required
                  >
                    <option value="">Selecione sua instituição</option>
                    {instituicoes.map((instituicao) => (
                      <option key={getId(instituicao)} value={getId(instituicao)}>
                        {getNome(instituicao)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="auth-field">
                  <label>Senha</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>Confirmar senha</label>
                  <input
                    type="password"
                    placeholder="Repita sua senha"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                  />
                </div>
              </div>

              {erro && <div className="auth-error-box">{erro}</div>}

              <button
                type="submit"
                className="auth-main-button"
                disabled={carregando}
              >
                {carregando ? "Cadastrando..." : "Cadastrar"}
              </button>

              <div className="auth-actions-links">
                <button type="button" className="auth-text-link" onClick={irLogin}>
                  Já tem conta? Fazer login
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {sucesso && (
        <div className="auth-popup">
          <div className="auth-popup-box">
            <div className="auth-check">✔</div>
            <h3>Conta criada com sucesso!</h3>
            <p>Redirecionando para o login...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cadastro