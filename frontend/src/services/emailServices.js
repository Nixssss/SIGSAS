import api from "./api"

export async function enviarRecuperacaoSenha(email) {
  const response = await api.post("/recuperacao-senha-email", {
    email,
  })

  return response.data
}