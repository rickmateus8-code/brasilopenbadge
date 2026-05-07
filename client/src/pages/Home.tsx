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
    <div className="min-h-screen bg-gradient-to-br from-[#005CA9] to-[#003d73] flex items-center justify-center p-4 font-sans">
      <div className="text-center text-white max-w-lg w-full px-4 py-10 md:py-20 animate-in fade-in duration-700">
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic uppercase">
          DocMaster
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-10 font-medium leading-relaxed">
          A plataforma definitiva para emissão e gestão de documentos digitais forenses.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-[#005CA9] px-10 py-4 rounded-2xl text-base md:text-lg font-black uppercase tracking-tight shadow-xl hover:bg-gray-50 active:scale-95 transition-all"
          >
            Acessar Painel
          </button>
          <button
            onClick={() => navigate("/register")}
            className="bg-transparent text-white border-2 border-white/40 px-10 py-4 rounded-2xl text-base md:text-lg font-black uppercase tracking-tight hover:bg-white/10 active:scale-95 transition-all"
          >
            Criar Conta
          </button>
        </div>
        <p className="mt-12 text-xs md:text-sm opacity-50 font-bold uppercase tracking-widest">
          © 2026 DocMaster Group • Tecnologia de Elite
        </p>
      </div>
    </div>
  );
}
