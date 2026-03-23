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
import ToxicriaCria from "./pages/ToxicriaCria";
import ToxicriaSalvos from "./pages/ToxicriaSalvos";
import HistoricoSP from "./pages/HistoricoSP";
import HistoricoUNINTER from "./pages/HistoricoUNINTER";
import AdminDashboard from "./pages/AdminDashboard";
import ReceitaCria from "./pages/ReceitaCria";
import AtestadoEditar from "./pages/AtestadoEditar";
import ReceitaEditar from "./pages/ReceitaEditar";
import ValidationReceita from "./pages/ValidationReceita";
import Extrato from "./pages/Extrato";
import Recargas from "./pages/Recargas";
import Configuracoes from "./pages/Configuracoes";
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
      <Route path="/verificar/receita/:id" component={Validation} />
      <Route path="/verificar-receita/:id" component={Validation} />
      <Route path="/verificar/:id" component={Validation} />
      <Route path="/" component={Validation} />
      <Route component={Validation} />
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
      <Route path="/dashboard" component={Dashboard} />

      {/* Emissão de documentos - slugs principais */}
      <Route path="/atestado" component={AtestadoCria} />
      <Route path="/atestado/editar/:id" component={AtestadoEditar} />
      <Route path="/atestadosalvos" component={AtestadosSalvos} />

      <Route path="/cnh" component={CNHCria} />
      <Route path="/cnhsalvas" component={CNHSalvas} />

      <Route path="/cha" component={CHACria} />
      <Route path="/chasalvas" component={CHASalvas} />

      <Route path="/toxicologico" component={ToxicologicoCria} />
      <Route path="/toxicologicosalvos" component={ToxicologicoSalvos} />

      {/* Toxicria - Laudo Toxicológico Sodré */}
      <Route path="/toxicria" component={ToxicriaCria} />
      <Route path="/toxicriasalvos" component={ToxicriaSalvos} />
      <Route path="/toxicriaCria" component={ToxicriaCria} />

      {/* Rotas legacy */}
      <Route path="/atestadocria" component={AtestadoCria} />
      <Route path="/cnhcria" component={CNHCria} />
      <Route path="/chacria" component={CHACria} />
      <Route path="/toxicologicocria" component={ToxicologicoCria} />

      {/* Receituário Médico */}
      <Route path="/receita" component={ReceitaCria} />
      <Route path="/receitacria" component={ReceitaCria} />
      <Route path="/receita/editar/:id" component={ReceitaEditar} />
      <Route path="/receitassalvas" component={ReceitasSalvas} />

      {/* Históricos */}
      <Route path="/historico/atestados" component={AtestadoCria} />
      <Route path="/historico/atestados/:id" component={AtestadoView} />
      <Route path="/historico-sp" component={HistoricoSP} />
      <Route path="/historico-sp-salvos" component={HistoricoSPSalvos} />
      <Route path="/historico-uninter" component={HistoricoUNINTER} />
      <Route path="/historico-uninter-salvos" component={HistoricoUNINTERSalvos} />

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
