import api from "./api"

export const convitesService = {
  listar: async () => {
    const response = await api.get("/convites")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/convites", dados)
    return response.data
  },

  validar: async (token) => {
    const response = await api.get(`/convites/validar/${token}`)
    return response.data
  },

  usar: async (token) => {
    const response = await api.patch(`/convites/${token}/usar`)
    return response.data
  },

  excluir: async (idConvite) => {
    const response = await api.delete(`/convites/${idConvite}`)
    return response.data
  },
}