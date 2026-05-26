import { useEffect, useState } from "react"
import { convitesService } from "../../services/conviteService"
import { enviarConvite } from "../../services/emailServices"

function CadastroAdmin({ showToast }) {
  const [email, setEmail] = useState("")
  const [validadeHoras, setValidadeHoras] = useState(48)
  const [convites, setConvites] = useState([])
  const [carregando, setCarregando] = useState(false)

  async function carregarConvites() {
    try {
      const dados = await convitesService.listar()
      setConvites(dados)
    } catch (error) {
      console.error("Erro ao carregar convites:", error)
      showToast?.("Erro ao carregar convites", "erro")
    }
  }

  useEffect(() => {
    carregarConvites()
  }, [])

  function getUsuarioLogadoId() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")
    return usuario?.id || usuario?.idUsuario || null
  }

  async function gerarConvite(e) {
    e.preventDefault()

    if (!email.trim()) {
      showToast?.("Informe o email do convidado", "erro")
      return
    }

    try {
      setCarregando(true)

      const convite = await convitesService.criar({
        email: email.trim().toLowerCase(),
        validadeHoras: Number(validadeHoras),
        criadoPor: getUsuarioLogadoId(),
      })

      await enviarConvite(
        convite.email,
        convite.token,
        convite.linkCadastro
      )

      setEmail("")
      setValidadeHoras(48)

      await carregarConvites()

      showToast?.("Convite criado e enviado por email", "sucesso")
    } catch (error) {
      console.error("Erro ao gerar/enviar convite:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao gerar ou enviar convite", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function copiarLink(link) {
    try {
      await navigator.clipboard.writeText(link)
      showToast?.("Link copiado", "sucesso")
    } catch {
      showToast?.("Não foi possível copiar o link", "erro")
    }
  }

  async function reenviarConvite(convite) {
    try {
      setCarregando(true)

      await enviarConvite(
        convite.email,
        convite.token,
        convite.linkCadastro
      )

      showToast?.("Convite reenviado por email", "sucesso")
    } catch (error) {
      console.error("Erro ao reenviar convite:", error)
      showToast?.("Erro ao reenviar convite", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function excluirConvite(idConvite) {
    const confirmar = window.confirm("Deseja excluir este convite?")
    if (!confirmar) return

    try {
      await convitesService.excluir(idConvite)
      await carregarConvites()
      showToast?.("Convite excluído", "erro")
    } catch (error) {
      console.error("Erro ao excluir convite:", error)
      showToast?.("Erro ao excluir convite", "erro")
    }
  }

  function formatarData(data) {
    if (!data) return "Não informado"
    return new Date(data).toLocaleString("pt-BR")
  }

  function getStatusConvite(convite) {
    if (convite.usado) return "Usado"

    const agora = new Date()
    const expiracao = new Date(convite.expiraEm)

    if (expiracao < agora) return "Expirado"

    return "Ativo"
  }

  return (
    <>
      <div className="card">
        <h3>Gerar convite de cadastro</h3>

        <form onSubmit={gerarConvite} className="form-col">
          <input
            type="email"
            placeholder="Email do convidado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Validade em horas"
            value={validadeHoras}
            min="1"
            onChange={(e) => setValidadeHoras(e.target.value)}
            required
          />

          <button className="btn primary" type="submit" disabled={carregando}>
            {carregando ? "Enviando..." : "Gerar e enviar convite"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Convites gerados</h3>

        {convites.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhum convite gerado.</p>
        )}

        {convites.map((convite) => (
          <div key={convite.idConvite} className="list-row">
            <span>
              <strong>{convite.email}</strong>
              <br />
              <small>Status: {getStatusConvite(convite)}</small>
              <br />
              <small>Criado em: {formatarData(convite.criadoEm)}</small>
              <br />
              <small>Expira em: {formatarData(convite.expiraEm)}</small>
              <br />
              {convite.usadoEm && (
                <>
                  <small>Usado em: {formatarData(convite.usadoEm)}</small>
                  <br />
                </>
              )}
              <small style={{ wordBreak: "break-all" }}>
                Link: {convite.linkCadastro}
              </small>
            </span>

            <div className="actions">
              <button
                className="btn primary"
                type="button"
                onClick={() => copiarLink(convite.linkCadastro)}
                disabled={carregando}
              >
                Copiar
              </button>

              <button
                className="btn edit"
                type="button"
                onClick={() => reenviarConvite(convite)}
                disabled={carregando || convite.usado}
              >
                Reenviar
              </button>

              <button
                className="btn delete"
                type="button"
                onClick={() => excluirConvite(convite.idConvite)}
                disabled={carregando}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default CadastroAdmin