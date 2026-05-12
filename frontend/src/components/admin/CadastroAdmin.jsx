import { useEffect, useState } from "react"
import { enviarConvite } from "../../services/emailServices"

function CadastroAdmin({ showToast }) {
  const [email, setEmail] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [convites, setConvites] = useState([])

  useEffect(() => {
    carregarConvites()
  }, [])

  function notificar(texto, tipo = "sucesso") {
    if (typeof showToast === "function") {
      showToast(texto, tipo)
    } else {
      setMensagem(texto)
    }
  }

  function carregarConvites() {
    const convitesSalvos =
      JSON.parse(localStorage.getItem("convitesCadastro")) || []

    setConvites(convitesSalvos)
  }

  function salvarConvites(lista) {
    localStorage.setItem("convitesCadastro", JSON.stringify(lista))
    setConvites(lista)
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function gerarLink(token) {
    return `http://localhost:5173/cadastro?token=${token}`
  }

  function conviteExpirado(convite) {
    const criadoEm = new Date(convite.criadoEm).getTime()
    const agora = new Date().getTime()
    const validadeHoras = convite.validadeHoras || 48
    const limiteMs = validadeHoras * 60 * 60 * 1000

    return agora - criadoEm > limiteMs
  }

  function statusConvite(convite) {
    if (convite.usado) return "Usado"
    if (conviteExpirado(convite)) return "Expirado"
    return "Ativo"
  }

  function classeStatus(convite) {
    const status = statusConvite(convite)

    if (status === "Ativo") return "status-ativo"
    if (status === "Usado") return "status-usado"
    return "status-expirado"
  }

  async function enviarConviteCadastro(e) {
    e.preventDefault()

    const emailLimpo = email.trim().toLowerCase()

    if (!emailLimpo) {
      notificar("Informe um email.", "erro")
      return
    }

    if (!emailValido(emailLimpo)) {
      notificar("Informe um email válido.", "erro")
      return
    }

    const token = crypto.randomUUID()

    const novoConvite = {
      email: emailLimpo,
      token,
      criadoEm: new Date().toISOString(),
      usado: false,
      validadeHoras: 48,
    }

    try {
      setCarregando(true)
      setMensagem("")

      await enviarConvite(emailLimpo, token)

      const convitesAtualizados = [novoConvite, ...convites]
      salvarConvites(convitesAtualizados)

      notificar("Convite enviado com sucesso.", "sucesso")
      setEmail("")
    } catch (error) {
      console.error("Erro completo EmailJS:", error)
      notificar("Erro ao enviar convite. Verifique o email e o template.", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function reenviarConvite(convite) {
    const novoToken = crypto.randomUUID()

    const conviteAtualizado = {
      ...convite,
      token: novoToken,
      criadoEm: new Date().toISOString(),
      usado: false,
      validadeHoras: 48,
      reenviadoEm: new Date().toISOString(),
    }

    try {
      setMensagem("")

      await enviarConvite(convite.email, novoToken)

      const convitesAtualizados = convites.map((item) =>
        item.token === convite.token ? conviteAtualizado : item
      )

      salvarConvites(convitesAtualizados)

      notificar(`Convite reenviado para ${convite.email}.`, "sucesso")
    } catch (error) {
      console.error("Erro ao reenviar convite:", error)
      notificar("Erro ao reenviar convite.", "erro")
    }
  }

  async function copiarLink(token) {
    const link = gerarLink(token)

    try {
      await navigator.clipboard.writeText(link)
      notificar("Link copiado para a área de transferência.", "sucesso")
    } catch (error) {
      console.error("Erro ao copiar link:", error)
      setMensagem(link)
      notificar("Não foi possível copiar automaticamente. O link foi exibido na tela.", "erro")
    }
  }

  function removerConvite(token) {
    const convite = convites.find((item) => item.token === token)

    const confirmar = window.confirm(
      `Deseja remover o convite de ${convite?.email || "este usuário"}?`
    )

    if (!confirmar) return

    const convitesAtualizados = convites.filter(
      (convite) => convite.token !== token
    )

    salvarConvites(convitesAtualizados)

    notificar("Convite removido com sucesso.", "removido")
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  return (
    <div className="admin-page">
      <h2>Cadastro de Usuário por Convite</h2>

      <p>
        Informe o email do usuário que receberá o link para realizar o cadastro
        no SIGSAS.
      </p>

      <form onSubmit={enviarConviteCadastro}>
        <div className="form-group">
          <label>Email do usuário</label>
          <input
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" disabled={carregando}>
          {carregando ? "Enviando..." : "Enviar convite"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}

      <hr />

      <h3>Convites enviados</h3>

      {convites.length === 0 ? (
        <p>Nenhum convite enviado até o momento.</p>
      ) : (
        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Enviado em</th>
                <th>Validade</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {convites.map((convite) => (
                <tr key={convite.token}>
                  <td>{convite.email}</td>

                  <td>
                    <span className={classeStatus(convite)}>
                      {statusConvite(convite)}
                    </span>
                  </td>

                  <td>{formatarData(convite.criadoEm)}</td>

                  <td>{convite.validadeHoras || 48} horas</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => copiarLink(convite.token)}
                    >
                      Copiar link
                    </button>

                    <button
                      type="button"
                      onClick={() => reenviarConvite(convite)}
                    >
                      Reenviar
                    </button>

                    <button
                      type="button"
                      onClick={() => removerConvite(convite.token)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CadastroAdmin