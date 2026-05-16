import api from "./api"

export const instituicoesService = {
  listar: async () => {
    const response = await api.get("/instituicoes")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/instituicoes", dados)
    return response.data
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/instituicoes/${id}`, dados)
    return response.data
  },

  excluir: async (id) => {
    const response = await api.delete(`/instituicoes/${id}`)
    return response.data
  },
}

export const campiService = {
  listar: async () => {
    const response = await api.get("/campi")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/campi", dados)
    return response.data
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/campi/${id}`, dados)
    return response.data
  },

  excluir: async (id) => {
    const response = await api.delete(`/campi/${id}`)
    return response.data
  },
}

export const edificiosService = {
  listar: async () => {
    const response = await api.get("/edificios")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/edificios", dados)
    return response.data
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/edificios/${id}`, dados)
    return response.data
  },

  excluir: async (id) => {
    const response = await api.delete(`/edificios/${id}`)
    return response.data
  },
}

export const salasService = {
  listar: async () => {
    const response = await api.get("/salas")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/salas", dados)
    return response.data
  },

  atualizar: async (idSala, dados) => {
    const response = await api.put(`/salas/${idSala}`, dados)
    return response.data
  },

  excluir: async (idSala) => {
    const response = await api.delete(`/salas/${idSala}`)
    return response.data
  },
}

export const tiposSalaService = {
  listar: async () => {
    const response = await api.get("/tipos-sala")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/tipos-sala", dados)
    return response.data
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/tipos-sala/${id}`, dados)
    return response.data
  },

  excluir: async (id) => {
    const response = await api.delete(`/tipos-sala/${id}`)
    return response.data
  },

  listarRecursos: async (idTipoSala) => {
    const response = await api.get(`/tipos-sala/${idTipoSala}/recursos`)
    return response.data
  },

  vincularRecurso: async (idTipoSala, idRecurso) => {
    const response = await api.post(
      `/tipos-sala/${idTipoSala}/recursos/${idRecurso}`
    )
    return response.data
  },

  desvincularRecurso: async (idTipoSala, idRecurso) => {
    const response = await api.delete(
      `/tipos-sala/${idTipoSala}/recursos/${idRecurso}`
    )
    return response.data
  },
}

export const recursosService = {
  listar: async () => {
    const response = await api.get("/recursos")
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/recursos", dados)
    return response.data
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/recursos/${id}`, dados)
    return response.data
  },

  excluir: async (id) => {
    const response = await api.delete(`/recursos/${id}`)
    return response.data
  },
}

export const reservasService = {
  listar: async () => {
    const response = await api.get("/reservas")
    return response.data
  },

  buscar: async (idReserva) => {
    const response = await api.get(`/reservas/${idReserva}`)
    return response.data
  },

  criar: async (dados) => {
    const response = await api.post("/reservas", dados)
    return response.data
  },

  atualizar: async (idReserva, dados) => {
    const response = await api.put(`/reservas/${idReserva}`, dados)
    return response.data
  },

  atualizarStatus: async (idReserva, dados) => {
    const response = await api.patch(`/reservas/${idReserva}/status`, dados)
    return response.data
  },

  excluir: async (idReserva) => {
    const response = await api.delete(`/reservas/${idReserva}`)
    return response.data
  },
}

export const cargosService = {
  listar: async () => {
    const response = await api.get("/cargos")
    return response.data
  },
}