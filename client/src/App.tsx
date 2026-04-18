     1	import { Toaster } from "@/components/ui/sonner";
     2	import { TooltipProvider } from "@/components/ui/tooltip";
     3	import { Route, Switch } from "wouter";
     4	import ErrorBoundary from "./components/ErrorBoundary";
     5	import { ThemeProvider } from "./contexts/ThemeContext";
     6	import { AuthProvider, useAuth } from "./contexts/AuthContext";
     7	import { useLocation } from "wouter";
     8	import { useEffect } from "react";
     9	
    10	function GlobalSupportWhatsappSync() {
    11	  useEffect(() => {
    12	    if (typeof window === "undefined") return;
    13	
    14	    let supportWhatsapp = "";
    15	
    16	    const buildMessage = (originalHref: string) => {
    17	      const match = originalHref.match(/\?text=([^&]+)/);
    18	      return match ? decodeURIComponent(match[1]) : "Preciso de suporte";
    19	    };
    20	
    21	    const applyWhatsappLinks = () => {
    22	      if (!supportWhatsapp) return;
    23	      const phone = supportWhatsapp.replace(/\D/g, "");
    24	      if (!phone) return;
    25	
    26	      document.querySelectorAll<HTMLAnchorElement>("a[href*='wa.me']").forEach((anchor) => {
    27	        const message = buildMessage(anchor.href);
    28	        anchor.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    29	      });
    30	    };
    31	
    32	    fetch("/api/settings/public", { credentials: "include" })
    33	      .then((res) => res.json())
    34	      .then((data) => {
    35	        supportWhatsapp = typeof data?.support_whatsapp === "string" ? data.support_whatsapp : "";
    36	        applyWhatsappLinks();
    37	      })
    38	      .catch(() => undefined);
    39	
    40	    const observer = new MutationObserver(() => applyWhatsappLinks());
    41	    observer.observe(document.body, { childList: true, subtree: true });
    42	    return () => observer.disconnect();
    43	  }, []);
    44	
    45	  return null;
    46	}
    47	
    48	// Helper for protected routes
    49	function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
    50	  const { user, loading, isAdmin } = useAuth();
    51	  const [, setLocation] = useLocation();
    52	
    53	  useEffect(() => {
    54	    if (!loading) {
    55	      if (!user) {
    56	        setLocation("/login");
    57	      } else if (adminOnly && !isAdmin) {
    58	        setLocation("/dashboard");
    59	      }
    60	    }
    61	  }, [user, loading, isAdmin, adminOnly, setLocation]);
    62	
    63	  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    64	  if (!user || (adminOnly && !isAdmin)) return null;
    65	
    66	  return <Component {...rest} />;
    67	}
    68	
    69	// Pages
    70	import Home from "./pages/Home";
    71	import Login from "./pages/Login";
    72	import Register from "./pages/Register";
    73	import Dashboard from "./pages/Dashboard";
    74	import AtestadoCria from "./pages/AtestadoCria";
    75	import AtestadoView from "./pages/AtestadoView";
    76	import Validation from "./pages/Validation";
    77	import CNHCria from "./pages/CNHCria";
    78	import CHACria from "./pages/CHACria";
    79	import ToxicologicoCria from "./pages/ToxicologicoCria";
    80	import ToxicriaCria from "./pages/ToxicriaCria";
    81	import ToxicriaSalvos from "./pages/ToxicriaSalvos";
    82	import HistoricoSP from "./pages/HistoricoSP";
    83	import HistoricoUNINTER from "./pages/HistoricoUNINTER";
    84	import AdminDashboard from "./pages/AdminDashboard";
    85	import ReceitaCria from "./pages/ReceitaCria";
    86	import AtestadoEditar from "./pages/AtestadoEditar";
    87	import ReceitaEditar from "./pages/ReceitaEditar";
    88	import CNHEditar from "./pages/CNHEditar";
    89	import CHAEditar from "./pages/CHAEditar";
    90	import ToxicologicoEditar from "./pages/ToxicologicoEditar";
    91	import ValidationReceita from "./pages/ValidationReceita";
    92	import Extrato from "./pages/Extrato";
    93	import Recargas from "./pages/Recargas";
    94	import Configuracoes from "./pages/Configuracoes";
    95	import Indicacoes from "./pages/Indicacoes";
    96	import NotFound from "./pages/NotFound";
    97	
    98	// Páginas Salvas
    99	import CNHSalvas from "./pages/CNHSalvas";
   100	import AtestadosSalvos from "./pages/AtestadosSalvos";
   101	import CHASalvas from "./pages/CHASalvas";
   102	import ToxicologicoSalvos from "./pages/ToxicologicoSalvos";
   103	import ReceitasSalvas from "./pages/ReceitasSalvas";
   104	import HistoricoSPSalvos from "./pages/HistoricoSPSalvos";
   105	import HistoricoUNINTERSalvos from "./pages/HistoricoUNINTERSalvos";
   106	
   107	// ─── Detectar Domínio ──────────────────────────────────────────────────────────
   108	const isValidationDomain = typeof window !== 'undefined' && 
   109	  (window.location.hostname === 'validaratestado.digital' || 
   110	   window.location.hostname === 'www.validaratestado.digital');
   111	
   112	const isVerificaMedDomain = typeof window !== 'undefined' &&
   113	  (window.location.hostname === 'verificamed.digital' ||
   114	   window.location.hostname === 'www.verificamed.digital');
   115	
   116	const isCNHValidationDomain = typeof window !== 'undefined' &&
   117	  (window.location.hostname === 'carteira-digital-transito-vio.digital' ||
   118	   window.location.hostname === 'www.carteira-digital-transito-vio.digital');
   119	
   120	// ─── Roteador para verificamed.digital (Validação de Receitas) ───────────────────
   121	function VerificaMedRouter() {
   122	  return (
   123	    <Switch>
   124	      <Route path="/verificar/receita/:id" component={ValidationReceita} />
   125	      <Route path="/verificar-receita/:id" component={ValidationReceita} />
   126	      <Route path="/verificar/:id" component={ValidationReceita} />
   127	      <Route path="/" component={ValidationReceita} />
   128	      <Route component={ValidationReceita} />
   129	    </Switch>
   130	  );
   131	}
   132	
   133	// ─── Roteador para carteira-digital-transito-vio.digital (Validação CNH) ──────
   134	function CNHValidationRouter() {
   135	  return (
   136	    <Switch>
   137	      <Route path="/verificar/:id" component={Validation} />
   138	      <Route path="/consulta" component={Validation} />
   139	      <Route path="/:id" component={(props: { params: { id: string } }) => {
   140	        const id = props.params?.id || "";
   141	        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
   142	          return <Validation />;
   143	        }
   144	        return <Validation />;
   145	      }} />
   146	      <Route path="/" component={Validation} />
   147	      <Route component={Validation} />
   148	    </Switch>
   149	  );
   150	}
   151	
   152	// ─── Roteador para validaratestado.digital (Apenas Validação) ──────────────────
   153	function ValidationRouter() {
   154	  return (
   155	    <Switch>
   156	      <Route path="/verificar/atestado/:id" component={Validation} />
   157	      <Route path="/verificar/:id" component={Validation} />
   158	      <Route path="/:id" component={(props: { params: { id: string } }) => {
   159	        const id = props.params?.id || "";
   160	        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
   161	          return <Validation />;
   162	        }
   163	        return <NotFound />;
   164	      }} />
   165	      <Route path="/" component={Validation} />
   166	      <Route path="/validar" component={Validation} />
   167	      <Route path="/v/:id" component={Validation} />
   168	      <Route component={Validation} />
   169	    </Switch>
   170	  );
   171	}
   172	
   173	// ─── Roteador para docmaster.store (Painel Completo) ─────────────────────────────
   174	function DocMasterRouter() {
   175	  return (
   176	    <Switch>
   177	      {/* Landing page pública */}
   178	      <Route path="/" component={Home} />
   179	
   180	      {/* Autenticação */}
   181	      <Route path="/login" component={Login} />
   182	      <Route path="/register" component={Register} />
   183	
   184	      {/* Painel principal */}
   185	      <Route path="/dashboard">
   186	        <ProtectedRoute component={Dashboard} />
   187	      </Route>
   188	
   189	      {/* Emissão de documentos - slugs principais */}
   190	      <Route path="/atestado">
   191	        <ProtectedRoute component={AtestadoCria} />
   192	      </Route>
   193	      <Route path="/atestado/editar/:id">
   194	        {(params) => <ProtectedRoute component={AtestadoEditar} params={params} />}
   195	      </Route>
   196	      <Route path="/atestadosalvos">
   197	        <ProtectedRoute component={AtestadosSalvos} />
   198	      </Route>
   199	
   200	      <Route path="/cnh">
   201	        <ProtectedRoute component={CNHCria} />
   202	      </Route>
   203	      <Route path="/cnh/editar/:id">
   204	        {(params) => <ProtectedRoute component={CNHEditar} params={params} />}
   205	      </Route>
   206	      <Route path="/cnhsalvas">
   207	        <ProtectedRoute component={CNHSalvas} />
   208	      </Route>
   209	
   210	      <Route path="/cha">
   211	        <ProtectedRoute component={CHACria} />
   212	      </Route>
   213	      <Route path="/cha/editar/:id">
   214	        {(params) => <ProtectedRoute component={CHAEditar} params={params} />}
   215	      </Route>
   216	      <Route path="/chasalvas">
   217	        <ProtectedRoute component={CHASalvas} />
   218	      </Route>
   219	
   220	      {/* Toxicológico */}
   221	      <Route path="/toxicologico">
   222	        <ProtectedRoute component={ToxicologicoCria} />
   223	      </Route>
   224	      <Route path="/toxicologico/editar/:id">
   225	        {(params) => <ProtectedRoute component={ToxicologicoEditar} params={params} />}
   226	      </Route>
   227	      <Route path="/toxicologicosalvos">
   228	        <ProtectedRoute component={ToxicologicoSalvos} />
   229	      </Route>
   230	
   231	      {/* Rotas legacy */}
   232	      <Route path="/atestadocria">
   233	        <ProtectedRoute component={AtestadoCria} />
   234	      </Route>
   235	      <Route path="/cnhcria">
   236	        <ProtectedRoute component={CNHCria} />
   237	      </Route>
   238	      <Route path="/chacria">
   239	        <ProtectedRoute component={CHACria} />
   240	      </Route>
   241	
   242	      {/* Receituário Médico */}
   243	      <Route path="/receita">
   244	        <ProtectedRoute component={ReceitaCria} />
   245	      </Route>
   246	      <Route path="/receitacria">
   247	        <ProtectedRoute component={ReceitaCria} />
   248	      </Route>
   249	      <Route path="/receita/editar/:id">
   250	        {(params) => <ProtectedRoute component={ReceitaEditar} params={params} />}
   251	      </Route>
   252	      <Route path="/receitassalvas">
   253	        <ProtectedRoute component={ReceitasSalvas} />
   254	      </Route>
   255	
   256	      {/* Históricos */}
   257	      <Route path="/historico/atestados">
   258	        <ProtectedRoute component={AtestadoCria} />
   259	      </Route>
   260	      <Route path="/historico/atestados/:id">
   261	        {(params) => <ProtectedRoute component={AtestadoView} params={params} />}
   262	      </Route>
   263	      <Route path="/historico-sp">
   264	        <ProtectedRoute component={HistoricoSP} />
   265	      </Route>
   266	      <Route path="/historico-sp-salvos">
   267	        <ProtectedRoute component={HistoricoSPSalvos} />
   268	      </Route>
   269	      <Route path="/historico-uninter">
   270	        <ProtectedRoute component={HistoricoUNINTER} />
   271	      </Route>
   272	      <Route path="/historico-uninter-salvos">
   273	        <ProtectedRoute component={HistoricoUNINTERSalvos} />
   274	      </Route>
   275	
   276	      {/* Financeiro */}
   277	      <Route path="/extrato">
   278	        <ProtectedRoute component={Extrato} />
   279	      </Route>
   280	      <Route path="/recargas">
   281	        <ProtectedRoute component={Recargas} />
   282	      </Route>
   283	
   284	      {/* Configurações do usuário */}
   285	      <Route path="/configuracoes">
   286	        <ProtectedRoute component={Configuracoes} />
   287	      </Route>
   288	
   289	      {/* Indicações */}
   290	      <Route path="/indicacoes">
   291	        <ProtectedRoute component={Indicacoes} />
   292	      </Route>
   293	
   294	      {/* Administração */}
   295	      <Route path="/admin">
   296	        <ProtectedRoute component={AdminDashboard} adminOnly={true} />
   297	      </Route>
   298	
   299	      {/* Validação pública de documentos */}
   300	      <Route path="/validar" component={Validation} />
   301	      <Route path="/v/:id" component={Validation} />
   302	      <Route path="/:id" component={(props: { params: { id: string } }) => {
   303	        const id = props.params?.id || "";
   304	        if (/^[A-Z0-9]{4}\.[A-Z0-9]{4}$/i.test(id)) {
   305	          return <Validation />;
   306	        }
   307	        return <NotFound />;
   308	      }} />
   309	
   310	      {/* 404 */}
   311	      <Route path="/404" component={NotFound} />
   312	      <Route component={NotFound} />
   313	    </Switch>
   314	  );
   315	}
   316	
   317	function App() {
   318	  return (
   319	    <ErrorBoundary>
   320	      <ThemeProvider defaultTheme="light" switchable={true}>
   321	        <AuthProvider>
   322	          <TooltipProvider>
   323	            <Toaster />
   324	            <GlobalSupportWhatsappSync />
   325	            {isCNHValidationDomain
   326	              ? <CNHValidationRouter />
   327	              : isVerificaMedDomain
   328	                ? <VerificaMedRouter />
   329	                : isValidationDomain
   330	                  ? <ValidationRouter />
   331	                  : <DocMasterRouter />
   332	            }
   333	          </TooltipProvider>
   334	        </AuthProvider>
   335	      </ThemeProvider>
   336	    </ErrorBoundary>
   337	  );
   338	}
   339	
   340	export default App;
   341	