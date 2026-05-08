import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Se já está logado, redireciona para o dashboard
  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #005CA9 0%, #003d73 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>
      <div style={{ textAlign: "center", color: "#fff", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, margin: "0 0 8px", letterSpacing: 2 }}>
          DocMaster
        </h1>
        <p style={{ fontSize: 18, opacity: 0.85, margin: "0 0 40px" }}>
          Plataforma de emissão de documentos digitais
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "#fff", color: "#005CA9", border: "none",
              padding: "14px 40px", borderRadius: 10, fontSize: 16,
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Acessar Painel
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              background: "transparent", color: "#fff",
              border: "2px solid rgba(255,255,255,0.6)",
              padding: "14px 40px", borderRadius: 10, fontSize: 16,
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Criar Conta
          </button>
        </div>
      </div>
    </div>
  );
}
