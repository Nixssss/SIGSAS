import axios from "axios"

function getApiBaseUrl() {
  const hostname = window.location.hostname

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://127.0.0.1:8000/api/v1"
  }

  return `http://${hostname}:8000/api/v1`
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Erro na API:", error)
    return Promise.reject(error)
  }
)

export default api