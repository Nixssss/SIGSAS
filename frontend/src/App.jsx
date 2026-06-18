import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Dashboard from "./pages/Dashboard";

import "./App.css";

function App() {
  function verificarPaginaInicial() {
    const caminho = window.location.pathname;

    switch (caminho) {
      case "/cadastro":
        return "cadastro";

      case "/esqueci-senha":
        return "esqueciSenha";

      case "/redefinir-senha":
        return "redefinirSenha";

      case "/dashboard":
        return "dashboard";

      default:
        return "login";
    }
  }

  const [pagina, setPagina] = useState(verificarPaginaInicial);

  // futuro: usuário autenticado (sem localStorage)
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    function atualizarPagina() {
      setPagina(verificarPaginaInicial());
    }

    window.addEventListener("popstate", atualizarPagina);

    return () => {
      window.removeEventListener("popstate", atualizarPagina);
    };
  }, []);

  function navegar(rota, paginaNome) {
    window.history.pushState({}, "", rota);
    setPagina(paginaNome);
  }

  function irLogin() {
    navegar("/", "login");
    setUsuario(null);
  }

  function irCadastro() {
    navegar("/cadastro", "cadastro");
  }

  function irEsqueci() {
    navegar("/esqueci-senha", "esqueciSenha");
  }

  function irDashboard() {
    navegar("/dashboard", "dashboard");
  }

  return (
    <>
      {pagina === "login" && (
        <Login
          irCadastro={irCadastro}
          irEsqueci={irEsqueci}
          irDashboard={(userData) => {
            setUsuario(userData); // aqui entra o user real do backend
            irDashboard();
          }}
        />
      )}

      {pagina === "cadastro" && (
        <Cadastro irLogin={irLogin} />
      )}

      {pagina === "esqueciSenha" && (
        <EsqueciSenha irLogin={irLogin} />
      )}

      {pagina === "redefinirSenha" && (
        <RedefinirSenha irLogin={irLogin} />
      )}

      {pagina === "dashboard" && (
        <Dashboard
          usuario={usuario}
          sair={irLogin}
        />
      )}
    </>
  );
}

export default App;