import { useEffect, useState } from "react"
import api from "../../services/api"
import { registrar } from "../../services/authService"
import {
  instituicoesService,
  cargosService,
} from "../../services/adminService"
import { convitesService } from "../../services/conviteService"
import {
  AuthIconMobile,
  AuthMobileMessage,
  AuthMobileShell,
} from "./AuthMobileShared"
import "./CadastroMobile.css"

function CadastroMobile({ irLogin }) {
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
  const [etapa, setEtapa] = useState(1)

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
    if (perfilConvidado === "Coordenador") return cursosSelecionados.length === 1
    if (perfilConvidado === "Professor") return cursosSelecionados.length > 0
    return false
  }

  function validarEtapaUm() {
    setErro("")

    if (!nome.trim()) {
      setErro("Informe seu nome completo.")
      return false
    }

    if (!matricula.trim()) {
      setErro("Informe sua matrícula.")
      return false
    }

    if (!cargo.trim()) {
      setErro("Selecione seu cargo.")
      return false
    }

    if (!idInstituicao) {
      setErro("Selecione sua instituição.")
      return false
    }

    setEtapa(2)
    return true
  }

  async function handleCadastro(evento) {
    evento.preventDefault()
    setErro("")

    if (!conviteValido) {
      setErro("Cadastro bloqueado. Convite inválido.")
      return
    }

    if (!nome.trim() || !matricula.trim() || !cargo.trim() || !idInstituicao) {
      setErro("Preencha os dados institucionais antes de continuar.")
      setEtapa(1)
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
        <section className="cadastro-mobile-cursos">
          <header>
            <strong>Perfil e permissão</strong>
            <small>
              Você foi convidado como Administrador. O perfil geral DONO será
              aplicado automaticamente.
            </small>
          </header>

          <div className="cadastro-mobile-dono">DONO automático</div>
        </section>
      )
    }

    if (perfilConvidado === "Coordenador") {
      return (
        <section className="cadastro-mobile-cursos">
          <header>
            <strong>Curso coordenado</strong>
            <small>O curso foi definido pelo convite administrativo.</small>
          </header>

          <div className="cadastro-mobile-cursos-lista">
            {cursosSelecionados.map((curso) => (
              <div key={curso.idCurso} className="cadastro-mobile-curso ativo">
                <span>✓</span>
                <p>{curso.nomeCurso || `Curso #${curso.idCurso}`}</p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    return (
      <section className="cadastro-mobile-cursos">
        <header>
          <strong>Cursos vinculados</strong>
          <small>Escolha os cursos em que você dará aula.</small>
        </header>

        <div className="cadastro-mobile-busca-curso">
          <AuthIconMobile tipo="email" />
          <input
            type="text"
            value={buscaCurso}
            onChange={(evento) => setBuscaCurso(evento.target.value)}
            placeholder="Pesquisar curso..."
          />
          <small>{cursosFiltrados.length}/{cursosVisiveis.length}</small>
        </div>

        <div className="cadastro-mobile-cursos-lista">
          {cursosFiltrados.map((curso) => (
            <label
              key={curso.id}
              className={`cadastro-mobile-curso ${
                cursoEstaSelecionado(curso.id) ? "ativo" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={cursoEstaSelecionado(curso.id)}
                onChange={() => alternarCursoProfessor(curso)}
              />
              <span>{cursoEstaSelecionado(curso.id) ? "✓" : ""}</span>
              <p>{curso.nome}</p>
            </label>
          ))}
        </div>

        {cursosFiltrados.length === 0 && (
          <p className="cadastro-mobile-cursos-vazio">
            Nenhum curso encontrado para esta pesquisa.
          </p>
        )}
      </section>
    )
  }

  if (validando) {
    return (
      <AuthMobileShell
        eyebrow="CADASTRO POR CONVITE"
        title="Validando seu convite."
        text="Aguarde enquanto verificamos a autorização enviada pela administração."
      >
        <AuthMobileMessage
          titulo="Validando acesso"
          texto="Consultando os dados do convite para preparar seu cadastro."
        />
      </AuthMobileShell>
    )
  }

  if (!conviteValido) {
    return (
      <AuthMobileShell
        eyebrow="CADASTRO POR CONVITE"
        title="Cadastro protegido."
        text="O SIGSAS permite novos acessos somente com convite administrativo."
      >
        <AuthMobileMessage
          tipo="error"
          titulo="Convite inválido"
          texto={mensagemConvite}
          acao={
            <button type="button" onClick={irLogin}>
              Voltar para login
            </button>
          }
        />
      </AuthMobileShell>
    )
  }

  return (
    <AuthMobileShell
      eyebrow="CADASTRO POR CONVITE"
      title="Crie sua conta institucional."
      text="Você foi convidado como "
    >
      <section className="auth-mobile-card cadastro-mobile-card">
        <header className="auth-mobile-card-header">
          <div>
            <span>NOVO CADASTRO</span>
            <h2>Finalize seu acesso</h2>
          </div>

          <span className="auth-mobile-card-step">0{etapa}</span>
        </header>

        <div className="cadastro-mobile-profile">
          <span>{perfilConvidado.slice(0, 1).toUpperCase()}</span>
          <p>
            Perfil convidado: <strong>{perfilConvidado}</strong>
          </p>
        </div>

        <div className="cadastro-mobile-progress" aria-label={`Etapa ${etapa} de 2`}>
          <span className={etapa === 1 ? "active" : "done"}>1</span>
          <i className={etapa === 2 ? "active" : ""} />
          <span className={etapa === 2 ? "active" : ""}>2</span>
        </div>

        <form className="auth-mobile-form" onSubmit={handleCadastro}>
          {etapa === 1 && (
            <>
              <label className="auth-mobile-field">
                <span>Nome completo</span>
                <div className="auth-mobile-input-wrap">
                  <AuthIconMobile tipo="usuario" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="auth-mobile-field">
                <span>E-mail do convite</span>
                <div className="auth-mobile-input-wrap">
                  <AuthIconMobile tipo="email" />
                  <input type="email" value={email} disabled required />
                </div>
              </label>

              <label className="auth-mobile-field">
                <span>Matrícula</span>
                <div className="auth-mobile-input-wrap">
                  <AuthIconMobile tipo="cartao" />
                  <input
                    type="text"
                    placeholder="Sua matrícula"
                    value={matricula}
                    onChange={(evento) => setMatricula(evento.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="auth-mobile-field">
                <span>Cargo</span>
                <div className="auth-mobile-select-wrap">
                  <AuthIconMobile tipo="usuario" />
                  <select
                    value={cargo}
                    onChange={(evento) => setCargo(evento.target.value)}
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
              </label>

              <label className="auth-mobile-field">
                <span>Instituição</span>
                <div className="auth-mobile-select-wrap">
                  <AuthIconMobile tipo="predio" />
                  <select
                    value={idInstituicao}
                    onChange={(evento) => setIdInstituicao(evento.target.value)}
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
              </label>

              {erro && (
                <div className="auth-mobile-form-error">
                  <span>!</span>
                  <p>{erro}</p>
                </div>
              )}

              <button
                type="button"
                className="auth-mobile-submit"
                onClick={validarEtapaUm}
              >
                <span>Continuar cadastro</span>
                <AuthIconMobile tipo="seta" />
              </button>
            </>
          )}

          {etapa === 2 && (
            <>
              <label className="auth-mobile-field">
                <span>Senha</span>
                <div className="auth-mobile-input-wrap">
                  <AuthIconMobile tipo="senha" />
                  <input
                    type="password"
                    placeholder="Mínimo de 6 caracteres"
                    value={senha}
                    onChange={(evento) => setSenha(evento.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </label>

              <label className="auth-mobile-field">
                <span>Confirmar senha</span>
                <div className="auth-mobile-input-wrap">
                  <AuthIconMobile tipo="senha" />
                  <input
                    type="password"
                    placeholder="Repita sua senha"
                    value={confirmar}
                    onChange={(evento) => setConfirmar(evento.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </label>

              {renderizarCursosCadastro()}

              {erro && (
                <div className="auth-mobile-form-error">
                  <span>!</span>
                  <p>{erro}</p>
                </div>
              )}

              <div className="cadastro-mobile-actions">
                <button
                  type="button"
                  className="cadastro-mobile-back"
                  onClick={() => {
                    setErro("")
                    setEtapa(1)
                  }}
                  disabled={carregando}
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className="auth-mobile-submit"
                  disabled={carregando}
                >
                  <span>{carregando ? "Cadastrando..." : "Criar conta"}</span>
                  <AuthIconMobile tipo="seta" />
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-mobile-links">
          <button type="button" onClick={irLogin}>
            Já tem conta? <strong>Fazer login</strong>
          </button>
        </div>
      </section>

      {sucesso && (
        <div className="auth-mobile-popup">
          <div className="auth-mobile-popup-card">
            <span>
              <AuthIconMobile tipo="check" />
            </span>
            <h3>Conta criada!</h3>
            <p>Redirecionando para o login...</p>
          </div>
        </div>
      )}
    </AuthMobileShell>
  )
}

export default CadastroMobile
