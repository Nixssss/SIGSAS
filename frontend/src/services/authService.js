import api from "./api";

export const login = async (data) => {
  const response = await api.post("/usuarios/login", data);
  return response.data;
};

export const registrar = async (data) => {
  const response = await api.post("/usuarios/", data);
  return response.data;
};