import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User, Sun, Moon } from "lucide-react";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Acesso autorizado!");
      setLocation("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gray-800/20 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 backdrop-blur-sm shadow-md text-gray-300 hover:bg-gray-700 transition-all z-10"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-sm mx-4 relative z-10">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/60 p-8">
          {/* Logo 01 — ícone DM */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-5">
              <img
                src="/assets/logo-icon.png"
                alt="DocMaster"
                className="h-20 w-auto object-contain drop-shadow-2xl"
                draggable={false}
              />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Acesse sua conta
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Área restrita — acesso autorizado
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Seu usuário"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-600 text-xs">
              Não tem acesso?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-red-500 hover:text-red-400 font-medium transition-colors"
              >
                Solicitar conta
              </button>
            </p>
          </div>
        </div>

        {/* Rodapé discreto sem menção a "documentos digitais" */}
        <p className="text-center text-gray-700 text-xs mt-4">
          &copy; {new Date().getFullYear()} DocMaster
        </p>
      </div>
    </div>
  );
}
