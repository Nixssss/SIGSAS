import { useState, useRef, useEffect } from "react";
import api from "../services/api";

const SESSION_KEY = "sigsas_chat_session_id";

function gerarSessionId() {
  return `sessao-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function obterSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = gerarSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("logado") || "null");
  } catch {
    return null;
  }
}

export default function Chat() {
  const [mensagem, setMensagem] = useState("");
  const [chat, setChat] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const sessionIdRef = useRef(obterSessionId());
  const chatEndRef = useRef(null);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function enviarMensagem() {
    if (!mensagem.trim() || carregando) return;

    const usuario = getUsuarioLogado();
    const textoUsuario = mensagem.trim();

    const idUsuario =
      usuario?.idUsuario ||
      usuario?.id ||
      usuario?.usuario?.id ||
      null;

    setMensagem("");

    setChat((prev) => [
      ...prev,
      { tipo: "user", texto: textoUsuario }
    ]);

    setCarregando(true);

    try {
      const response = await api.post("/chat/", {
        idUsuario,
        message: textoUsuario,
        session_id: sessionIdRef.current
      });

      const data = response.data || {};

      setChat((prev) => [
        ...prev,
        {
          tipo: "bot",
          texto: data.message || "Sem resposta",
          data: data.data || {}
        }
      ]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        {
          tipo: "bot",
          texto: "Erro no backend (ver console)"
        }
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function limparChat() {
    localStorage.removeItem(SESSION_KEY);

    const novaSessao = gerarSessionId();
    localStorage.setItem(SESSION_KEY, novaSessao);

    sessionIdRef.current = novaSessao;

    setChat([]);
    setMensagem("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      enviarMensagem();
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Chat de Reservas</h2>

      <button style={styles.clearBtn} onClick={limparChat}>
        Limpar chat
      </button>

      <div style={styles.chatBox}>
        {chat.map((c, i) => (
          <div
            key={i}
            style={{
              ...styles.row,
              justifyContent:
                c.tipo === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                ...styles.bubble,
                background:
                  c.tipo === "user" ? "#2563eb" : "#1e293b",
                color: "#fff"
              }}
            >
              <div style={styles.sender}>
                {c.tipo === "user" ? "Você" : "Bot"}
              </div>

              {/* 🔥 QUEBRA DE LINHA FUNCIONANDO */}
              <div style={styles.text}>
                {c.texto}
              </div>

              {c.data?.salas?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {c.data.salas.map((s) => (
                    <div key={s.id} style={styles.salaItem}>
                      {s.nome} ({s.capacidade})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={carregando}
        />

        <button
          style={styles.button}
          onClick={enviarMensagem}
          disabled={carregando}
        >
          {carregando ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

// =====================
// STYLES (AZUL MODERNO)
// =====================
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    padding: 20,
    color: "#fff",
    fontFamily: "Arial"
  },

  title: {
    marginBottom: 10
  },

  clearBtn: {
    marginBottom: 10,
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: 6,
    border: "none"
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: 15,
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)"
  },

  row: {
    display: "flex",
    margin: "10px 0"
  },

  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
  },

  sender: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5
  },

  text: {
    whiteSpace: "pre-line", // 🔥 FIX DEFINITIVO DO \n
    wordBreak: "break-word"
  },

  salaItem: {
    marginTop: 4,
    fontSize: 13,
    padding: 5,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 6
  },

  inputArea: {
    display: "flex",
    marginTop: 10,
    gap: 10
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
    outline: "none"
  },

  button: {
    padding: "10px 15px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer"
  }
};