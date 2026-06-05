import { useEffect, useState } from "react"
import api from "../services/api"
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

  const [perfilConvidado, setPerfilConvidado] = useState("Professor")
  const [cursos, setCursos] = useState([])
  const [cursosSelecionados, setCursosSelecionados] = useState([])
  const [buscaCurso, setBuscaCurso] = useState("")

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
    carregarCursos()
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

  async function carregarCursos() {
    try {
      const response = await api.get("/cursos")
      setCursos(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Erro ao carregar cursos:", error)
      setErro("Erro ao carregar cursos.")
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

      const perfil = resposta.perfilConvidado || "Professor"
      const cursosConvite = Array.isArray(resposta.cursos)
        ? resposta.cursos.map((curso) => ({
            idCurso: Number(curso.idCurso),
            tipoVinculo: curso.tipoVinculo || perfil,
            nomeCurso: curso.nomeCurso,
          }))
        : []

      setConviteValido(true)
      setTokenConvite(tokenUrl)
      setEmail(resposta.email)
      setPerfilConvidado(perfil)
      setCursosSelecionados(cursosConvite)
      setMensagemConvite("")
    } catch (error) {
      console.error("Erro ao validar convite:", error)
      setConviteValido(false)
      setMensagemConvite("Erro ao validar convite.")
    } finally {
      setValidando(false)
    }
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getId(item) {
    return item?.id || item?.idInstituicao || item?.idCargo
  }

  function getNome(item) {
    return item?.nome || item?.nomeInstituicao || item?.nomeCargo || "Sem nome"
  }

  function getCursosVisiveis() {
    if (perfilConvidado === "Administrador") {
      return cursos.filter((curso) => normalizarTexto(curso.nome) === "dono")
    }

    return cursos.filter((curso) => normalizarTexto(curso.nome) !== "dono")
  }

  function getCursosFiltrados() {
    const cursosVisiveis = getCursosVisiveis()
    const termo = normalizarTexto(buscaCurso)

    if (!termo) return cursosVisiveis

    return cursosVisiveis.filter((curso) =>
      normalizarTexto(curso.nome).includes(termo)
    )
  }

  function cursoEstaSelecionado(idCurso) {
    return cursosSelecionados.some(
      (curso) => Number(curso.idCurso) === Number(idCurso)
    )
  }

  function alternarCursoProfessor(curso) {
    setCursosSelecionados((atual) => {
      const jaSelecionado = atual.some(
        (item) => Number(item.idCurso) === Number(curso.id)
      )

      if (jaSelecionado) {
        return atual.filter((item) => Number(item.idCurso) !== Number(curso.id))
      }

      return [
        ...atual,
        {
          idCurso: Number(curso.id),
          tipoVinculo: "Professor",
          nomeCurso: curso.nome,
        },
      ]
    })
  }

  function montarCursosPayload() {
    if (perfilConvidado === "Administrador") {
      return []
    }

    return cursosSelecionados.map((curso) => ({
      idCurso: Number(curso.idCurso),
      tipoVinculo: curso.tipoVinculo || perfilConvidado,
    }))
  }

  function validarCursos() {
    if (perfilConvidado === "Administrador") return true

    if (perfilConvidado === "Coordenador") {
      return cursosSelecionados.length === 1
    }

    if (perfilConvidado === "Professor") {
      return cursosSelecionados.length > 0
    }

    return false
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

    if (!validarCursos()) {
      if (perfilConvidado === "Coordenador") {
        setErro("Coordenador deve estar vinculado a exatamente um curso.")
      } else {
        setErro("Selecione pelo menos um curso.")
      }

      return
    }

    try {
      setCarregando(true)

      await registrar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        perfil: perfilConvidado,
        matricula: matricula.trim(),
        cargo: cargo.trim(),
        idInstituicao: Number(idInstituicao),
        cursos: montarCursosPayload(),
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

  function renderizarCursosCadastro() {
    const cursosFiltrados = getCursosFiltrados()
    const cursosVisiveis = getCursosVisiveis()

    if (perfilConvidado === "Administrador") {
      return (
        <div className="auth-cursos-box">
          <div className="auth-cursos-header">
            <strong>Perfil e permissão</strong>
            <small>
              Você foi convidado como Administrador. O acesso será vinculado ao
              perfil geral DONO automaticamente.
            </small>
          </div>

          <div className="auth-cursos-dono">DONO automático</div>
        </div>
      )
    }

    if (perfilConvidado === "Coordenador") {
      return (
        <div className="auth-cursos-box">
          <div className="auth-cursos-header">
            <strong>Curso coordenado</strong>
            <small>
              Este curso foi definido no convite. Coordenadores podem coordenar
              somente um curso.
            </small>
          </div>

          <div className="auth-cursos-grid">
            {cursosSelecionados.map((curso) => (
              <div
                key={curso.idCurso}
                className="auth-curso-option selecionado bloqueado"
              >
                <input type="radio" checked readOnly />
                <span>{curso.nomeCurso || `Curso #${curso.idCurso}`}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="auth-cursos-box">
        <div className="auth-cursos-header">
          <strong>Cursos vinculados ao cadastro</strong>
          <small>
            Os cursos do convite já vêm selecionados. Marque ou desmarque os
            cursos em que você dará aula.
          </small>
        </div>

        <div className="auth-cursos-search">
          <span className="auth-cursos-search-icon"></span>

          <input
            type="text"
            value={buscaCurso}
            onChange={(e) => setBuscaCurso(e.target.value)}
            placeholder="Pesquisar curso..."
          />

          <small>
            {cursosFiltrados.length}/{cursosVisiveis.length}
          </small>
        </div>

        <div className="auth-cursos-grid">
          {cursosFiltrados.map((curso) => (
            <label
              key={curso.id}
              className={`auth-curso-option ${
                cursoEstaSelecionado(curso.id) ? "selecionado" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={cursoEstaSelecionado(curso.id)}
                onChange={() => alternarCursoProfessor(curso)}
              />
              <span>{curso.nome}</span>
            </label>
          ))}
        </div>

        {cursosFiltrados.length === 0 && (
          <p className="auth-cursos-empty">
            Nenhum curso encontrado para esta pesquisa.
          </p>
        )}
      </div>
    )
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
                <p>
                  Você foi convidado como <strong>{perfilConvidado}</strong>.
                </p>
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

                <div className="auth-field auth-field-full">
                  {renderizarCursosCadastro()}
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