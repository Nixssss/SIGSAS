import api from "./api";

export const login = async (data) => {
  const response = await api.post("/api/v1/login", data);
  return response.data;
};

export const registrar = async (data) => {
  const response = await api.post("/api/v1/registrar", data);
  return response.data;
};