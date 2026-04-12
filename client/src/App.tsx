import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Helper for protected routes
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, loading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation("/login");
      } else if (adminOnly && !isAdmin) {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, isAdmin, adminOnly, setLocation]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user || (adminOnly && !isAdmin)) return null;

  return <Component {...rest} />;
}

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
import ToxicriaCria from "./pages/ToxicriaCria";
import ToxicriaSalvos from "./pages/ToxicriaSalvos";
import HistoricoSP from "./pages/HistoricoSP";
import HistoricoUNINTER from "./pages/HistoricoUNINTER";
import AdminDashboard from "./pages/AdminDashboard";
import ReceitaCria from "./pages/ReceitaCria";
import AtestadoEditar from "./pages/AtestadoEditar";
import ReceitaEditar from "./pages/ReceitaEditar";
import CNHEditar from "./pages/CNHEditar";
import CHAEditar from "./pages/CHAEditar";
import ToxicologicoEditar from "./pages/ToxicologicoEditar";
import ValidationReceita from "./pages/ValidationReceita";
import Extrato from "./pages/Extrato";
import Recargas from "./pages/Recargas";
import Configuracoes from "./pages/Configuracoes";
import Indicacoes from "./pages/Indicacoes";
import NotFound from "./pages/NotFound";

// Páginas Salvas
import CNHSalvas from "./pages/CNHSalvas";
import AtestadosSalvos from "./pages/AtestadosSalvos";
import CHASalvas from "./pages/CHASalvas";
import ToxicologicoSalvos from "./pages/ToxicologicoSalvos";
import ReceitasSalvas from "./pages/ReceitasSalvas";
import HistoricoSPSalvos from "./pages/HistoricoSPSalvos";
import HistoricoUNINTERSalvos from "./pages/HistoricoUNINTERSalvos";

// ─── Detectar Domínio ──────────────────────────────────────────────────────────
const isValidationDomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'validaratestado.digital' || 
   window.location.hostname === 'www.validaratestado.digital');

const isVerificaMedDomain = typeof window !== 'undefined' &&
  (window.location.hostname === 'verificamed.digital' ||
   window.location.hostname === 'www.verificamed.digital');

const isCNHValidationDomain = typeof window !== 'undefined' &&
  (window.location.hostname === 'carteira-digital-transito-vio.digital' ||
   window.location.hostname === 'www.carteira-digital-transito-vio.digital');

// ─── Roteador para verificamed.digital (Validação de Receitas) ───────────────────
function VerificaMedRouter() {
  return (
    <Switch>
      <Route path="/verificar/receita/:id" component={ValidationReceita} />
      <Route path="/verificar-receita/:id" component={ValidationReceita} />
      <Route path="/verificar/:id" component={ValidationReceita} />
      <Route path="/" component={ValidationReceita} />
      <Route component={ValidationReceita} />
    </Switch>
  );
}

// ─── Roteador para carteira-digital-transito-vio.digital (Validação CNH) ──────
function CNHValidationRouter() {
  return (
    <Switch>
      <Route path="/verificar/:id" component={Validation} />
      <Route path="/consulta" component={Validation} />
      <Route path="/:id" component={(props: { params: { id: string } }) => {
        const id = props.params?.id || "";
        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
          return <Validation />;
        }
        return <Validation />;
      }} />
      <Route path="/" component={Validation} />
      <Route component={Validation} />
    </Switch>
  );
}

