import emailjs from "@emailjs/browser"

const SERVICE_ID = "SIGSAS"
const TEMPLATE_CADASTRO_ID = "template_asfnmyo"
const TEMPLATE_RECUPERACAO_ID = "template_wvlgf3o"
const PUBLIC_KEY = "QkSq_RABcKp0kHjjI"

function gerarNomePeloEmail(email) {
  const parteAntesDoArroba = email.split("@")[0]

  return parteAntesDoArroba
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((nome) => nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase())
    .join(" ")
}

export async function enviarConvite(email, token, linkCadastro) {
  const nomeUsuario = gerarNomePeloEmail(email)
  const link = linkCadastro || `http://localhost:5173/cadastro?token=${token}`

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_CADASTRO_ID,
    {
      email_destino: email,
      nome_usuario: nomeUsuario,
      link_cadastro: link,
      token_usuario: token,
    },
    PUBLIC_KEY
  )
}

export async function enviarRecuperacaoSenha(email, token) {
  const nomeUsuario = gerarNomePeloEmail(email)
  const link = `http://localhost:5173/redefinir-senha?token=${token}`

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_RECUPERACAO_ID,
    {
      email_destino: email,
      nome_usuario: nomeUsuario,
      link_recuperacao: link,
      token_recuperacao: token,
    },
    PUBLIC_KEY
  )
}