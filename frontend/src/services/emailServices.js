import api from "./api"

async function tentarPost(rotas, payload) {
  let ultimoErro = null

  for (const rota of rotas) {
    try {
      const response = await api.post(rota, payload)
      return response.data
    } catch (error) {
      ultimoErro = error

      const status = error?.response?.status

      if (status !== 404 && status !== 405) {
        throw error
      }
    }
  }

  throw ultimoErro
}

export async function enviarRecuperacaoSenha(email) {
  return tentarPost(
    [
      "/auth/esqueci-senha",
      "/esqueci-senha",
      "/recuperar-senha",
      "/auth/recuperar-senha",
    ],
    {
      email,
    }
  )
}