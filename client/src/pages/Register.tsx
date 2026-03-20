import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User, Mail, Sun, Moon } from "lucide-react";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "", email: "", displayName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Preencha usuário e senha");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (form.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register({ username: form.username, password: form.password, email: form.email, displayName: form.displayName });
      toast.success("Conta criada com sucesso!");
      setLocation("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
      theme === "dark"
        ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
        : "bg-gradient-to-br from-gray-100 via-white to-gray-50"
    }`}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl ${
          theme === "dark" ? "bg-yellow-900/10" : "bg-yellow-400/10"
        }`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl ${
          theme === "dark" ? "bg-yellow-900/10" : "bg-yellow-400/10"
        }`} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm shadow-md transition-all z-10 ${
          theme === "dark"
            ? "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
            : "bg-white/80 text-gray-600 hover:bg-gray-100"
        }`}
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-sm mx-4 relative z-10">
        <div className={`rounded-2xl shadow-2xl border p-8 ${
          theme === "dark"
            ? "bg-gray-900/90 backdrop-blur-xl border-gray-800/60"
            : "bg-white/95 backdrop-blur-xl border-gray-200/60"
        }`}>
          <div className="text-center mb-7">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/assets/logo-icon.png"
                alt="DocMaster"
                className="h-16 w-auto object-contain drop-shadow-2xl"
                draggable={false}
              />
            </div>
            <h1 className={`text-xl font-bold tracking-wide ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>Criar Conta</h1>
            <p className={`text-xs mt-1 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}>DocMaster — Crie sua conta agora</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Display Name */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Nome de Exibição</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`} />
                <input type="text" value={form.displayName} onChange={update("displayName")} placeholder="Seu nome completo"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 ${
                    theme === "dark" ? "border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`} />
              </div>
            </div>
            {/* Username */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Usuário *</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`} />
                <input type="text" value={form.username} onChange={update("username")} placeholder="Escolha um nome de usuário" autoComplete="username"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 ${
                    theme === "dark" ? "border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`} />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>E-mail</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`} />
                <input type="email" value={form.email} onChange={update("email")} placeholder="seu@email.com" autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 ${
                    theme === "dark" ? "border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`} />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Senha *</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`} />
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 ${
                    theme === "dark" ? "border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    theme === "dark" ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  }`}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Confirm Password */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Confirmar Senha *</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`} />
                <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Repita a senha" autoComplete="new-password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 ${
                    theme === "dark" ? "border-gray-700/60 bg-gray-800/60 text-white placeholder-gray-600" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando conta...
                </span>
              ) : "Criar Conta"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className={`text-xs ${
              theme === "dark" ? "text-gray-600" : "text-gray-500"
            }`}>
              Já tem uma conta?{" "}
              <button onClick={() => setLocation("/login")} className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
