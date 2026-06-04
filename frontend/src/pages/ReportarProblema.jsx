import { useState } from "react"
import api from "../services/api"

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

function ReportarProblema() {
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

  async function enviarReporte(e) {
    e.preventDefault()

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
    <div className="feedback-page">
      <section className="feedback-card">
        <div className="feedback-header">
          <h1>Reportar Problema</h1>
          <p>
            Informe falhas, erros, comportamentos inesperados ou qualquer
            problema encontrado no SIGSAS.
          </p>
        </div>

        {mensagem && <div className="feedback-alert success">{mensagem}</div>}
        {erro && <div className="feedback-alert error">{erro}</div>}

        <form className="feedback-form" onSubmit={enviarReporte}>
          <label>
            Título do problema
            <input
              value={form.titulo}
              onChange={(e) => alterarCampo("titulo", e.target.value)}
              placeholder="Ex: Não consigo reservar sala"
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
            Prioridade
            <select
              value={form.prioridade}
              onChange={(e) => alterarCampo("prioridade", e.target.value)}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </label>

          <label className="feedback-full">
            Descrição
            <textarea
              value={form.descricao}
              onChange={(e) => alterarCampo("descricao", e.target.value)}
              placeholder="Explique o que aconteceu, em qual tela, e o que você estava tentando fazer."
              rows={7}
            />
          </label>

          <button type="submit" className="btn primary" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar problema"}
          </button>
        </form>
      </section>
    </div>
  )
}

export default ReportarProblema