import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AtestadoCria from "./pages/AtestadoCria";
import AtestadoView from "./pages/AtestadoView";
import Validation from "./pages/Validation";
import CNHCria from "./pages/CNHCria";
import CHACria from "./pages/CHACria";
import ToxicologicoCria from "./pages/ToxicologicoCria";
import HistoricoSP from "./pages/HistoricoSP";
import HistoricoUNINTER from "./pages/HistoricoUNINTER";
import AdminDashboard from "./pages/AdminDashboard";
import Extrato from "./pages/Extrato";
import Recargas from "./pages/Recargas";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

// ─── Detectar Domínio ──────────────────────────────────────────────────────────
const isValidationDomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'validaratestado.digital' || 
   window.location.hostname === 'www.validaratestado.digital');

// ─── Roteador para validaratestado.digital (Apenas Validação) ──────────────────
function ValidationRouter() {
  return (
    <Switch>
      {/* Rota para código direto: /XXXX.XXXX */}
      <Route path="/:id" component={(props: { params: { id: string } }) => {
        const id = props.params?.id || "";
        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
          return <Validation />;
        }
        return <NotFound />;
      }} />
      
      {/* Rota raiz: / - Sempre validação */}
      <Route path="/" component={Validation} />
      
      {/* Rota legacy /validar */}
      <Route path="/validar" component={Validation} />
      
      {/* Rota legacy /v/:id */}
      <Route path="/v/:id" component={Validation} />
      
      {/* Qualquer outra rota em validaratestado.digital redireciona para validação */}
      <Route component={Validation} />
    </Switch>
  );
}

// ─── Roteador para docmaster.store (Painel Completo) ─────────────────────────────
function DocMasterRouter() {
  return (
    <Switch>
      {/* Landing page pública */}
      <Route path="/" component={Home} />

      {/* Autenticação */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Painel principal */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Emissão de documentos - slugs principais */}
      <Route path="/atestado" component={AtestadoCria} />
      <Route path="/cnh" component={CNHCria} />
      <Route path="/cha" component={CHACria} />
      <Route path="/toxicologico" component={ToxicologicoCria} />
      {/* Rotas legacy - redirecionam para slugs */}
      <Route path="/atestadocria" component={AtestadoCria} />
      <Route path="/cnhcria" component={CNHCria} />
      <Route path="/chacria" component={CHACria} />
      <Route path="/toxicologicocria" component={ToxicologicoCria} />

      {/* Históricos */}
      <Route path="/historico/atestados" component={AtestadoCria} />
      <Route path="/historico/atestados/:id" component={AtestadoView} />
      <Route path="/historico-sp" component={HistoricoSP} />
      <Route path="/historico-uninter" component={HistoricoUNINTER} />

      {/* Financeiro */}
      <Route path="/extrato" component={Extrato} />
      <Route path="/recargas" component={Recargas} />

      {/* Configurações do usuário */}
      <Route path="/configuracoes" component={Configuracoes} />

      {/* Administração */}
      <Route path="/admin" component={AdminDashboard} />

      {/* Validação pública de documentos */}
      <Route path="/validar" component={Validation} />
      <Route path="/v/:id" component={Validation} />
      {/* Rota direta para validaratestado.digital/:codigo (formato XXXX.XXXX) */}
      <Route path="/:id" component={(props: { params: { id: string } }) => {
        const id = props.params?.id || "";
        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
          return <Validation />;
        }
        return <NotFound />;
      }} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            {/* Renderizar roteador apropriado baseado no domínio */}
            {isValidationDomain ? <ValidationRouter /> : <DocMasterRouter />}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