// ─── Roteador para validaratestado.digital (Apenas Validação) ──────────────────
function ValidationRouter() {
  return (
    <Switch>
      <Route path="/verificar/atestado/:id" component={Validation} />
      <Route path="/verificar/:id" component={Validation} />
      <Route path="/:id" component={(props: { params: { id: string } }) => {
        const id = props.params?.id || "";
        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
          return <Validation />;
        }
        return <NotFound />;
      }} />
      <Route path="/" component={Validation} />
      <Route path="/validar" component={Validation} />
      <Route path="/v/:id" component={Validation} />
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
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      {/* Emissão de documentos - slugs principais */}
      <Route path="/atestado">
        <ProtectedRoute component={AtestadoCria} />
      </Route>
      <Route path="/atestado/editar/:id">
        {(params) => <ProtectedRoute component={AtestadoEditar} params={params} />}
      </Route>
      <Route path="/atestadosalvos">
        <ProtectedRoute component={AtestadosSalvos} />
      </Route>

      <Route path="/cnh">
        <ProtectedRoute component={CNHCria} />
      </Route>
      <Route path="/cnh/editar/:id">
        {(params) => <ProtectedRoute component={CNHEditar} params={params} />}
      </Route>
      <Route path="/cnhsalvas">
        <ProtectedRoute component={CNHSalvas} />
      </Route>

      <Route path="/cha">
        <ProtectedRoute component={CHACria} />
      </Route>
      <Route path="/cha/editar/:id">
        {(params) => <ProtectedRoute component={CHAEditar} params={params} />}
      </Route>
      <Route path="/chasalvas">
        <ProtectedRoute component={CHASalvas} />
      </Route>

      {/* Toxicológico */}
      <Route path="/toxicologico">
        <ProtectedRoute component={ToxicologicoCria} />
      </Route>
      <Route path="/toxicologico/editar/:id">
        {(params) => <ProtectedRoute component={ToxicologicoEditar} params={params} />}
      </Route>
      <Route path="/toxicologicosalvos">
        <ProtectedRoute component={ToxicologicoSalvos} />
      </Route>

      {/* Rotas legacy */}
      <Route path="/atestadocria">
        <ProtectedRoute component={AtestadoCria} />
      </Route>
      <Route path="/cnhcria">
        <ProtectedRoute component={CNHCria} />
      </Route>
      <Route path="/chacria">
        <ProtectedRoute component={CHACria} />
      </Route>

      {/* Receituário Médico */}
      <Route path="/receita">
        <ProtectedRoute component={ReceitaCria} />
      </Route>
      <Route path="/receitacria">
        <ProtectedRoute component={ReceitaCria} />
      </Route>
      <Route path="/receita/editar/:id">
        {(params) => <ProtectedRoute component={ReceitaEditar} params={params} />}
      </Route>
      <Route path="/receitassalvas">
        <ProtectedRoute component={ReceitasSalvas} />
      </Route>

      {/* Históricos */}
      <Route path="/historico/atestados">
        <ProtectedRoute component={AtestadoCria} />
      </Route>
      <Route path="/historico/atestados/:id">
        {(params) => <ProtectedRoute component={AtestadoView} params={params} />}
      </Route>
      <Route path="/historico-sp">
        <ProtectedRoute component={HistoricoSP} />
      </Route>
      <Route path="/historico-sp-salvos">
        <ProtectedRoute component={HistoricoSPSalvos} />
      </Route>
      <Route path="/historico-uninter">
        <ProtectedRoute component={HistoricoUNINTER} />
      </Route>
      <Route path="/historico-uninter-salvos">
        <ProtectedRoute component={HistoricoUNINTERSalvos} />
      </Route>

      {/* Financeiro */}
      <Route path="/extrato">
        <ProtectedRoute component={Extrato} />
      </Route>
      <Route path="/recargas">
        <ProtectedRoute component={Recargas} />
      </Route>

      {/* Configurações do usuário */}
      <Route path="/configuracoes">
        <ProtectedRoute component={Configuracoes} />
      </Route>

      {/* Indicações */}
      <Route path="/indicacoes">
        <ProtectedRoute component={Indicacoes} />
      </Route>

      {/* Administração */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly={true} />
      </Route>

      {/* Validação pública de documentos */}
      <Route path="/validar" component={Validation} />
      <Route path="/v/:id" component={Validation} />
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
            {isCNHValidationDomain
              ? <CNHValidationRouter />
              : isVerificaMedDomain
                ? <VerificaMedRouter />
                : isValidationDomain
                  ? <ValidationRouter />
                  : <DocMasterRouter />
            }
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
