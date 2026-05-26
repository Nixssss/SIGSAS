import { useEffect, useState } from "react"
import "../App.css"
import { registrar } from "../services/authService"
import {
  instituicoesService,
  cargosService,
} from "../services/adminService"
import { convitesService } from "../services/conviteService"

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
      setInstituicoes(dados)
    } catch (error) {
      console.error("Erro ao carregar instituições:", error)
      setErro("Erro ao carregar instituições.")
    }
  }

  async function carregarCargos() {
    try {
      const dados = await cargosService.listar()
      setCargos(dados)
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
      <div className="login-container">
        <div className="login-left">
          <div className="logo-area">
            <span>SIGSAS</span>
          </div>

          <div className="left-content">
            <h1>Validando convite</h1>
            <p>Aguarde enquanto verificamos seu acesso.</p>
          </div>

          <div className="copyright">© 2026 SIGSAS</div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <h2>Validando...</h2>
            <p className="subtitle">Verificando convite de cadastro.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!conviteValido) {
    return (
      <div className="login-container">
        <div className="login-left">
          <div className="logo-area">
            <span>SIGSAS</span>
          </div>

          <div className="left-content">
            <h1>
              Acesso por
              <br />
              convite
            </h1>
            <p>
              O cadastro no SIGSAS depende de um convite válido enviado pelo
              administrador.
            </p>
          </div>

          <div className="copyright">© 2026 SIGSAS</div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <h2>Convite inválido</h2>
            <p className="subtitle">{mensagemConvite}</p>

            <button type="button" onClick={irLogin}>
              Voltar para login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-area">
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>
            Comece a organizar
            <br />
            seus espaços agora.
          </h1>
          <p>
            Crie sua conta e tenha acesso ao sistema de agendamento de salas.
          </p>
        </div>

        <div className="copyright">© 2026 SIGSAS</div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Criar conta</h2>
          <p className="subtitle">Cadastro liberado por convite</p>

          <form onSubmit={handleCadastro}>
            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <label>E-mail</label>
            <input type="email" value={email} disabled required />

            <label>Matrícula</label>
            <input
              type="text"
              placeholder="Sua matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              required
            />

            <label>Cargo</label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              required
            >
              <option value="">Selecione seu cargo</option>
              {cargos.map((cargoItem) => (
                <option key={cargoItem.id} value={cargoItem.nome}>
                  {cargoItem.nome}
                </option>
              ))}
            </select>

            <label>Instituição</label>
            <select
              value={idInstituicao}
              onChange={(e) => setIdInstituicao(e.target.value)}
              required
            >
              <option value="">Selecione sua instituição</option>
              {instituicoes.map((instituicao) => (
                <option key={instituicao.id} value={instituicao.id}>
                  {instituicao.nome}
                </option>
              ))}
            </select>

            <label>Senha</label>
            <input
              type="password"
              placeholder="mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <label>Confirmar senha</label>
            <input
              type="password"
              placeholder="repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />

            {erro && <p className="erro">{erro}</p>}

            <button type="submit" disabled={carregando}>
              {carregando ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          <p className="register">
            Já tem conta? <span onClick={irLogin}>Fazer login</span>
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="popup">
          <div className="popup-box">
            <div className="check">✔</div>
            <h3>Conta criada com sucesso!</h3>
            <p>Redirecionando...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cadastro