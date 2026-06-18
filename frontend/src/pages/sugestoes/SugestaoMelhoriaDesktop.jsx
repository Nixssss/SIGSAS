import { useState } from "react"
import api from "../../services/api"

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

function SugestaoMelhoriaDesktop() {
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

  async function enviarSugestao(e) {
    e.preventDefault()

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
    <div className="feedback-page">
      <section className="feedback-card">
        <div className="feedback-header">
          <h1>Sugestões de Melhorias</h1>
          <p>
            Envie ideias para melhorar o SIGSAS, facilitar o uso ou adicionar
            novas funcionalidades.
          </p>
        </div>

        {mensagem && <div className="feedback-alert success">{mensagem}</div>}
        {erro && <div className="feedback-alert error">{erro}</div>}

        <form className="feedback-form" onSubmit={enviarSugestao}>
          <label>
            Título da sugestão
            <input
              value={form.titulo}
              onChange={(e) => alterarCampo("titulo", e.target.value)}
              placeholder="Ex: Melhorar filtro de salas"
            />
          </label>

          <label>
            Módulo
            <select
              value={form.modulo}
              onChange={(e) => alterarCampo("modulo", e.target.value)}
            >
              <option value="">Selecione um módulo</option>
              <option value="Login">Login</option>
              <option value="Cadastro">Cadastro</option>
              <option value="Salas">Salas</option>
              <option value="Reservas">Reservas</option>
              <option value="Chatbot">Chatbot</option>
              <option value="Admin">Admin</option>
              <option value="Auditoria">Auditoria</option>
              <option value="Outro">Outro</option>
            </select>
          </label>

          <label>
            Categoria
            <select
              value={form.categoria}
              onChange={(e) => alterarCampo("categoria", e.target.value)}
            >
              <option value="Melhoria">Melhoria</option>
              <option value="Nova funcionalidade">Nova funcionalidade</option>
              <option value="Usabilidade">Usabilidade</option>
              <option value="Performance">Performance</option>
              <option value="Acessibilidade">Acessibilidade</option>
              <option value="Outro">Outro</option>
            </select>
          </label>

          <label className="feedback-full">
            Descrição
            <textarea
              value={form.descricao}
              onChange={(e) => alterarCampo("descricao", e.target.value)}
              placeholder="Explique sua ideia e como ela ajudaria o sistema."
              rows={7}
            />
          </label>

          <button type="submit" className="btn primary" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar sugestão"}
          </button>
        </form>
      </section>
    </div>
  )
}

export default SugestaoMelhoriaDesktop
