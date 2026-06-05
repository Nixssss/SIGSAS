import api from "./api"

function formatarErroApi(error) {
  const detail = error?.response?.data?.detail

  if (typeof detail === "string") {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join(" | ")
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail)
  }

  return "Erro ao enviar email de recuperação."
}

export async function enviarRecuperacaoSenha(email) {
  const emailLimpo = String(email || "").trim().toLowerCase()

  try {
    const response = await api.post("/recuperacao-senha-email", null, {
      params: {
        email: emailLimpo,
      },
    })

    return response.data
  } catch (errorParams) {
    const statusParams = errorParams?.response?.status

    if (statusParams !== 422) {
      throw errorParams
    }

    try {
      const response = await api.post("/recuperacao-senha-email", {
        email: emailLimpo,
      })

      return response.data
    } catch (errorBody) {
      errorBody.mensagemTratada = formatarErroApi(errorBody)
      throw errorBody
    }
  }
}