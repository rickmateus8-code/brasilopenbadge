import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User, Mail, FileText } from "lucide-react";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Conta</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">DocMaster — Documentos Digitais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "displayName", label: "Nome de exibição", icon: User, placeholder: "Seu nome completo", type: "text" },
              { key: "username", label: "Usuário *", icon: User, placeholder: "Escolha um nome de usuário", type: "text" },
              { key: "email", label: "E-mail", icon: Mail, placeholder: "seu@email.com", type: "email" },
            ].map(({ key, label, icon: Icon, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={update(key as keyof typeof form)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            ))}

            {["password", "confirmPassword"].map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {key === "password" ? "Senha *" : "Confirmar Senha *"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form[key as keyof typeof form]}
                    onChange={update(key as keyof typeof form)}
                    placeholder={key === "password" ? "Mínimo 6 caracteres" : "Repita a senha"}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {key === "password" && (
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 text-sm mt-2"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Já tem uma conta?{" "}
              <button onClick={() => setLocation("/login")} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
