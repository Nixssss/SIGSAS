import api from "./api"

export const usuariosService = {
  async listar() {
    const response = await api.get("/usuarios")
    return response.data
  },

  async buscar(idUsuario) {
    const response = await api.get(`/usuarios/${idUsuario}`)
    return response.data
  },

  async criar(dados) {
    const response = await api.post("/usuarios", dados)
    return response.data
  },

  async atualizar(idUsuario, dados) {
    const response = await api.put(`/usuarios/${idUsuario}`, dados)
    return response.data
  },

  async excluir(idUsuario) {
    const response = await api.delete(`/usuarios/${idUsuario}`)
    return response.data
  },
}