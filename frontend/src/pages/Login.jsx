async function fazerLogin(e) {
  e.preventDefault();

  try {
    const response = await login({
      email,
      senha,
    });

    console.log(response);

    const token = response.access_token;

    localStorage.setItem("token", token);

    setErro("");

    // se você NÃO estiver usando backend com JWT real, isso pode falhar
    let decoded = null;

    try {
      decoded = jwtDecode(token);
      localStorage.setItem("perfil", decoded.perfil);

      if (decoded.perfil === "admin") {
        irAdmin();
      } else {
        irDashboard();
      }

    } catch {
      // fallback caso token seja fake ("teste")
      irDashboard();
    }

  } catch (error) {
    console.error("ERRO COMPLETO:", error);

    setErro(
      error.response?.data?.detail ||
      "Erro ao fazer login"
    );
  }
}