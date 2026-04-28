import { useState } from "react"
import "../App.css"
import { login } from "../services/authService";
import { jwtDecode } from "jwt-decode";

function Login({ irCadastro, irEsqueci, irDashboard, irAdmin}) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")

  async function fazerLogin(e) {
  e.preventDefault();

  try { const response = await login({
    email: email,
    senha: senha,
  });

  console.log(response);
  const token = response.access_token;
  const decoded = jwtDecode(token);
  console.log("DECODED:", decoded);
  localStorage.setItem("token", token);
  localStorage.setItem("perfil", decoded.perfil);

  setErro("");
  if (decoded.perfil === "admin") {
  irAdmin();
} else {
  irDashboard();
}} 
  catch (error) {
  console.error("ERRO COMPLETO:", error);
  console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);

  setErro(error.response?.data?.detail || "Erro ao fazer login");
}
}

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-area">
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>Gerencie suas salas</h1>
          <p>Sistema inteligente de organização.</p>
        </div>

        <div className="copyright">© 2026</div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Login</h2>

          <form onSubmit={fazerLogin}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            {erro && <p className="erro">{erro}</p>}

            <button type="submit">Entrar</button>
          </form>

          <p className="register">
            <span onClick={irEsqueci}>Esqueci senha</span>
          </p>

          <p className="register">
            Não tem conta? <span onClick={irCadastro}>Cadastre-se</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login