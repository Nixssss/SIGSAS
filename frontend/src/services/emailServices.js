import api from "./api"

export async function enviarRecuperacaoSenha(email, token) {
  const response = await api.post("/recuperacao-senha-email", {
    email,
    token,
  })

  return response.data
}