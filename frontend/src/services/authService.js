import api from "./api"

export const login = async (data) => {
  const response = await api.post("/login", data)
  return response.data
}

export const registrar = async (data) => {
  const response = await api.post("/registrar", data)
  return response.data
}

export const redefinirSenha = async (data) => {
  const response = await api.post("/redefinir-senha", data)
  return response.data
}