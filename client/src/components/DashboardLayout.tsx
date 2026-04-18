     1	import { useState, useEffect, useRef, useCallback } from "react";
     2	import { useLocation } from "wouter";
     3	import { useAuth, type AuthUser } from "@/contexts/AuthContext";
     4	import { useTheme } from "@/contexts/ThemeContext";
     5	import { usePresenceTracker } from "@/hooks/usePresenceTracker";
     6	import NovoDocumentoModal from "@/components/NovoDocumentoModal";
     7	import {
     8	  LayoutDashboard, FileText, CreditCard, Receipt, LogOut,
     9	  ChevronDown, ChevronRight, Menu, X, Sun, Moon,
    10	  Shield, GraduationCap, Car, Anchor, FlaskConical,
    11	  User, Wallet, Settings, HelpCircle, Plus, Bell, Pill, Gift, FilePlus
    12	} from "lucide-react";
    13	
    14	interface MenuItem {
    15	  icon: React.ElementType;
    16	  label: string;
    17	  path?: string;
    18	  children?: { label: string; path: string; isCreation?: boolean }[];
    19	}
    20	
    21	const menuItems: MenuItem[] = [
    22	  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    23	
    24	  {
    25	    icon: FileText, label: "Atestado",
    26	    children: [
    27	      { label: "Novo Atestado", path: "/atestadocria", isCreation: true },
    28	      { label: "Atestados Salvos", path: "/atestadosalvos" },
    29	    ],
    30	  },
    31	  {
    32	    icon: Car, label: "CNH Digital",
    33	    children: [
    34	      { label: "Criar CNH", path: "/cnhcria", isCreation: true },
    35	      { label: "CNHs Salvas", path: "/cnhsalvas" },
    36	    ],
    37	  },
    38	  {
    39	    icon: Anchor, label: "CHA Náutica",
    40	    children: [
    41	      { label: "Nova CHA", path: "/chacria", isCreation: true },
    42	      { label: "CHAs Salvas", path: "/chasalvas" },
    43	    ],
    44	  },
    45	
    46	
    47	  {
    48	    icon: Pill, label: "Receituário",
    49	    children: [
    50	      { label: "Dr. Consulta", path: "/receitacria", isCreation: true },
    51	      { label: "Receitas Salvas", path: "/receitassalvas" },
    52	    ],
    53	  },
    54	  { icon: Gift, label: "Indique e Ganhe", path: "/indicacoes" },
    55	];
    56	
    57	function SidebarItem({
    58	  item,
    59	  collapsed,
    60	  onNavigate,
    61	  userBalance = 0,
    62	  onInsufficientBalance,
    63	}: {
    64	  item: MenuItem;
    65	  collapsed: boolean;
    66	  onNavigate?: () => void;
    67	  userBalance?: number;
    68	  onInsufficientBalance?: () => void;
    69	}) {
    70	  const [location, setLocation] = useLocation();
    71	  const isChildActive = item.children?.some(c => location === c.path) ?? false;
    72	  const [open, setOpen] = useState(isChildActive);
    73	  const isActive = item.path
    74	    ? location === item.path
    75	    : isChildActive;
    76	  const Icon = item.icon;
    77	
    78	  // Sincronizar estado open quando a rota muda (corrige bug de piscar)
    79	  useEffect(() => {
    80	    if (item.children) {
    81	      const active = item.children.some(c => location === c.path);
    82	      if (active) setOpen(true);
    83	    }
    84	  }, [location, item.children]);
    85	
    86	  const navigate = useCallback((path: string, isCreation?: boolean) => {
    87	    // Bloquear navegação para criação se saldo zerado
    88	    if (isCreation && userBalance <= 0) {
    89	      onInsufficientBalance?.();
    90	      return;
    91	    }
    92	    setLocation(path);
    93	    onNavigate?.();
    94	  }, [setLocation, onNavigate, userBalance, onInsufficientBalance]);
    95	
    96	  // Toggle manual — só alterna se não há filho ativo (evita fechar menu ativo)
    97	  const handleToggle = useCallback(() => {
    98	    setOpen(o => !o);
    99	  }, []);
   100	
   101	  if (item.children) {
   102	    return (
   103	      <div>
   104	        <button
   105	          onClick={handleToggle}
   106	          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
   107	            ${isActive
   108	              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
   109	              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
   110	            }`}
   111	        >
   112	          <Icon className="w-4 h-4 flex-shrink-0" />
   113	          {!collapsed && (
   114	            <>
   115	              <span className="flex-1 text-left">{item.label}</span>
   116	              {open
   117	                ? <ChevronDown className="w-3 h-3 opacity-60" />
   118	                : <ChevronRight className="w-3 h-3 opacity-60" />}
   119	            </>
   120	          )}
   121	        </button>
   122	        {!collapsed && open && (
   123	          <div className="ml-7 mt-1 space-y-0.5">
   124	            {item.children.map(child => (
   125	              <button
   126	                key={child.path}
   127	                onClick={() => navigate(child.path, child.isCreation)}
   128	                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all
   129	                  ${location === child.path
   130	                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
   131	                    : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200"
   132	                  }`}
   133	              >
   134	                {child.label}
   135	              </button>
   136	            ))}
   137	          </div>
   138	        )}
   139	      </div>
   140	    );
   141	  }
   142	
   143	  return (
   144	    <button
   145	      onClick={() => item.path && navigate(item.path)}
   146	      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
   147	        ${isActive
   148	          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
   149	          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
   150	        }`}
   151	    >
   152	      <Icon className="w-4 h-4 flex-shrink-0" />
   153	      {!collapsed && <span>{item.label}</span>}
   154	    </button>
   155	  );
   156	}
   157	
   158	function UserDropdown({ user, logout, collapsed }: { user: AuthUser; logout: () => void; collapsed: boolean }) {
   159	  const [open, setOpen] = useState(false);
   160	  const [, setLocation] = useLocation();
   161	  const ref = useRef<HTMLDivElement>(null);
   162	
   163	  useEffect(() => {
   164	    const handler = (e: MouseEvent) => {
   165	      if (ref.current && !ref.current.contains(e.target as Node)) {
   166	        setOpen(false);
   167	      }
   168	    };
   169	    document.addEventListener("mousedown", handler);
   170	    return () => document.removeEventListener("mousedown", handler);
   171	  }, []);
   172	
   173	  const avatarSrc = user.profilePhoto;
   174	
   175	  return (
   176	    <div ref={ref} className="relative">
   177	      <button
   178	        onClick={() => setOpen(o => !o)}
   179	        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full ${collapsed ? "justify-center" : ""}`}
   180	      >
   181	        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-red-300 dark:border-red-700">
   182	          {avatarSrc ? (
   183	            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
   184	          ) : (
   185	            <User className="w-4 h-4 text-red-600 dark:text-red-400" />
   186	          )}
   187	        </div>
   188	        {!collapsed && (
   189	          <>
   190	            <div className="flex-1 min-w-0 text-left">
   191	              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
   192	                {user.displayName || user.username}
   193	              </p>
   194	              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
   195	                {user.role === "admin" ? "Administrador" : "Usuário"}
   196	              </p>
   197	            </div>
   198	            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
   199	          </>
   200	        )}
   201	      </button>
   202	
   203	      {open && (
   204	        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden min-w-[200px]">
   205	          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
   206	            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{user.displayName || user.username}</p>
   207	            <p className="text-[10px] text-gray-500">{user.email}</p>
   208	          </div>
   209	          <div className="py-1">
   210	            <button
   211	              onClick={() => { setLocation("/configuracoes"); setOpen(false); }}
   212	              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
   213	            >
   214	              <Settings className="w-4 h-4" />
   215	              Configurações
   216	            </button>
   217	            <button
   218	              onClick={() => { setLocation("/indicacoes"); setOpen(false); }}
   219	              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
   220	            >
   221	              <Gift className="w-4 h-4" />
   222	              Indicações
   223	            </button>
   224	            <button
   225	              onClick={() => { setLocation("/extrato"); setOpen(false); }}
   226	              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
   227	            >
   228	              <Receipt className="w-4 h-4" />
   229	              Extrato
   230	            </button>
   231	            <button
   232	              onClick={() => { setLocation("/recargas"); setOpen(false); }}
   233	              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
   234	            >
   235	              <CreditCard className="w-4 h-4" />
   236	              Recarregar Saldo
   237	            </button>
   238	            <a
   239	              href="https://wa.me/5511965355468?text=Preciso+de+suporte"
   240	              target="_blank"
   241	              rel="noopener noreferrer"
   242	              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
   243	            >
   244	              <HelpCircle className="w-4 h-4" />
   245	              Ajuda / Suporte
   246	            </a>
   247	          </div>
   248	          <div className="border-t border-gray-100 dark:border-gray-800 py-1">
   249	            <button
   250	              onClick={() => { logout(); setOpen(false); }}
   251	              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
   252	            >
   253	              <LogOut className="w-4 h-4" />
   254	              Sair
   255	            </button>
   256	          </div>
   257	        </div>
   258	      )}
   259	    </div>
   260	  );
   261	}
   262	
   263	export default function DashboardLayout({ children }: { children: React.ReactNode }) {
   264	  const { user, logout, isAdmin } = useAuth();
   265	  const { theme, toggleTheme } = useTheme();
   266	  usePresenceTracker();
   267	  const [, setLocation] = useLocation();
   268	  const [collapsed, setCollapsed] = useState(false);
   269	  const [mobileOpen, setMobileOpen] = useState(false);
   270	  const [showNovoDocModal, setShowNovoDocModal] = useState(false);
   271	  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
   272	  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
   273	
   274	  useEffect(() => {
   275	    const handler = () => {
   276	      if (window.innerWidth >= 768) setMobileOpen(false);
   277	    };
   278	    window.addEventListener("resize", handler);
   279	    return () => window.removeEventListener("resize", handler);
   280	  }, []);
   281	
   282	  if (!user) {
   283	    setLocation("/login");
   284	    return null;
   285	  }
   286	
   287	  const adminItems: MenuItem[] = isAdmin
   288	    ? [{ icon: Shield, label: "Admin", path: "/admin" }]
   289	    : [];
   290	
   291	  const allItems = [...menuItems, ...adminItems];
   292	  // Garantir que balance nunca seja NaN — D1 pode retornar null/string
   293	  const safeBalance = typeof user.balance === 'number' ? user.balance : (parseFloat(String(user.balance ?? '0')) || 0);
   294	  const balanceFormatted = `R$ ${(safeBalance / 100).toFixed(2).replace('.', ',')}`;
   295	  // Expor balance seguro para os componentes filhos
   296	  const userBalanceSafe = safeBalance;
   297	
   298	  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
   299	    <div
   300	      className={`flex flex-col h-full ${mobile ? "w-72" : collapsed ? "w-18" : "w-64"} 
   301	        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200`}
   302	    >
   303	      {/* Header com Logo */}
   304	      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800 min-h-[64px]">
   305	        {(!collapsed || mobile) && (
   306	          <div className="flex items-center cursor-pointer" onClick={() => setLocation("/dashboard")} title="Ir para Dashboard">
   307	            <img
   308	              src="/assets/logo-text.webp"
   309	              alt="DocMaster"
   310	              className="h-9 w-auto object-contain"
   311	              draggable={false}
   312	            />
   313	          </div>
   314	        )}
   315	        {collapsed && !mobile && (
   316	          <div className="flex items-center justify-center w-full cursor-pointer" onClick={() => setLocation("/dashboard")} title="Ir para Dashboard">
   317	            <img
   318	              src="/assets/logo-icon.png"
   319	              alt="DM"
   320	              className="h-9 w-9 object-contain"
   321	              draggable={false}
   322	            />
   323	          </div>
   324	        )}
   325	        {!mobile && (
   326	          <button
   327	            onClick={() => setCollapsed(c => !c)}
   328	            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
   329	            title={collapsed ? "Expandir menu" : "Recolher menu"}
   330	          >
   331	            {collapsed
   332	              ? <ChevronRight className="w-4 h-4" />
   333	              : <ChevronDown className="w-4 h-4 rotate-90" />}
   334	          </button>
   335	        )}
   336	        {mobile && (
   337	          <button
   338	            onClick={() => setMobileOpen(false)}
   339	            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
   340	          >
   341	            <X className="w-5 h-5" />
   342	          </button>
   343	        )}
   344	      </div>
   345	
   346	      {/* Botão + NOVO DOCUMENTO — destaque no topo da nav */}
   347	      <div className={`px-2 pt-3 pb-1 ${collapsed && !mobile ? "flex justify-center" : ""}`}>
   348	        <button
   349	          onClick={() => { setShowNovoDocModal(true); if (mobile) setMobileOpen(false); }}
   350	          className={`
   351	            flex items-center gap-2 rounded-xl font-bold text-sm transition-all shadow-sm
   352	            bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
   353	            text-white active:scale-95
   354	            ${collapsed && !mobile
   355	              ? "w-10 h-10 justify-center p-0"
   356	              : "w-full px-4 py-2.5 justify-center"
   357	            }
   358	          `}
   359	          title="Novo Documento"
   360	        >
   361	          <FilePlus className="w-4 h-4 flex-shrink-0" />
   362	          {(!collapsed || mobile) && <span>Novo Documento</span>}
   363	        </button>
   364	      </div>
   365	
   366	      {/* Nav */}
   367	      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
   368	        {allItems.map(item => (
   369	          <SidebarItem
   370	            key={item.label}
   371	            item={item}
   372	            collapsed={!mobile && collapsed}
   373	            onNavigate={mobile ? () => setMobileOpen(false) : undefined}
   374	            userBalance={userBalanceSafe}
   375	            onInsufficientBalance={() => {
   376	              if (mobile) setMobileOpen(false);
   377	              setShowInsufficientBalance(true);
   378	            }}
   379	          />
   380	        ))}
   381	        {/* Item HISTÓRICO — abre pop-up de seleção */}
   382	        <button
   383	          onClick={() => { setShowHistoricoModal(true); if (mobile) setMobileOpen(false); }}
   384	          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
   385	            text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100`}
   386	        >
   387	          <GraduationCap className="w-4 h-4 flex-shrink-0" />
   388	          {(!collapsed || mobile) && <span>Histórico</span>}
   389	        </button>
   390	      </nav>
   391	
   392	      {/* Footer */}
   393	      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
   394	        {/* Saldo com botão + */}
   395	        {(!collapsed || mobile) && (
   396	          <div className="px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 flex items-center justify-between">
   397	            <div>
   398	              <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">Saldo</p>
   399	              <p className="text-sm font-bold text-red-600 dark:text-red-400">
   400	                {balanceFormatted}
   401	              </p>
   402	            </div>
   403	            <button
   404	              onClick={() => setLocation("/recargas")}
   405	              className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm"
   406	              title="Adicionar saldo"
   407	            >
   408	              <Plus className="w-4 h-4" />
   409	            </button>
   410	          </div>
   411	        )}
   412	        {/* User dropdown */}
   413	        <UserDropdown user={user} logout={logout} collapsed={!mobile && collapsed} />
   414	        {/* Theme toggle */}
   415	        <div className={`flex gap-1 ${collapsed && !mobile ? "flex-col items-center" : ""}`}>
   416	          <button
   417	            onClick={toggleTheme}
   418	            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
   419	            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
   420	          >
   421	            {theme === "dark"
   422	              ? <Sun className="w-3.5 h-3.5" />
   423	              : <Moon className="w-3.5 h-3.5" />}
   424	            {(!collapsed || mobile) && (
   425	              <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
   426	            )}
   427	          </button>
   428	        </div>
   429	      </div>
   430	    </div>
   431	  );
   432	
   433	  return (
   434	    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
   435	      {/* Desktop Sidebar */}
   436	      <div className="hidden md:flex flex-shrink-0">
   437	        <SidebarContent />
   438	      </div>
   439	
   440	      {/* Mobile Sidebar Overlay */}
   441	      {mobileOpen && (
   442	        <div className="fixed inset-0 z-50 flex md:hidden">
   443	          <div
   444	            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
   445	            onClick={() => setMobileOpen(false)}
   446	          />
   447	          <div className="relative z-50 shadow-2xl">
   448	            <SidebarContent mobile />
   449	          </div>
   450	        </div>
   451	      )}
   452	
   453	      {/* Main Content */}
   454	      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
   455	        {/* Mobile Header */}
   456	        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
   457	          <button
   458	            onClick={() => setMobileOpen(true)}
   459	            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
   460	            aria-label="Abrir menu"
   461	          >
   462	            <Menu className="w-5 h-5" />
   463	          </button>
   464	          <img
   465	            src="/assets/logo-text.webp"
   466	            alt="DocMaster"
   467	            className="h-7 w-auto object-contain"
   468	            draggable={false}
   469	          />
   470	          <div className="flex items-center gap-2">
   471	            {/* Botão + Novo Documento no mobile header */}
   472	            <button
   473	              onClick={() => setShowNovoDocModal(true)}
   474	              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
   475	              title="Novo Documento"
   476	            >
   477	              <FilePlus className="w-3.5 h-3.5" />
   478	              <span className="hidden xs:inline">Novo</span>
   479	            </button>
   480	            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
   481	              <Wallet className="w-3.5 h-3.5 text-red-500" />
   482	              <span className="text-xs font-bold text-red-600 dark:text-red-400">
   483	                {balanceFormatted}
   484	              </span>
   485	            </div>
   486	            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center overflow-hidden border-2 border-red-300 dark:border-red-700">
   487	              {user.profilePhoto ? (
   488	                <img src={user.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
   489	              ) : (
   490	                <User className="w-4 h-4 text-red-600 dark:text-red-400" />
   491	              )}
   492	            </div>
   493	          </div>
   494	        </header>
   495	        {/* Page Content */}
   496	        <main className="flex-1 overflow-y-auto">
   497	          {children}
   498	        </main>
   499	      </div>
   500	
   501	      {/* WhatsApp Button */}
   502	      <a
   503	        href="https://wa.me/5511965355468?text=Venho%20de%20https%3A%2F%2Fdocmaster.store.%20Voc%C3%AA%20poderia%20me%20ajudar%3F"
   504	        target="_blank"
   505	        rel="noopener noreferrer"
   506	        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 active:scale-95 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
   507	        title="Suporte via WhatsApp"
   508	        aria-label="Contato WhatsApp"
   509	      >
   510	        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
   511	          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
   512	        </svg>
   513	      </a>
   514	
   515	      {/* Modal Novo Documento — disponível em qualquer página */}
   516	      <NovoDocumentoModal
   517	        open={showNovoDocModal}
   518	        onClose={() => setShowNovoDocModal(false)}
   519	        userBalance={userBalanceSafe}
   520	        username={user.username}
   521	      />
   522	
   523	      {/* Modal HISTÓRICO — seleção de tipo */}
   524	      {showHistoricoModal && (
   525	        <div
   526	          style={{
   527	            position: "fixed", inset: 0, zIndex: 9999,
   528	            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
   529	            display: "flex", alignItems: "center", justifyContent: "center",
   530	            padding: "16px",
   531	          }}
   532	          onClick={() => setShowHistoricoModal(false)}
   533	        >
   534	          <div
   535	            style={{
   536	              background: "var(--modal-bg, #fff)", borderRadius: 20, padding: "32px 28px",
   537	              maxWidth: 420, width: "100%",
   538	              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
   539	            }}
   540	            className="dark:bg-gray-900"
   541	            onClick={e => e.stopPropagation()}
   542	          >
   543	            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
   544	              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
   545	                <div style={{
   546	                  width: 36, height: 36, borderRadius: 10,
   547	                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
   548	                  display: "flex", alignItems: "center", justifyContent: "center",
   549	                }}>
   550	                  <GraduationCap style={{ width: 18, height: 18, color: "#fff" }} />
   551	                </div>
   552	                <div>
   553	                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "inherit", margin: 0 }} className="text-gray-900 dark:text-white">Histórico</h2>
   554	                  <p style={{ fontSize: 12, margin: 0 }} className="text-gray-500 dark:text-gray-400">Selecione o tipo de histórico</p>
   555	                </div>
   556	              </div>
   557	              <button
   558	                onClick={() => setShowHistoricoModal(false)}
   559	                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
   560	              >
   561	                <X className="w-4 h-4" />
   562	              </button>
   563	            </div>
   564	
   565	            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
   566	              {/* Histórico Escolar SP */}
   567	              <button
   568	                onClick={() => {
   569	                  setShowHistoricoModal(false);
   570	                  if (userBalanceSafe <= 0) { setShowInsufficientBalance(true); return; }
   571	                  setLocation("/historico-sp");
   572	                }}
   573	                style={{
   574	                  border: "2px solid #e5e7eb", borderRadius: 14, padding: "20px 12px",
   575	                  background: "transparent", cursor: "pointer", textAlign: "center",
   576	                  transition: "all 0.15s",
   577	                }}
   578	                className="hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:border-gray-700 group"
   579	              >
   580	                <div style={{
   581	                  width: 48, height: 48, borderRadius: 12,
   582	                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
   583	                  display: "flex", alignItems: "center", justifyContent: "center",
   584	                  margin: "0 auto 10px",
   585	                }}>
   586	                  <GraduationCap style={{ width: 22, height: 22, color: "#fff" }} />
   587	                </div>
   588	                <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: "#111827" }} className="dark:text-white">Histórico Escolar</p>
   589	                <p style={{ fontSize: 11, margin: 0 }} className="text-gray-500 dark:text-gray-400">Estado de SP</p>
   590	              </button>
   591	
   592	              {/* Histórico UNINTER */}
   593	              <button
   594	                onClick={() => {
   595	                  setShowHistoricoModal(false);
   596	                  if (userBalanceSafe <= 0) { setShowInsufficientBalance(true); return; }
   597	                  setLocation("/historico-uninter");
   598	                }}
   599	                style={{
   600	                  border: "2px solid #e5e7eb", borderRadius: 14, padding: "20px 12px",
   601	                  background: "transparent", cursor: "pointer", textAlign: "center",
   602	                  transition: "all 0.15s",
   603	                }}
   604	                className="hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:border-gray-700 group"
   605	              >
   606	                <div style={{
   607	                  width: 48, height: 48, borderRadius: 12,
   608	                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
   609	                  display: "flex", alignItems: "center", justifyContent: "center",
   610	                  margin: "0 auto 10px",
   611	                }}>
   612	                  <GraduationCap style={{ width: 22, height: 22, color: "#fff" }} />
   613	                </div>
   614	                <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: "#111827" }} className="dark:text-white">Histórico UNINTER</p>
   615	                <p style={{ fontSize: 11, margin: 0 }} className="text-gray-500 dark:text-gray-400">Centro Universitário</p>
   616	              </button>
   617	            </div>
   618	
   619	            {/* Links para salvos */}
   620	            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
   621	              <button
   622	                onClick={() => { setShowHistoricoModal(false); setLocation("/historico-sp-salvos"); }}
   623	                style={{
   624	                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
   625	                  background: "#f3f4f6", fontSize: 12, cursor: "pointer",
   626	                }}
   627	                className="text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
   628	              >
   629	                Históricos SP Salvos
   630	              </button>
   631	              <button
   632	                onClick={() => { setShowHistoricoModal(false); setLocation("/historico-uninter-salvos"); }}
   633	                style={{
   634	                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
   635	                  background: "#f3f4f6", fontSize: 12, cursor: "pointer",
   636	                }}
   637	                className="text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
   638	              >
   639	                Históricos UNINTER Salvos
   640	              </button>
   641	            </div>
   642	          </div>
   643	        </div>
   644	      )}
   645	
   646	      {/* Modal Saldo Insuficiente — acionado pelo submenu */}
   647	      {showInsufficientBalance && (
   648	        <div
   649	          style={{
   650	            position: "fixed", inset: 0, zIndex: 9999,
   651	            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
   652	            display: "flex", alignItems: "center", justifyContent: "center",
   653	            padding: "16px",
   654	          }}
   655	          onClick={() => setShowInsufficientBalance(false)}
   656	        >
   657	          <div
   658	            style={{
   659	              background: "#fff", borderRadius: 20, padding: "36px 32px",
   660	              maxWidth: 380, width: "100%", textAlign: "center",
   661	              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
   662	            }}
   663	            onClick={e => e.stopPropagation()}
   664	          >
   665	            <div style={{
   666	              width: 72, height: 72, borderRadius: "50%",
   667	              border: "3px solid #f97316", display: "flex", alignItems: "center",
   668	              justifyContent: "center", margin: "0 auto 20px",
   669	            }}>
   670	              <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth={2}>
   671	                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
   672	              </svg>
   673	            </div>
   674	            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
   675	              Saldo Insuficiente
   676	            </h2>
   677	            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
   678	              Você não possui saldo suficiente para criar um novo documento.
   679	              Recarregue seu saldo para continuar.
   680	            </p>
   681	            <div style={{
   682	              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
   683	              padding: "10px 16px", marginBottom: 24, display: "flex",
   684	              alignItems: "center", justifyContent: "center", gap: 8,
   685	            }}>
   686	              <Wallet style={{ width: 16, height: 16, color: "#dc2626" }} />
   687	              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
   688	                Saldo atual: R$ {(userBalanceSafe / 100).toFixed(2).replace(".", ",")}
   689	              </span>
   690	            </div>
   691	            <div style={{ display: "flex", gap: 12 }}>
   692	              <button
   693	                onClick={() => { setShowInsufficientBalance(false); setLocation("/recargas"); }}
   694	                style={{
   695	                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
   696	                  background: "#16a34a", color: "#fff", fontWeight: 700,
   697	                  fontSize: 14, cursor: "pointer",
   698	                }}
   699	              >
   700	                Recarregar Agora
   701	              </button>
   702	              <button
   703	                onClick={() => setShowInsufficientBalance(false)}
   704	                style={{
   705	                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
   706	                  background: "#6b7280", color: "#fff", fontWeight: 700,
   707	                  fontSize: 14, cursor: "pointer",
   708	                }}
   709	              >
   710	                Cancelar
   711	              </button>
   712	            </div>
   713	          </div>
   714	        </div>
   715	      )}
   716	    </div>
   717	  );
   718	}
   719	