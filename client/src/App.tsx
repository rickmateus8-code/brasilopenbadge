import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AttestationView from "./pages/AttestationView";
import Validation from "./pages/Validation";
import CreateAttestation from "./pages/CreateAttestation";

/**
 * Detecta se o acesso é pelo domínio de validação.
 * - validaratestado.digital  → rota "/" exibe Validação
 * - atestados-idab.pages.dev → rota "/" exibe Home (painel administrativo)
 */
function isValidationDomain(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname === "validaratestado.digital" ||
    hostname === "www.validaratestado.digital"
  );
}

function Router() {
  const onValidationDomain = isValidationDomain();

  return (
    <Switch>
      {/* Rota raiz: Home no pages.dev, Validação no validaratestado.digital */}
      <Route path="/" component={onValidationDomain ? Validation : Home} />

      {/* Rotas de validação — sempre disponíveis em qualquer domínio */}
      <Route path="/validar" component={Validation} />
      <Route path="/v/:id" component={Validation} />

      {/* Rotas administrativas */}
      <Route path="/home" component={Home} />
      <Route path="/atestado/:id" component={AttestationView} />
      <Route path="/criar" component={CreateAttestation} />

      {/* Fallbacks */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
