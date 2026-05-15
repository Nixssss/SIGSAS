import api from "./api";

export const login = async (data) => {
  return api.post("/usuarios/login", data);
};

export const registrar = async (data) => {
  return api.post("/usuarios/", data);
};