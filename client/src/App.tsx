import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
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
import NotFound from "./pages/NotFound";

function isValidationDomain(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "validaratestado.digital" || hostname === "www.validaratestado.digital";
}

function Router() {
  const onValidationDomain = isValidationDomain();
  return (
    <Switch>
      <Route path="/" component={onValidationDomain ? Validation : Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/atestadocria" component={AtestadoCria} />
      <Route path="/atestado/:id" component={AtestadoView} />
      <Route path="/cnhcria" component={CNHCria} />
      <Route path="/chacria" component={CHACria} />
      <Route path="/toxicologicocria" component={ToxicologicoCria} />
      <Route path="/historico-sp" component={HistoricoSP} />
      <Route path="/historico-uninter" component={HistoricoUNINTER} />
      <Route path="/extrato" component={Extrato} />
      <Route path="/recargas" component={Recargas} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/validar" component={Validation} />
      <Route path="/v/:id" component={Validation} />
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
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
