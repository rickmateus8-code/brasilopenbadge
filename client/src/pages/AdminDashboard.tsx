     1	import { useState, useEffect, useCallback } from "react";
     2	import { useLocation } from "wouter";
     3	import { useAuth } from "@/contexts/AuthContext";
     4	import DashboardLayout from "@/components/DashboardLayout";
     5	import AttestationDocument from "@/components/AttestationDocument";
     6	import { toast } from "sonner";
     7	import {
     8	  Users, Settings, Plus, Minus, Shield,
     9	  RefreshCw, DollarSign, Trash2, ToggleLeft, ToggleRight,
    10	  Bell, AlertTriangle, CheckCircle, Info, FileText,
    11	  Activity, Database, Search, Eye, EyeOff, X, Save,
    12	  Download, Edit3, Wifi, WifiOff, Monitor, Globe,
    13	  CreditCard, AlertCircle, Filter, Gift, Percent, Wallet,
    14	  Link, Copy, Calendar, Trash, Lock, UserPlus
    15	} from "lucide-react";
    16	
    17	type Tab = "users" | "pricing" | "notices" | "logs" | "emissions" | "monitoring" | "referral" | "database" | "settings";
    18	
    19	interface EmissionRow {
    20	  id: string;
    21	  user_id: string;
    22	  username?: string;
    23	  paciente?: string;
    24	  nome?: string;
    25	  type: string;
    26	  status: string;
    27	  codigo_qr?: string;
    28	  created_at: string;
    29	  table_source?: string;
    30	}
    31	
    32	interface UserRow {
    33	  id: string;
    34	  username: string;
    35	  email: string;
    36	  role: string;
    37	  balance: number;
    38	  is_active: number;
    39	  created_at: string;
    40	  profile_photo?: string;
    41	  cashback_percentage?: number | null;
    42	  referral_percentage?: number | null;
    43	}
    44	
    45	interface PricingRow {
    46	  document_type: string;
    47	  display_name: string;
    48	  price: number;
    49	  is_active?: boolean;
    50	}
    51	
    52	interface LogRow {
    53	  id: string;
    54	  user_id?: string;
    55	  username?: string;
    56	  action: string;
    57	  category?: string;
    58	  severity?: string;
    59	  details?: string;
    60	  target_type?: string;
    61	  target_id?: string;
    62	  created_at: string;
    63	}
    64	
    65	interface NoticeRow {
    66	  id?: number;
    67	  title: string;
    68	  message: string;
    69	  type: "info" | "warning" | "error" | "success";
    70	  is_active: number;
    71	  created_at?: string;
    72	}
    73	
    74	interface PresenceRow {
    75	  user_id: string;
    76	  username: string;
    77	  email?: string;
    78	  role?: string;
    79	  balance?: number;
    80	  profile_photo?: string;
    81	  current_page: string;
    82	  current_action: string;
    83	  last_seen: string;
    84	  is_online: number;
    85	  first_seen?: string;
    86	  session_started_at?: string;
    87	  current_page_started_at?: string;
    88	  total_session_seconds?: number;
    89	  current_page_duration_seconds?: number;
    90	  timeline?: Array<{
    91	    id: string;
    92	    page_path: string;
    93	    action: string;
    94	    started_at: string;
    95	    ended_at?: string | null;
    96	    duration_seconds: number;
    97	  }>;
    98	  page_totals?: Array<{
    99	    page: string;
   100	    duration_seconds: number;
   101	  }>;
   102	}
   103	
   104	const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
   105	  { key: "users", label: "Usuários", icon: Users },
   106	  { key: "monitoring", label: "Monitoramento", icon: Monitor },
   107	  { key: "pricing", label: "Preços", icon: DollarSign },
   108	  { key: "notices", label: "Avisos", icon: Bell },
   109	  { key: "logs", label: "Logs", icon: Activity },
   110	  { key: "emissions", label: "Emissões", icon: FileText },
   111	  { key: "referral", label: "Indicações", icon: Gift },
   112	  { key: "database", label: "Banco de Dados", icon: Database },
   113	  { key: "settings", label: "Configurações", icon: Settings },
   114	];
   115	
   116	const NOTICE_TYPES = [
   117	  { value: "info", label: "Informação", icon: Info },
   118	  { value: "warning", label: "Aviso", icon: AlertTriangle },
   119	  { value: "error", label: "Urgente", icon: AlertTriangle },
   120	  { value: "success", label: "Sucesso", icon: CheckCircle },
   121	];
   122	
   123	const DOC_TYPE_LABELS: Record<string, string> = {
   124	  atestado: "Atestado",
   125	  receita: "Receita",
   126	  cnh: "CNH",
   127	  cha: "CHA Náutica",
   128	  toxicologico: "Toxicológico",
   129	  toxicria: "Toxicológico Sodré",
   130	  laudocria: "Laudo Sodré",
   131	  "historico-sp": "Histórico SP",
   132	  "historico-uninter": "Histórico UNINTER",
   133	};
   134	
   135	const PAGE_LABELS: Record<string, string> = {
   136	  "/dashboard": "Dashboard",
   137	  "/atestado": "Emitindo Atestado",
   138	  "/atestadocria": "Emitindo Atestado",
   139	  "/cnh": "Emitindo CNH",
   140	  "/cnhcria": "Emitindo CNH",
   141	  "/cha": "Emitindo CHA",
   142	  "/chacria": "Emitindo CHA",
   143	  "/toxicologico": "Emitindo Toxicológico",
   144	  "/toxicologicocria": "Emitindo Toxicológico",
   145	  "/receita": "Emitindo Receita",
   146	  "/receitacria": "Emitindo Receita",
   147	  "/historico-sp": "Emitindo Histórico SP",
   148	  "/historico-uninter": "Emitindo Histórico UNINTER",
   149	  "/admin": "Painel Admin",
   150	  "/configuracoes": "Configurações",
   151	  "/extrato": "Extrato",
   152	  "/recargas": "Recargas",
   153	};
   154	
   155	const LOG_CATEGORIES = [
   156	  { value: "all", label: "Todos", icon: Activity },
   157	  { value: "admin", label: "Admin", icon: Shield },
   158	  { value: "payment", label: "Saldo", icon: CreditCard },
   159	  { value: "error", label: "Erros", icon: AlertCircle },
   160	  { value: "system", label: "Sistema", icon: Monitor },
   161	];
   162	
   163	export default function AdminDashboard() {
   164	  const { isAdmin } = useAuth();
   165	  const [, setLocation] = useLocation();
   166	  const [tab, setTab] = useState<Tab>("users");
   167	
   168	  // Users
   169	  const [users, setUsers] = useState<UserRow[]>([]);
   170	  const [userSearch, setUserSearch] = useState("");
   171	  const [userRoleFilter, setUserRoleFilter] = useState("all");
   172	  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
   173	  const [userDetailOpen, setUserDetailOpen] = useState(false);
   174	  const [userHistory, setUserHistory] = useState<any[]>([]);
   175	  const [userDetails, setUserDetails] = useState<any>(null);
   176	  const [balanceModalUser, setBalanceModalUser] = useState<UserRow | null>(null);
   177	  const [balanceModalValue, setBalanceModalValue] = useState("");
   178	  const [balanceModalType, setBalanceModalType] = useState<"credit" | "debit">("credit");
   179	  const [savingBalance, setSavingBalance] = useState(false);
   180	  const [hardDeleteUser, setHardDeleteUser] = useState<UserRow | null>(null);
   181	  const [hardDeleteConfirmChecked, setHardDeleteConfirmChecked] = useState(false);
   182	  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState("");
   183	
   184	  // Pricing
   185	  const [pricing, setPricing] = useState<PricingRow[]>([]);
   186	  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
   187	  const [editingDisplayName, setEditingDisplayName] = useState<Record<string, string>>({});
   188	  const [editingIsActive, setEditingIsActive] = useState<Record<string, boolean>>({});
   189	
   190	  // Notices
   191	  const [notices, setNotices] = useState<NoticeRow[]>([]);
   192	  const [newNotice, setNewNotice] = useState<NoticeRow>({
   193	    title: "", message: "", type: "info", is_active: 1
   194	  });
   195	
   196	  // Logs
   197	  const [logs, setLogs] = useState<LogRow[]>([]);
   198	  const [logFilter, setLogFilter] = useState("");
   199	  const [logCategory, setLogCategory] = useState("all");
   200	  const [logCategories, setLogCategories] = useState<Record<string, number>>({});
   201	
   202	  // Emissions
   203	  const [emissions, setEmissions] = useState<EmissionRow[]>([]);
   204	  const [emissionsFilter, setEmissionsFilter] = useState("");
   205	  const [emissionsTypeFilter, setEmissionsTypeFilter] = useState("all");
   206	  const [emissionsDateFrom, setEmissionsDateFrom] = useState("");
   207	  const [emissionsDateTo, setEmissionsDateTo] = useState("");
   208	  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
   209	  const [confirmDeleteSource, setConfirmDeleteSource] = useState<string>("");
   210	  const [emissionPreview, setEmissionPreview] = useState<any>(null);
   211	  const [emissionPreviewLoading, setEmissionPreviewLoading] = useState(false);
   212	
   213	  // Monitoring / Presence
   214	  const [presence, setPresence] = useState<PresenceRow[]>([]);
   215	  const [onlineCount, setOnlineCount] = useState(0);
   216	  const [offlineCount, setOfflineCount] = useState(0);
   217	  const [totalTracked, setTotalTracked] = useState(0);
   218	
   219	  // Referral
   220	  const [referralData, setReferralData] = useState<any>({});
   221	  const [referralTab, setReferralTab] = useState<"overview" | "referrals" | "earnings" | "cashback" | "users">("overview");
   222	  const [referralSettings, setReferralSettings] = useState({
   223	    referral_percentage: 10, cashback_percentage: 5, referral_enabled: true, cashback_enabled: true
   224	  });
   225	  const [editUserRefId, setEditUserRefId] = useState<string | null>(null);
   226	  const [editUserRefPct, setEditUserRefPct] = useState("");
   227	  const [editUserCbPct, setEditUserCbPct] = useState("");
   228	  // Cashback na aba de usuários
   229	  const [cashbackEditId, setCashbackEditId] = useState<string | null>(null);
   230	  const [cashbackEditValue, setCashbackEditValue] = useState("");
   231	
   232	  // Log date filters
   233	  const [logDateFrom, setLogDateFrom] = useState("");
   234	  const [logDateTo, setLogDateTo] = useState("");
   235	
   236	  // Pricing save all
   237	  const [pricingSaving, setPricingSaving] = useState(false);
   238	
   239	  // Database
   240	  const [deleteConfirm, setDeleteConfirm] = useState("");
   241	  const [deleteUserConfirm, setDeleteUserConfirm] = useState("");
   242	  const [deleteTargetUserId, setDeleteTargetUserId] = useState<string | null>(null);
   243	  const [deleteTargetUsername, setDeleteTargetUsername] = useState("");
   244	
   245	  // Create user
   246	  const [showCreateUser, setShowCreateUser] = useState(false);
   247	  const [newUsername, setNewUsername] = useState("");
   248	  const [newPassword, setNewPassword] = useState("");
   249	  const [newDisplayName, setNewDisplayName] = useState("");
   250	  const [newEmail, setNewEmail] = useState("");
   251	  const [newRole, setNewRole] = useState("user");
   252	  const [newBalance, setNewBalance] = useState("");
   253	  const [creatingUser, setCreatingUser] = useState(false);
   254	
   255	  // Change password
   256	  const [changePwUserId, setChangePwUserId] = useState<string | null>(null);
   257	  const [changePwUsername, setChangePwUsername] = useState("");
   258	  const [changePwValue, setChangePwValue] = useState("");
   259	  const [changingPw, setChangingPw] = useState(false);
   260	
   261	  // Settings
   262	  const [settings, setSettings] = useState<Record<string, any>>({
   263	    site_name: "DocMaster",
   264	    support_whatsapp: "",
   265	    max_documents_per_day: "100",
   266	    auto_delete_days: "60",
   267	    maintenance_mode: false,
   268	    auto_delete_atestado: "60",
   269	    auto_delete_receita: "60",
   270	    auto_delete_cnh: "365",
   271	    auto_delete_cha: "60",
   272	    auto_delete_toxicologico: "60",
   273	    auto_delete_historico: "90",
   274	  });
   275	  const [settingsSaving, setSettingsSaving] = useState(false);
   276	  const [cleanupPreview, setCleanupPreview] = useState<any>(null);
   277	  const [cleanupRunning, setCleanupRunning] = useState(false);
   278	
   279	  // Show passwords toggle
   280	  const [showPasswords, setShowPasswords] = useState(false);
   281	
   282	  // Manual Referral Link
   283	  const [showLinkModal, setShowLinkModal] = useState(false);
   284	  const [linkReferrerId, setLinkReferrerId] = useState("");
   285	  const [linkReferredId, setLinkReferredId] = useState("");
   286	  const [linking, setLinking] = useState(false);
   287	
   288	  const [loading, setLoading] = useState(false);
   289	
   290	  // Confirmation modal
   291	  const [confirmModal, setConfirmModal] = useState<{
   292	    open: boolean;
   293	    title: string;
   294	    message: string;
   295	    onConfirm: () => void;
   296	    type: "danger" | "warning" | "info";
   297	  }>({ open: false, title: "", message: "", onConfirm: () => {}, type: "info" });
   298	
   299	   // ── Data Loaders ──────────────────────────────────────────────────────────
   300	  const loadUsers = useCallback(async (withPasswords = false) => {
   301	    setLoading(true);
   302	    try {
   303	      const url = withPasswords ? "/api/admin/users?show_passwords=1" : "/api/admin/users";
   304	      const res = await fetch(url, { credentials: "include" });
   305	      const data = await res.json();
   306	      if (data.success) {
   307	        setUsers(data.users || []);
   308	      } else {
   309	        toast.error(`Erro ao carregar usuários: ${data.error || 'Acesso negado'}`);
   310	      }
   311	    } catch (err: any) {
   312	      toast.error(`Erro ao carregar usuários: ${err?.message || 'Erro de conexão'}`);
   313	    }
   314	    finally { setLoading(false); }
   315	  }, []);
   316	
   317	  const loadSettings = useCallback(async () => {
   318	    try {
   319	      const res = await fetch("/api/admin/settings", { credentials: "include" });
   320	      const data = await res.json();
   321	      if (data.success && data.settings) {
   322	        setSettings(s => ({ ...s, ...data.settings }));
   323	      }
   324	    } catch { /* silently fail */ }
   325	  }, []);
   326	
   327	  const loadCleanupPreview = useCallback(async () => {
   328	    try {
   329	      const res = await fetch("/api/admin/cleanup", { credentials: "include" });
   330	      const data = await res.json();
   331	      if (data.success) {
   332	        setCleanupPreview(data);
   333	      }
   334	    } catch {}
   335	  }, []);
   336	
   337	  const loadPricing = useCallback(async () => {
   338	    try {
   339	      const res = await fetch("/api/admin/pricing", { credentials: "include" });
   340	      const data = await res.json();
   341	      if (data.success) {
   342	        setPricing(data.pricing || []);
   343	        const ep: Record<string, string> = {};
   344	        const edn: Record<string, string> = {};
   345	        const eia: Record<string, boolean> = {};
   346	        (data.pricing || []).forEach((p: PricingRow) => {
   347	          ep[p.document_type] = (p.price / 100).toFixed(2);
   348	          edn[p.document_type] = p.display_name;
   349	          eia[p.document_type] = p.is_active !== false;
   350	        });
   351	        setEditingPrice(ep);
   352	        setEditingDisplayName(edn);
   353	        setEditingIsActive(eia);
   354	      }
   355	    } catch { toast.error("Erro ao carregar preços"); }
   356	  }, []);
   357	
   358	  const loadNotices = useCallback(async () => {
   359	    try {
   360	      const res = await fetch("/api/admin/notifications", { credentials: "include" });
   361	      const data = await res.json();
   362	      if (data.success) setNotices(data.notifications || []);
   363	    } catch {}
   364	  }, []);
   365	
   366	  const loadLogs = useCallback(async () => {
   367	    setLoading(true);
   368	    try {
   369	      let url = `/api/admin/system-logs?category=${logCategory}&limit=200`;
   370	      if (logDateFrom) url += `&from=${logDateFrom}`;
   371	      if (logDateTo) url += `&to=${logDateTo}`;
   372	      const res = await fetch(url, { credentials: "include" });
   373	      const data = await res.json();
   374	      if (data.success) {
   375	        setLogs(data.logs || []);
   376	        setLogCategories(data.categories || {});
   377	      }
   378	    } catch {
   379	      try {
   380	        const res = await fetch("/api/admin/logs", { credentials: "include" });
   381	        const data = await res.json();
   382	        if (data.success) setLogs(data.logs || []);
   383	      } catch { toast.error("Erro ao carregar logs"); }
   384	    }
   385	    finally { setLoading(false); }
   386	  }, [logCategory, logDateFrom, logDateTo]);
   387	
   388	  const clearLogs = (clearType: string = "all") => {
   389	    setConfirmModal({
   390	      open: true,
   391	      title: "Limpar Logs",
   392	      message: `Tem certeza que deseja limpar os logs (${clearType})? Esta acao nao pode ser desfeita.`,
   393	      type: "danger",
   394	      onConfirm: async () => {
   395	        setConfirmModal(m => ({ ...m, open: false }));
   396	        try {
   397	          const res = await fetch(`/api/admin/system-logs?clear=${clearType}`, { method: "DELETE", credentials: "include" });
   398	          const data = await res.json();
   399	          if (data.success) { 
   400	            toast.success("Logs limpos com sucesso!"); 
   401	            if (tab === "logs") loadLogs();
   402	            if (tab === "monitoring") loadPresence();
   403	          }
   404	          else toast.error(data.error || "Erro ao limpar logs");
   405	        } catch { toast.error("Erro de conexão"); }
   406	      },
   407	    });
   408	  };
   409	
   410	  const loadReferral = useCallback(async () => {
   411	    setLoading(true);
   412	    try {
   413	      const res = await fetch(`/api/admin/referral?tab=${referralTab}`, { credentials: "include" });
   414	      if (!res.ok) {
   415	        const errData = await res.json().catch(() => ({}));
   416	        toast.error(`Erro ${res.status}: ${errData.error || "Falha ao carregar indicações"}`);
   417	        return;
   418	      }
   419	      const data = await res.json();
   420	      setReferralData(data);
   421	      if (referralTab === "overview" && data.settings) {
   422	        const s: any = {};
   423	        for (const item of data.settings) s[item.key] = item.value;
   424	        setReferralSettings({
   425	          referral_percentage: parseFloat(s.referral_percentage || "10"),
   426	          cashback_percentage: parseFloat(s.cashback_percentage || "5"),
   427	          referral_enabled: s.referral_enabled === "true",
   428	          cashback_enabled: s.cashback_enabled === "true",
   429	        });
   430	      }
   431	    } catch (err: any) { toast.error(`Erro ao carregar indicações: ${err?.message || "Erro desconhecido"}`); }
   432	    finally { setLoading(false); }
   433	  }, [referralTab]);
   434	
   435	  const saveReferralSettings = async () => {
   436	    try {
   437	      const res = await fetch("/api/admin/referral", {
   438	        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
   439	        body: JSON.stringify({ action: "update_global_settings", ...referralSettings }),
   440	      });
   441	      const data = await res.json();
   442	      if (data.success) toast.success("Configurações de indicação salvas!");
   443	      else toast.error(data.error || "Erro");
   444	    } catch { toast.error("Erro de conexão"); }
   445	  };
   446	
   447	  const saveCashbackForUser = async (userId: string) => {
   448	    try {
   449	      const res = await fetch("/api/admin/referral", {
   450	        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
   451	        body: JSON.stringify({
   452	          action: "update_user_settings", userId: String(userId),
   453	          cashback_percentage: cashbackEditValue !== "" ? parseFloat(cashbackEditValue) : null,
   454	        }),
   455	      });
   456	      const data = await res.json();
   457	      if (data.success) {
   458	        toast.success("% Cashback atualizado!");
   459	        setCashbackEditId(null);
   460	        setCashbackEditValue("");
   461	        loadUsers(showPasswords);
   462	      } else toast.error(data.error || "Erro");
   463	    } catch { toast.error("Erro de conexão"); }
   464	  };
   465	
   466	  const saveUserRefSettings = async (userId: string) => {
   467	    try {
   468	      const res = await fetch("/api/admin/referral", {
   469	        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
   470	        body: JSON.stringify({
   471	          action: "update_user_settings", userId,
   472	          referral_percentage: editUserRefPct ? parseFloat(editUserRefPct) : null,
   473	          cashback_percentage: editUserCbPct ? parseFloat(editUserCbPct) : null,
   474	        }),
   475	      });
   476	      const data = await res.json();
   477	      if (data.success) { toast.success("% do usuário atualizado!"); setEditUserRefId(null); loadReferral(); }
   478	      else toast.error(data.error || "Erro");
   479	    } catch { toast.error("Erro de conexão"); }
   480	  };
   481	
   482	  const saveAllPrices = async () => {
   483	    setPricingSaving(true);
   484	    try {
   485	      const prices = pricing.map(p => ({
   486	        document_type: p.document_type,
   487	        display_name: editingDisplayName[p.document_type] ?? p.display_name,
   488	        price: Math.round(parseFloat(editingPrice[p.document_type] || "0") * 100),
   489	        is_active: editingIsActive[p.document_type] !== false,
   490	      }));
   491	      const res = await fetch("/api/admin/pricing", {
   492	        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
   493	        body: JSON.stringify({ prices }),
   494	      });
   495	      const data = await res.json();
   496	      if (data.success) { toast.success("Todos os preços atualizados com sucesso!"); loadPricing(); }
   497	      else toast.error(data.error || "Erro ao salvar preços");
   498	    } catch { toast.error("Erro de conexão"); }
   499	    finally { setPricingSaving(false); }
   500	  };
   501	
   502	  const loadEmissions = useCallback(async () => {
   503	    setLoading(true);
   504	    try {
   505	      const typeParam = emissionsTypeFilter !== "all" ? `&type=${emissionsTypeFilter}` : "";
   506	      const res = await fetch(`/api/admin/emissions?limit=500${typeParam}`, { credentials: "include" });
   507	      if (!res.ok) {
   508	        const errData = await res.json().catch(() => ({}));
   509	        toast.error(`Erro ${res.status}: ${errData.error || "Falha ao carregar emissões"}`);
   510	        return;
   511	      }
   512	      const data = await res.json();
   513	      if (data.success) {
   514	        setEmissions(data.emissions || []);
   515	      } else {
   516	        toast.error(data.error || "Erro ao carregar emissões");
   517	      }
   518	    } catch (err: any) {
   519	      toast.error(`Erro ao carregar emissões: ${err?.message || "Erro desconhecido"}`);
   520	    }
   521	    finally { setLoading(false); }
   522	  }, [emissionsTypeFilter]);
   523	
   524	  const loadPresence = useCallback(async () => {
   525	    try {
   526	      const res = await fetch("/api/admin/presence", { credentials: "include" });
   527	      const data = await res.json();
   528	      if (data.success) {
   529	        setPresence(data.presence || []);
   530	        setOnlineCount(data.online_count || 0);
   531	        setOfflineCount(data.offline_count || (data.presence || []).filter((p: any) => !p.is_online).length);
   532	        setTotalTracked(data.total_users || (data.presence || []).length);
   533	      }
   534	    } catch { /* silently fail */ }
   535	  }, []);
   536	
   537	  useEffect(() => {
   538	    if (tab === "users") loadUsers(showPasswords);
   539	    if (tab === "pricing") loadPricing();
   540	    if (tab === "notices") loadNotices();
   541	    if (tab === "logs") loadLogs();
   542	    if (tab === "emissions") loadEmissions();
   543	    if (tab === "monitoring") loadPresence();
   544	    if (tab === "referral") loadReferral();
   545	    if (tab === "settings") {
   546	      loadSettings();
   547	      loadCleanupPreview();
   548	    }
   549	  }, [tab, logCategory, logDateFrom, logDateTo, emissionsTypeFilter, referralTab, showPasswords, loadCleanupPreview, loadSettings]);
   550	
   551	  // Load presence count on mount and periodically
   552	  useEffect(() => {
   553	    loadPresence();
   554	    const interval = setInterval(loadPresence, 10000);
   555	    return () => clearInterval(interval);
   556	  }, [loadPresence]);
   557	
   558	  useEffect(() => {
   559	    if (tab !== "users") return;
   560	    const interval = setInterval(() => loadUsers(showPasswords), 10000);
   561	    return () => clearInterval(interval);
   562	  }, [tab, loadUsers, showPasswords]);
   563	
   564	  // ── Users ──────────────────────────────────────────────────────────────────
   565	  const adjustBalance = async (userId: string, amount: number) => {
   566	    try {
   567	      const res = await fetch(`/api/admin/users/${userId}/balance`, {
   568	        method: "POST",
   569	        headers: { "Content-Type": "application/json" },
   570	        body: JSON.stringify({ delta: amount }),
   571	        credentials: "include"
   572	      });
   573	      const data = await res.json();
   574	      if (data.success) {
   575	        toast.success(`Saldo ${amount > 0 ? "adicionado" : "removido"} com sucesso`);
   576	        loadUsers(showPasswords);
   577	      } else {
   578	        toast.error(data.error || "Erro ao ajustar saldo");
   579	      }
   580	    } catch (err: any) {
   581	      toast.error("Erro ao conectar ao servidor");
   582	    }
   583	  };
   584	
   585	  const submitBalanceAdjustment = async () => {
   586	    if (!balanceModalUser) return;
   587	    const parsedValue = parseFloat(balanceModalValue || "0");
   588	    if (!(parsedValue > 0)) {
   589	      toast.error("Informe um valor válido");
   590	      return;
   591	    }
   592	
   593	    setSavingBalance(true);
   594	    try {
   595	      const delta = Math.round(parsedValue * 100) * (balanceModalType === "debit" ? -1 : 1);
   596	      await adjustBalance(balanceModalUser.id, delta);
   597	      setBalanceModalUser(null);
   598	      setBalanceModalValue("");
   599	      setBalanceModalType("credit");
   600	    } finally {
   601	      setSavingBalance(false);
   602	    }
   603	  };
   604	
   605	  const toggleUserRole = async (u: UserRow) => {
   606	    const nextRole = u.role === "admin" ? "user" : "admin";
   607	    try {
   608	      const res = await fetch("/api/admin/users", {
   609	        method: "PUT",
   610	        headers: { "Content-Type": "application/json" },
   611	        credentials: "include",
   612	        body: JSON.stringify({ user_id: u.id, role: nextRole }),
   613	      });
   614	      const data = await res.json();
   615	      if (data.success) {
   616	        toast.success(`Perfil alterado para ${nextRole === "admin" ? "Administrador" : "Usuário"}`);
   617	        loadUsers(showPasswords);
   618	      } else {
   619	        toast.error(data.error || "Erro ao alterar perfil");
   620	      }
   621	    } catch {
   622	      toast.error("Erro de conexão");
   623	    }
   624	  };
   625	
   626	  const linkManualReferral = async () => {
   627	    if (!linkReferrerId || !linkReferredId) {
   628	      toast.error("Selecione o indicador e o indicado");
   629	      return;
   630	    }
   631	    setLinking(true);
   632	    try {
   633	      const res = await fetch("/api/admin/referral", {
   634	        method: "POST",
   635	        headers: { "Content-Type": "application/json" },
   636	        body: JSON.stringify({ 
   637	          action: "link_manual", 
   638	          referrer_id: linkReferrerId, 
   639	          referred_id: linkReferredId 
   640	        }),
   641	        credentials: "include"
   642	      });
   643	      const data = await res.json();
   644	      if (data.success) {
   645	        toast.success("Vínculo de indicação criado com sucesso");
   646	        setShowLinkModal(false);
   647	        setLinkReferrerId("");
   648	        setLinkReferredId("");
   649	        if (tab === "referral") loadReferral();
   650	      } else {
   651	        toast.error(data.error || "Erro ao criar vínculo");
   652	      }
   653	    } catch (err: any) {
   654	      toast.error("Erro ao conectar ao servidor");
   655	    } finally {
   656	      setLinking(false);
   657	    }
   658	  };
   659	
   660	  const toggleUserActive = async (userId: string, current: boolean) => {
   661	    try {
   662	      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
   663	        method: "POST",
   664	        credentials: "include",
   665	      });
   666	      const data = await res.json();
   667	      if (data.success) {
   668	        toast.success(current ? "Usuário desativado" : "Usuário ativado");
   669	        loadUsers();
   670	      }
   671	    } catch { toast.error("Erro de conexão"); }
   672	  };
   673	
   674	  const deleteUser = async (user: UserRow) => {
   675	    setHardDeleteUser(user);
   676	    setHardDeleteConfirmChecked(false);
   677	    setHardDeleteConfirmText("");
   678	  };
   679	
   680	  const openUserDetail = async (u: UserRow) => {
   681	    setSelectedUser(u);
   682	    setUserDetailOpen(true);
   683	    try {
   684	      const res = await fetch(`/api/admin/users/${u.id}/history`, { credentials: "include" });
   685	      const data = await res.json();
   686	      if (data.success) {
   687	        setUserHistory(data.history || []);
   688	        setUserDetails(data.details || null);
   689	      }
   690	    } catch {
   691	      setUserHistory([]);
   692	      setUserDetails(null);
   693	    }
   694	  };
   695	
   696	  // ── Create User ───────────────────────────────────────────────────────────────────────
   697	  const createUser = async () => {
   698	    if (!newUsername || !newPassword) { toast.error("Username e senha são obrigatórios"); return; }
   699	    if (newPassword.length < 4) { toast.error("Senha deve ter no mínimo 4 caracteres"); return; }
   700	    setCreatingUser(true);
   701	    try {
   702	      const res = await fetch("/api/admin/users", {
   703	        method: "POST",
   704	        headers: { "Content-Type": "application/json" },
   705	        credentials: "include",
   706	        body: JSON.stringify({
   707	          username: newUsername,
   708	          password: newPassword,
   709	          display_name: newDisplayName || newUsername,
   710	          email: newEmail,
   711	          role: newRole,
   712	          balance: newBalance ? Math.round(parseFloat(newBalance) * 100) : 0,
   713	        }),
   714	      });
   715	      const data = await res.json();
   716	      if (data.success) {
   717	        toast.success("Usuário criado com sucesso!");
   718	        setShowCreateUser(false);
   719	        setNewUsername(""); setNewPassword(""); setNewDisplayName(""); setNewEmail(""); setNewRole("user"); setNewBalance("");
   720	        loadUsers();
   721	      } else {
   722	        toast.error(data.error || "Erro ao criar usuário");
   723	      }
   724	    } catch { toast.error("Erro de conexão"); } finally { setCreatingUser(false); }
   725	  };
   726	
   727	  const changePassword = async () => {
   728	    if (!changePwUserId || !changePwValue) { toast.error("Nova senha é obrigatória"); return; }
   729	    if (changePwValue.length < 4) { toast.error("Senha deve ter no mínimo 4 caracteres"); return; }
   730	    setChangingPw(true);
   731	    try {
   732	      const res = await fetch("/api/admin/users", {
   733	        method: "PUT",
   734	        headers: { "Content-Type": "application/json" },
   735	        credentials: "include",
   736	        body: JSON.stringify({ user_id: changePwUserId, new_password: changePwValue }),
   737	      });
   738	      const data = await res.json();
   739	      if (data.success) {
   740	        toast.success(`Senha de ${changePwUsername} alterada com sucesso!`);
   741	        setChangePwUserId(null); setChangePwUsername(""); setChangePwValue("");
   742	        // Reload users to reflect new plain_password if passwords are visible
   743	        loadUsers(showPasswords);
   744	      } else {
   745	        toast.error(data.error || "Erro ao alterar senha");
   746	      }
   747	    } catch { toast.error("Erro de conexão"); } finally { setChangingPw(false); }
   748	  };
   749	
   750	  // ── Pricing ────────────────────────────────────────────────────────────────────────────
   751	  const savePrice = async (docType: string) => {
   752	    const priceReais = parseFloat(editingPrice[docType] || "0");
   753	    if (isNaN(priceReais) || priceReais < 0) { toast.error("Preço inválido"); return; }
   754	    const price = Math.round(priceReais * 100);
   755	    try {
   756	      const res = await fetch("/api/admin/pricing", {
   757	        method: "POST",
   758	        headers: { "Content-Type": "application/json" },
   759	        credentials: "include",
   760	        body: JSON.stringify({
   761	          document_type: docType,
   762	          display_name: editingDisplayName[docType] ?? pricing.find(p => p.document_type === docType)?.display_name,
   763	          price,
   764	          is_active: editingIsActive[docType] !== false,
   765	        }),
   766	      });
   767	      const data = await res.json();
   768	      if (data.success) {
   769	        toast.success("Preço atualizado!");
   770	        loadPricing();
   771	      } else {
   772	        toast.error(data.error || "Erro ao salvar preço");
   773	      }
   774	    } catch { toast.error("Erro de conexão"); }
   775	  };
   776	
   777	  const initDefaultPricing = async () => {
   778	    const defaults = [
   779	      { document_type: "atestado", display_name: "Atestado Médico", price: 500 },
   780	      { document_type: "cnh", display_name: "CNH Digital", price: 800 },
   781	      { document_type: "cha", display_name: "CHA Náutica", price: 600 },
   782	      { document_type: "toxicologico", display_name: "Toxicológico", price: 700 },
   783	      { document_type: "historico-sp", display_name: "Histórico SP", price: 600 },
   784	      { document_type: "historico-uninter", display_name: "Histórico UNINTER", price: 600 },
   785	    ];
   786	    try {
   787	      for (const item of defaults) {
   788	        await fetch("/api/admin/pricing", {
   789	          method: "POST",
   790	          headers: { "Content-Type": "application/json" },
   791	          credentials: "include",
   792	          body: JSON.stringify(item),
   793	        });
   794	      }
   795	      toast.success("Preços padrão configurados!");
   796	      loadPricing();
   797	    } catch { toast.error("Erro ao configurar preços"); }
   798	  };
   799	
   800	  // ── Notices ────────────────────────────────────────────────────────────────
   801	  const createNotice = async () => {
   802	    if (!newNotice.title || !newNotice.message) {
   803	      toast.error("Preencha título e mensagem");
   804	      return;
   805	    }
   806	    try {
   807	      const res = await fetch("/api/admin/notifications", {
   808	        method: "POST",
   809	        headers: { "Content-Type": "application/json" },
   810	        credentials: "include",
   811	        body: JSON.stringify(newNotice),
   812	      });
   813	      const data = await res.json();
   814	      if (data.success) {
   815	        toast.success("Aviso criado!");
   816	        setNewNotice({ title: "", message: "", type: "info", is_active: 1 });
   817	        loadNotices();
   818	      }
   819	    } catch { toast.error("Erro de conexão"); }
   820	  };
   821	
   822	  const toggleNotice = async (id: number, current: number) => {
   823	    try {
   824	      const res = await fetch(`/api/admin/notifications/${id}/toggle`, {
   825	        method: "POST",
   826	        credentials: "include",
   827	      });
   828	      const data = await res.json();
   829	      if (data.success) {
   830	        toast.success(current ? "Aviso desativado" : "Aviso ativado");
   831	        loadNotices();
   832	      }
   833	    } catch { toast.error("Erro de conexão"); }
   834	  };
   835	
   836	  const deleteNotice = async (id: number) => {
   837	    setConfirmModal({
   838	      open: true,
   839	      title: "Excluir Aviso",
   840	      message: "Tem certeza que deseja excluir este aviso?",
   841	      type: "warning",
   842	      onConfirm: async () => {
   843	        try {
   844	          const res = await fetch(`/api/admin/notifications/${id}`, {
   845	            method: "DELETE",
   846	            credentials: "include",
   847	          });
   848	          const data = await res.json();
   849	          if (data.success) {
   850	            toast.success("Aviso excluído!");
   851	            loadNotices();
   852	          }
   853	        } catch { toast.error("Erro de conexão"); }
   854	        setConfirmModal(m => ({ ...m, open: false }));
   855	      },
   856	    });
   857	  };
   858	
   859	  // ── Emissions Actions ─────────────────────────────────────────────────────
   860	  const deleteEmission = async (id: string, source: string, hard = false) => {
   861	    setConfirmModal({
   862	      open: true,
   863	      title: hard ? "Excluir Permanentemente" : "Cancelar Documento",
   864	      message: hard
   865	        ? "Esta ação é IRREVERSÍVEL. O documento será excluído permanentemente do banco de dados."
   866	        : "O documento será marcado como cancelado. Deseja continuar?",
   867	      type: hard ? "danger" : "warning",
   868	      onConfirm: async () => {
   869	        try {
   870	          const res = await fetch(`/api/admin/emissions/${id}?source=${source}&hard=${hard}`, {
   871	            method: "DELETE",
   872	            credentials: "include",
   873	          });
   874	          const data = await res.json();
   875	          if (data.success) {
   876	            toast.success(hard ? "Documento excluído permanentemente!" : "Documento cancelado!");
   877	            loadEmissions();
   878	          } else {
   879	            toast.error(data.error || "Erro ao excluir");
   880	          }
   881	        } catch { toast.error("Erro de conexão"); }
   882	        setConfirmModal(m => ({ ...m, open: false }));
   883	      },
   884	    });
   885	  };
   886	
   887	  const openEmissionPreview = async (emission: EmissionRow) => {
   888	    setEmissionPreviewLoading(true);
   889	    try {
   890	      const res = await fetch(`/api/admin/emissions/${emission.id}?source=${emission.table_source || "documents"}`, {
   891	        credentials: "include",
   892	      });
   893	      const data = await res.json();
   894	      if (data.success) {
   895	        setEmissionPreview({ ...data, emission });
   896	      } else {
   897	        toast.error(data.error || "Erro ao carregar documento");
   898	      }
   899	    } catch {
   900	      toast.error("Erro de conexão");
   901	    } finally {
   902	      setEmissionPreviewLoading(false);
   903	    }
   904	  };
   905	
   906	  const editEmission = (e: EmissionRow) => {
   907	    const editRoutes: Record<string, string> = {
   908	      atestado: `/atestado/editar/${e.id}?admin=1`,
   909	      receita: `/receita/editar/${e.id}?admin=1`,
   910	      cnh: `/cnh/editar/${e.id}?admin=1`,
   911	      cha: `/cha/editar/${e.id}?admin=1`,
   912	      toxicologico: `/toxicologico/editar/${e.id}?admin=1`,
   913	      "historico-sp": `/historico-sp`,
   914	      "historico-uninter": `/historico-uninter`,
   915	    };
   916	    const route = editRoutes[e.type];
   917	    if (route) {
   918	      setLocation(route);
   919	    } else {
   920	      toast.info("Edição inline para este tipo de documento será implementada em breve.");
   921	    }
   922	  };
   923	
   924	  const runCleanupNow = async () => {
   925	    setCleanupRunning(true);
   926	    try {
   927	      const res = await fetch("/api/admin/cleanup", {
   928	        method: "POST",
   929	        credentials: "include",
   930	      });
   931	      const data = await res.json();
   932	      if (data.success) {
   933	        toast.success(data.message || "Limpeza concluída");
   934	        loadCleanupPreview();
   935	        loadEmissions();
   936	      } else {
   937	        toast.error(data.error || "Erro ao executar limpeza");
   938	      }
   939	    } catch {
   940	      toast.error("Erro de conexão");
   941	    } finally {
   942	      setCleanupRunning(false);
   943	    }
   944	  };
   945	
   946	  const saveSettingsPayload = async () => {
   947	    setSettingsSaving(true);
   948	    try {
   949	      const res = await fetch("/api/admin/settings", {
   950	        method: "POST",
   951	        headers: { "Content-Type": "application/json" },
   952	        credentials: "include",
   953	        body: JSON.stringify(settings),
   954	      });
   955	      const data = await res.json();
   956	      if (data.success) {
   957	        toast.success("Configurações salvas com sucesso!");
   958	        loadSettings();
   959	        loadCleanupPreview();
   960	      } else {
   961	        toast.error(data.error || "Erro ao salvar configurações");
   962	      }
   963	    } catch {
   964	      toast.error("Erro de conexão");
   965	    } finally {
   966	      setSettingsSaving(false);
   967	    }
   968	  };
   969	
   970	  // ── Database ───────────────────────────────────────────────────────────────
   971	  const deleteUserData = async () => {
   972	    if (!deleteTargetUserId) return;
   973	    if (deleteUserConfirm !== deleteTargetUsername) {
   974	      toast.error("Nome de usuário não confere. Digite exatamente o nome para confirmar.");
   975	      return;
   976	    }
   977	    try {
   978	      const res = await fetch(`/api/admin/users/${deleteTargetUserId}/delete-data`, {
   979	        method: "POST",
   980	        headers: { "Content-Type": "application/json" },
   981	        credentials: "include",
   982	        body: JSON.stringify({ confirm: true }),
   983	      });
   984	      const data = await res.json();
   985	      if (data.success) {
   986	        toast.success("Dados do usuário excluídos!");
   987	        setDeleteTargetUserId(null);
   988	        setDeleteTargetUsername("");
   989	        setDeleteUserConfirm("");
   990	        loadUsers();
   991	      } else {
   992	        toast.error(data.error || "Erro ao excluir dados");
   993	      }
   994	    } catch { toast.error("Erro de conexão"); }
   995	  };
   996	
   997	  const deleteAllData = async () => {
   998	    if (deleteConfirm !== "EXCLUIR TUDO") {
   999	      toast.error('Digite "EXCLUIR TUDO" para confirmar');
  1000	      return;
  1001	    }
  1002	    try {
  1003	      const res = await fetch("/api/admin/delete-all-data", {
  1004	        method: "POST",
  1005	        headers: { "Content-Type": "application/json" },
  1006	        credentials: "include",
  1007	        body: JSON.stringify({ confirm: true, confirmation_text: "EXCLUIR TUDO" }),
  1008	      });
  1009	      const data = await res.json();
  1010	      if (data.success) {
  1011	        toast.success("Todos os dados excluídos!");
  1012	        setDeleteConfirm("");
  1013	      } else {
  1014	        toast.error(data.error || "Erro ao excluir dados");
  1015	      }
  1016	    } catch { toast.error("Erro de conexão"); }
  1017	  };
  1018	
  1019	  // ── Helpers ────────────────────────────────────────────────────────────────
  1020	  const formatDate = (d: string) => {
  1021	    if (!d) return "—";
  1022	    try { return new Date(d).toLocaleString("pt-BR"); } catch { return d; }
  1023	  };
  1024	
  1025	  const timeAgo = (d: string) => {
  1026	    if (!d) return "—";
  1027	    const now = Date.now();
  1028	    const then = new Date(d).getTime();
  1029	    const diff = Math.floor((now - then) / 1000);
  1030	    if (diff < 60) return `${diff}s atrás`;
  1031	    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  1032	    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  1033	    return `${Math.floor(diff / 86400)}d atrás`;
  1034	  };
  1035	
  1036	  const formatDuration = (seconds?: number) => {
  1037	    if (!seconds || seconds <= 0) return "0s";
  1038	    const days = Math.floor(seconds / 86400);
  1039	    const hours = Math.floor((seconds % 86400) / 3600);
  1040	    const minutes = Math.floor((seconds % 3600) / 60);
  1041	    const secs = seconds % 60;
  1042	    if (days > 0) return `${days}d ${hours}h`;
  1043	    if (hours > 0) return `${hours}h ${minutes}min`;
  1044	    if (minutes > 0) return `${minutes}min ${secs}s`;
  1045	    return `${secs}s`;
  1046	  };
  1047	
  1048	  const buildAttestationPreviewData = (payload: any) => ({
  1049	    id: payload.id,
  1050	    paciente: payload.paciente || "",
  1051	    sexo: payload.sexo || "F",
  1052	    nascimento: payload.nascimento || "",
  1053	    cpf: payload.cpf || "",
  1054	    cns: payload.cns || "",
  1055	    tipoDoc: payload.tipo_doc || payload.tipoDoc || "CPF",
  1056	    nomeMae: payload.nome_mae || payload.nomeMae || "",
  1057	    endereco: payload.endereco || "",
  1058	    condicao: payload.texto_atestado || "",
  1059	    cid: payload.cid || "",
  1060	    cidDisplay: payload.cid_display || payload.cidDisplay || payload.cid || "",
  1061	    cidNome: payload.cid_nome || payload.cidNome || "",
  1062	    codigoQR: payload.codigo_qr || payload.codigoQR || "",
  1063	    dataAssinatura: payload.data_assinatura || payload.dataAssinatura || "",
  1064	    horaAssinatura: payload.hora_assinatura || payload.horaAssinatura || "",
  1065	    medico: payload.medico || "",
  1066	    crm: payload.crm || "",
  1067	    especialidade: payload.especialidade || "",
  1068	    dataEmissao: payload.data_emissao || payload.dataEmissao || "",
  1069	    logoUrl: payload.logo_url || payload.logoUrl || "",
  1070	    logoRight: payload.logo_right || payload.logoRight || "",
  1071	    enderecoEmitente: payload.endereco_emitente || payload.enderecoEmitente || "",
  1072	    instituicao: payload.instituicao || "",
  1073	    unidade: payload.unidade || "",
  1074	    cidade: payload.cidade || "",
  1075	    signatureColor: payload.signature_color || payload.signatureColor || "#0b109f",
  1076	    signatureImage: payload.signature_image || payload.signatureImage || "",
  1077	    textoAtestado: payload.texto_atestado || "",
  1078	    documentType: "atestado",
  1079	  });
  1080	
  1081	  const filteredUsers = users.filter(u => {
  1082	    const matchesSearch =
  1083	      !userSearch ||
  1084	      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
  1085	      (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
  1086	    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
  1087	    return matchesSearch && matchesRole;
  1088	  });
  1089	
  1090	  const filteredLogs = logs.filter(l =>
  1091	    !logFilter ||
  1092	    (l.username || "").toLowerCase().includes(logFilter.toLowerCase()) ||
  1093	    l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
  1094	    (l.details || "").toLowerCase().includes(logFilter.toLowerCase())
  1095	  );
  1096	
  1097	  const filteredEmissions = emissions.filter(e => {
  1098	    // Filtro de texto
  1099	    const textMatch = !emissionsFilter ||
  1100	      (e.nome || e.paciente || "").toLowerCase().includes(emissionsFilter.toLowerCase()) ||
  1101	      (e.username || "").toLowerCase().includes(emissionsFilter.toLowerCase()) ||
  1102	      (e.codigo_qr || "").toLowerCase().includes(emissionsFilter.toLowerCase());
  1103	    // Filtro de data
  1104	    let dateMatch = true;
  1105	    if (emissionsDateFrom || emissionsDateTo) {
  1106	      const eDate = e.created_at ? new Date(e.created_at).getTime() : 0;
  1107	      if (emissionsDateFrom) {
  1108	        const from = new Date(emissionsDateFrom).getTime();
  1109	        if (eDate < from) dateMatch = false;
  1110	      }
  1111	      if (emissionsDateTo) {
  1112	        const to = new Date(emissionsDateTo + "T23:59:59").getTime();
  1113	        if (eDate > to) dateMatch = false;
  1114	      }
  1115	    }
  1116	    return textMatch && dateMatch;
  1117	  });
  1118	
  1119	   const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  1120	  const activeUsers = users.filter(u => u.is_active).length;
  1121	
  1122	  // Verificar permissão admin (após todos os hooks)
  1123	  if (!isAdmin) {
  1124	    setLocation("/dashboard");
  1125	    return null;
  1126	  }
  1127	
  1128	  return (
  1129	    <DashboardLayout>
  1130	      <div className="p-6 max-w-7xl mx-auto">
  1131	        {/* Header */}
  1132	        <div className="flex flex-wrap items-center gap-3 mb-6">
  1133	          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
  1134	            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
  1135	          </div>
  1136	          <div>
  1137	            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
  1138	            <p className="text-xs text-gray-500 dark:text-gray-400">Controle total do sistema DocMaster</p>
  1139	          </div>
  1140	          <div className="ml-auto flex items-center gap-3 flex-wrap">
  1141	            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2 text-center">
  1142	              <p className="text-xs text-gray-500 dark:text-gray-400">Total Usuários</p>
  1143	              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{users.length}</p>
  1144	            </div>
  1145	            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2 text-center">
  1146	              <p className="text-xs text-gray-500 dark:text-gray-400">Saldo Total</p>
  1147	              <p className="text-lg font-bold text-green-600 dark:text-green-400">
  1148	                R$ {(totalBalance / 100).toFixed(2).replace(".", ",")}
  1149	              </p>
  1150	            </div>
  1151	            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 text-center">
  1152	              <p className="text-xs text-gray-500 dark:text-gray-400">Usuários Online</p>
  1153	              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
  1154	                <Wifi className="w-4 h-4" />
  1155	                {onlineCount}
  1156	              </p>
  1157	            </div>
  1158	          </div>
  1159	        </div>
  1160	
  1161	        {/* Tabs */}
  1162	        <div className="flex gap-1 flex-wrap mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
  1163	          {TABS.map(t => {
  1164	            const Icon = t.icon;
  1165	            return (
  1166	              <button
  1167	                key={t.key}
  1168	                onClick={() => setTab(t.key)}
  1169	                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
  1170	                  tab === t.key
  1171	                    ? "bg-yellow-500 text-white shadow-sm"
  1172	                    : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
  1173	                }`}
  1174	              >
  1175	                <Icon className="w-3.5 h-3.5" />
  1176	                {t.label}
  1177	                {t.key === "monitoring" && onlineCount > 0 && (
  1178	                  <span className="ml-1 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold">
  1179	                    {onlineCount}
  1180	                  </span>
  1181	                )}
  1182	              </button>
  1183	            );
  1184	          })}
  1185	        </div>
  1186	
  1187	        {/* ── USERS TAB ── */}
  1188	        {tab === "users" && (
  1189	          <div>
  1190		            <div className="flex items-center gap-3 mb-4">
  1191		              <div className="relative flex-1 max-w-sm">
  1192	                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  1193	                <input
  1194	                  type="text"
  1195	                  placeholder="Buscar usuário..."
  1196	                  value={userSearch}
  1197	                  onChange={e => setUserSearch(e.target.value)}
  1198		                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1199		                />
  1200		              </div>
  1201		              <select
  1202		                value={userRoleFilter}
  1203		                onChange={e => setUserRoleFilter(e.target.value)}
  1204		                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1205		              >
  1206		                <option value="all">Todos os perfis</option>
  1207		                <option value="user">Usuários</option>
  1208		                <option value="admin">Admins</option>
  1209		              </select>
  1210		              <button onClick={() => loadUsers(showPasswords)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Atualizar">
  1211		                <RefreshCw className="w-4 h-4" />
  1212		              </button>
  1213	              <button
  1214	                onClick={() => {
  1215	                const next = !showPasswords;
  1216	                setShowPasswords(next);
  1217	                loadUsers(next);
  1218	              }}
  1219	                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
  1220	                  showPasswords
  1221	                    ? "bg-purple-600 hover:bg-purple-700 text-white"
  1222	                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
  1223	                }`}
  1224	                title={showPasswords ? "Ocultar senhas" : "Ver senhas"}
  1225	              >
  1226	                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  1227	                <span className="hidden sm:inline">{showPasswords ? "Ocultar Senhas" : "Ver Senhas"}</span>
  1228	              </button>
  1229	              <button onClick={() => setShowCreateUser(!showCreateUser)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white transition-colors">
  1230	                <UserPlus className="w-4 h-4" /> Criar Usuário
  1231	              </button>
  1232	            </div>
  1233	
  1234	            {/* Formulário Criar Usuário */}
  1235	            {showCreateUser && (
  1236	              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
  1237	                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Novo Usuário</h3>
  1238	                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  1239	                  <input type="text" placeholder="Username *" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
  1240	                  <input type="password" placeholder="Senha *" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
  1241	                  <input type="text" placeholder="Nome de Exibição" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
  1242	                  <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
  1243	                  <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
  1244	                    <option value="user">Usuário</option>
  1245	                    <option value="admin">Admin</option>
  1246	                  </select>
  1247	                  <input type="number" placeholder="Saldo Inicial (R$)" value={newBalance} onChange={e => setNewBalance(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
  1248	                </div>
  1249	                <div className="flex gap-2 mt-3">
  1250	                  <button onClick={createUser} disabled={creatingUser} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors disabled:opacity-50">
  1251	                    {creatingUser ? "Criando..." : "Criar Usuário"}
  1252	                  </button>
  1253	                  <button onClick={() => setShowCreateUser(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
  1254	                    Cancelar
  1255	                  </button>
  1256	                </div>
  1257	              </div>
  1258	            )}
  1259	
  1260	            {/* Modal Alterar Senha */}
  1261	            {changePwUserId && (
  1262	              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setChangePwUserId(null); setChangePwValue(""); }}>
  1263	                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
  1264	                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2"><Lock className="w-4 h-4" /> Alterar Senha</h3>
  1265	                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Usuário: <strong>{changePwUsername}</strong></p>
  1266	                  <input type="password" placeholder="Nova senha (mín. 4 caracteres)" value={changePwValue} onChange={e => setChangePwValue(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4" />
  1267	                  <div className="flex gap-2 justify-end">
  1268	                    <button onClick={() => { setChangePwUserId(null); setChangePwValue(""); }} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancelar</button>
  1269	                    <button onClick={changePassword} disabled={changingPw} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors disabled:opacity-50">{changingPw ? "Salvando..." : "Salvar"}</button>
  1270	                  </div>
  1271	                </div>
  1272	              </div>
  1273	            )}
  1274	
  1275	            {loading ? (
  1276	              <div className="flex items-center justify-center py-12">
  1277	                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
  1278	              </div>
  1279	            ) : (
  1280	              <div className="space-y-2">
  1281	                {filteredUsers.map(u => (
  1282	                  <div key={u.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
  1283	                    <div className="flex flex-wrap items-start justify-between gap-3">
  1284	                      <div className="flex items-center gap-3">
  1285	                        <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center overflow-hidden border-2 border-yellow-200 dark:border-yellow-800 flex-shrink-0">
  1286	                          {u.profile_photo ? (
  1287	                            <img src={u.profile_photo} alt={u.username} className="w-full h-full object-cover" />
  1288	                          ) : (
  1289	                            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
  1290	                              {u.username.charAt(0).toUpperCase()}
  1291	                            </span>
  1292	                          )}
  1293	                        </div>
  1294	                        <div>
  1295	                          <div className="flex items-center gap-2 flex-wrap">
  1296	                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{u.username}</p>
  1297	                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
  1298	                              u.role === "admin"
  1299	                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
  1300	                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
  1301	                            }`}>
  1302	                              {u.role === "admin" ? "Admin" : "Usuário"}
  1303	                            </span>
  1304	                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
  1305	                              u.is_active
  1306	                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
  1307	                                : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
  1308	                            }`}>
  1309	                              {u.is_active ? "Ativo" : "Inativo"}
  1310	                            </span>
  1311	                            {/* Online indicator */}
  1312	                            {presence.find(p => String(p.user_id) === String(u.id) && p.is_online) && (
  1313	                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold">
  1314	                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
  1315	                                Online
  1316	                              </span>
  1317	                            )}
  1318	                          </div>
  1319	                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
  1320		                          {showPasswords && (
  1321	                            <p className="text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1 mt-0.5">
  1322	                              <Lock className="w-3 h-3" />
  1323	                              {(u as any).plain_password
  1324	                                ? (u as any).plain_password
  1325	                                : <span className="italic opacity-60">senha não registrada</span>}
  1326	                            </p>
  1327		                          )}
  1328		                          <p className="text-xs text-gray-400 dark:text-gray-500">ID: {u.id}</p>
  1329		                          <p className="text-xs text-gray-400 dark:text-gray-500">Cadastro: {formatDate(u.created_at)}</p>
  1330		                        </div>
  1331		                      </div>
  1332		                      <div className="flex flex-col items-end gap-2">
  1333		                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
  1334		                          R$ {(u.balance / 100).toFixed(2).replace(".", ",")}
  1335		                        </p>
  1336		                        <div className="flex flex-wrap items-center gap-1.5">
  1337		                          <button
  1338		                            onClick={() => { setBalanceModalUser(u); setBalanceModalValue(""); setBalanceModalType("credit"); }}
  1339		                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors font-semibold"
  1340		                            title="Ajustar saldo"
  1341		                          >
  1342		                            <Wallet className="w-3.5 h-3.5" />
  1343		                            Ajustar saldo
  1344		                          </button>
  1345		                          <button
  1346		                            onClick={() => openUserDetail(u)}
  1347		                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
  1348		                            title="Ver detalhes"
  1349		                          >
  1350		                            <Eye className="w-4 h-4" />
  1351		                          </button>
  1352		                          <button
  1353		                            onClick={() => toggleUserRole(u)}
  1354		                            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
  1355		                            title={u.role === "admin" ? "Tornar usuário" : "Tornar admin"}
  1356		                          >
  1357		                            <Shield className="w-4 h-4" />
  1358		                          </button>
  1359		                          <button
  1360		                            onClick={() => toggleUserActive(u.id, !!u.is_active)}
  1361		                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  1362		                            title={u.is_active ? "Desativar" : "Ativar"}
  1363		                          >
  1364	                            {u.is_active
  1365	                              ? <ToggleRight className="w-4 h-4 text-green-500" />
  1366	                              : <ToggleLeft className="w-4 h-4" />}
  1367	                          </button>
  1368		                          <button
  1369		                            onClick={() => {
  1370		                              setDeleteTargetUserId(u.id);
  1371		                              setDeleteTargetUsername(u.username);
  1372	                              setDeleteUserConfirm("");
  1373	                              setTab("database");
  1374	                            }}
  1375	                            className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
  1376	                            title="Excluir dados do usuário"
  1377	                          >
  1378	                            <Database className="w-4 h-4" />
  1379	                          </button>
  1380	                          {/* % Cashback (Depósito) */}
  1381	                          {cashbackEditId === u.id ? (
  1382	                            <div className="flex items-center gap-1">
  1383	                              <input
  1384	                                type="number" step="0.5" min="0" max="100"
  1385	                                placeholder="CB %"
  1386	                                value={cashbackEditValue}
  1387	                                onChange={e => setCashbackEditValue(e.target.value)}
  1388	                                className="w-16 px-1.5 py-1 text-xs rounded-lg border border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
  1389	                                autoFocus
  1390	                              />
  1391	                              <button onClick={() => saveCashbackForUser(u.id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors" title="Salvar">
  1392	                                <Save className="w-3.5 h-3.5" />
  1393	                              </button>
  1394	                              <button onClick={() => { setCashbackEditId(null); setCashbackEditValue(""); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" title="Cancelar">
  1395	                                <X className="w-3.5 h-3.5" />
  1396	                              </button>
  1397	                            </div>
  1398	                          ) : (
  1399	                            <button
  1400	                              onClick={() => { setCashbackEditId(u.id); setCashbackEditValue(u.cashback_percentage != null ? String(u.cashback_percentage) : ""); }}
  1401	                              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 transition-colors font-semibold"
  1402	                              title="Definir % Cashback no depósito"
  1403	                            >
  1404	                              <span>💰</span>
  1405	                              {u.cashback_percentage != null ? `CB: ${u.cashback_percentage}%` : "CB %"}
  1406	                            </button>
  1407	                          )}
  1408		                          <button
  1409		                            onClick={() => { setChangePwUserId(String(u.id)); setChangePwUsername(u.username); setChangePwValue(""); }}
  1410	                            className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
  1411	                            title="Alterar senha"
  1412	                          >
  1413	                            <Lock className="w-4 h-4" />
  1414	                          </button>
  1415		                          <button
  1416		                            onClick={() => deleteUser(u)}
  1417		                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
  1418		                            title="Excluir usuário"
  1419		                          >
  1420	                            <Trash2 className="w-4 h-4" />
  1421	                          </button>
  1422	                        </div>
  1423	                      </div>
  1424	                    </div>
  1425	                  </div>
  1426	                ))}
  1427	              </div>
  1428	            )}
  1429	          </div>
  1430	        )}
  1431	
  1432	        {/* ── MONITORING TAB ── */}
  1433	        {tab === "monitoring" && (
  1434	          <div>
  1435	            <div className="flex items-center justify-between mb-4">
  1436	              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
  1437	                <Monitor className="w-5 h-5" />
  1438	                Monitoramento de Usuários em Tempo Real
  1439	              </h2>
  1440	              <div className="flex items-center gap-2">
  1441	                <button 
  1442	                  onClick={() => clearLogs("monitoring")} 
  1443	                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors text-xs font-semibold"
  1444	                  title="Limpar todos os dados de presença"
  1445	                >
  1446	                  <Trash2 className="w-3.5 h-3.5" />
  1447	                  Limpar Monitoramento
  1448	                </button>
  1449	                <button onClick={loadPresence} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
  1450	                  <RefreshCw className="w-4 h-4" />
  1451	                </button>
  1452	              </div>
  1453	            </div>
  1454	
  1455	            {/* Summary Cards */}
  1456	            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  1457	              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
  1458	                <Wifi className="w-6 h-6 mx-auto mb-1 text-green-500" />
  1459	                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineCount}</p>
  1460	                <p className="text-xs text-gray-500 dark:text-gray-400">Online Agora</p>
  1461	              </div>
  1462	              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
  1463	                <WifiOff className="w-6 h-6 mx-auto mb-1 text-gray-400" />
  1464	                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{offlineCount}</p>
  1465	                <p className="text-xs text-gray-500 dark:text-gray-400">Offline</p>
  1466	              </div>
  1467		              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
  1468		                <FileText className="w-6 h-6 mx-auto mb-1 text-blue-500" />
  1469		                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
  1470		                  {presence.filter(p => p.is_online && /(criando|editando|emitindo)/i.test(p.current_action || "")).length}
  1471		                </p>
  1472		                <p className="text-xs text-gray-500 dark:text-gray-400">Emitindo Docs</p>
  1473		              </div>
  1474	              <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
  1475	                <Globe className="w-6 h-6 mx-auto mb-1 text-purple-500" />
  1476	                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalTracked}</p>
  1477	                <p className="text-xs text-gray-500 dark:text-gray-400">Total Usuários</p>
  1478	              </div>
  1479	            </div>
  1480	
  1481	            {/* User List */}
  1482	            {presence.length === 0 ? (
  1483	              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
  1484	                <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
  1485	                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum dado de presença disponível ainda.</p>
  1486	                <p className="text-xs text-gray-400 mt-1">Os dados aparecerão quando os usuários acessarem o painel.</p>
  1487	              </div>
  1488	            ) : (
  1489	              <div className="space-y-2">
  1490	                {presence.map(p => (
  1491		                  <div key={p.user_id} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all ${
  1492		                    p.is_online
  1493		                      ? "border-green-200 dark:border-green-800 shadow-sm shadow-green-100 dark:shadow-green-900/20"
  1494		                      : "border-gray-100 dark:border-gray-800 opacity-60"
  1495		                  }`}>
  1496		                    <div className="flex items-center justify-between gap-3">
  1497		                      <div className="flex items-center gap-3">
  1498	                        <div className="relative">
  1499	                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-700">
  1500	                            {p.profile_photo ? (
  1501	                              <img src={p.profile_photo} alt={p.username} className="w-full h-full object-cover" />
  1502	                            ) : (
  1503	                              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
  1504	                                {(p.username || "?").charAt(0).toUpperCase()}
  1505	                              </span>
  1506	                            )}
  1507	                          </div>
  1508	                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
  1509	                            p.is_online ? "bg-green-500 animate-pulse" : "bg-gray-400"
  1510	                          }`} />
  1511	                        </div>
  1512	                        <div>
  1513	                          <div className="flex items-center gap-2">
  1514	                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.username || `User #${p.user_id}`}</p>
  1515	                            {p.role === "admin" && (
  1516	                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-semibold">
  1517	                                Admin
  1518	                              </span>
  1519	                            )}
  1520	                          </div>
  1521	                          <p className="text-xs text-gray-400 dark:text-gray-500">{p.email}</p>
  1522	                        </div>
  1523	                      </div>
  1524		                      <div className="text-right">
  1525	                        <div className="flex items-center gap-2 justify-end mb-1">
  1526	                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
  1527	                            p.is_online
  1528	                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
  1529	                              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
  1530	                          }`}>
  1531	                            {p.is_online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
  1532	                            {p.is_online ? "Online" : "Offline"}
  1533	                          </span>
  1534	                        </div>
  1535		                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
  1536		                          {PAGE_LABELS[p.current_page] || p.current_page || "—"}
  1537		                        </p>
  1538		                        <p className="text-[10px] text-gray-400">{p.current_action || "navegando"}</p>
  1539		                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(p.last_seen)}</p>
  1540		                        <p className="text-[10px] text-gray-400">Sessão: {formatDuration(p.total_session_seconds)}</p>
  1541		                        <p className="text-[10px] text-gray-400">Página: {formatDuration(p.current_page_duration_seconds)}</p>
  1542		                      </div>
  1543		                    </div>
  1544		                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
  1545		                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
  1546		                        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">Timeline</p>
  1547		                        <div className="space-y-2">
  1548		                          {(p.timeline || []).slice(0, 5).map((item) => (
  1549		                            <div key={item.id} className="flex items-start justify-between gap-3 text-[11px]">
  1550		                              <div>
  1551		                                <p className="font-medium text-gray-700 dark:text-gray-200">
  1552		                                  {PAGE_LABELS[item.page_path] || item.page_path}
  1553		                                </p>
  1554		                                <p className="text-gray-500 dark:text-gray-400">{item.action || "navegando"}</p>
  1555		                              </div>
  1556		                              <div className="text-right text-gray-400">
  1557		                                <p>{formatDuration(item.duration_seconds)}</p>
  1558		                                <p>{timeAgo(item.started_at)}</p>
  1559		                              </div>
  1560		                            </div>
  1561		                          ))}
  1562		                          {(p.timeline || []).length === 0 && (
  1563		                            <p className="text-[11px] text-gray-400">Nenhuma atividade registrada.</p>
  1564		                          )}
  1565		                        </div>
  1566		                      </div>
  1567		                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
  1568		                        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">Tempo por página</p>
  1569		                        <div className="space-y-2">
  1570		                          {(p.page_totals || []).slice(0, 5).map((item) => (
  1571		                            <div key={item.page} className="flex items-center justify-between gap-3 text-[11px]">
  1572		                              <span className="text-gray-700 dark:text-gray-200">{PAGE_LABELS[item.page] || item.page}</span>
  1573		                              <span className="text-gray-400">{formatDuration(item.duration_seconds)}</span>
  1574		                            </div>
  1575		                          ))}
  1576		                          {(p.page_totals || []).length === 0 && (
  1577		                            <p className="text-[11px] text-gray-400">Sem agregados ainda.</p>
  1578		                          )}
  1579		                        </div>
  1580		                      </div>
  1581		                    </div>
  1582		                  </div>
  1583		                ))}
  1584	              </div>
  1585	            )}
  1586	          </div>
  1587	        )}
  1588	
  1589	        {/* ── PRICING TAB ── */}
  1590	        {tab === "pricing" && (
  1591	          <div>
  1592	            <div className="flex items-center justify-between mb-4">
  1593	              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Preços por Documento</h2>
  1594	              {pricing.length === 0 && (
  1595	                <button
  1596	                  onClick={initDefaultPricing}
  1597	                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl transition-colors"
  1598	                >
  1599	                  <Plus className="w-4 h-4" />
  1600	                  Configurar Preços Padrão
  1601	                </button>
  1602	              )}
  1603	            </div>
  1604	            {pricing.length === 0 ? (
  1605	              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
  1606	                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
  1607	                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nenhum preço configurado.</p>
  1608	                <button
  1609	                  onClick={initDefaultPricing}
  1610	                  className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-colors"
  1611	                >
  1612	                  Configurar Preços Padrão
  1613	                </button>
  1614	              </div>
  1615	            ) : (
  1616	              <>
  1617	                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  1618	                  {pricing.map(p => (
  1619	                    <div key={p.document_type} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
  1620	                      <div className="flex items-center justify-between mb-2">
  1621	                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{p.document_type}</p>
  1622	                        <button
  1623	                          onClick={() => setEditingIsActive(prev => ({ ...prev, [p.document_type]: !(prev[p.document_type] !== false) }))}
  1624	                          className={`p-1 rounded-lg transition-colors ${editingIsActive[p.document_type] !== false ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
  1625	                          title={editingIsActive[p.document_type] !== false ? "Desativar" : "Ativar"}
  1626	                        >
  1627	                          {editingIsActive[p.document_type] !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
  1628	                        </button>
  1629	                      </div>
  1630	                      <input
  1631	                        type="text"
  1632	                        value={editingDisplayName[p.document_type] ?? p.display_name}
  1633	                        onChange={e => setEditingDisplayName(prev => ({ ...prev, [p.document_type]: e.target.value }))}
  1634	                        placeholder="Nome exibido"
  1635	                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-2"
  1636	                      />
  1637	                      <div className="flex items-center gap-2">
  1638	                        <span className="text-sm text-gray-500 dark:text-gray-400">R$</span>
  1639	                        <input
  1640	                          type="number"
  1641	                          step="0.01"
  1642	                          value={editingPrice[p.document_type] || ""}
  1643	                          onChange={e => setEditingPrice(prev => ({ ...prev, [p.document_type]: e.target.value }))}
  1644	                          className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1645	                        />
  1646	                        <button
  1647	                          onClick={() => savePrice(p.document_type)}
  1648	                          className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 transition-colors"
  1649	                          title="Salvar individual"
  1650	                        >
  1651	                          <Save className="w-4 h-4" />
  1652	                        </button>
  1653	                      </div>
  1654	                    </div>
  1655	                  ))}
  1656	                </div>
  1657	                <div className="mt-4 flex justify-end">
  1658	                  <button
  1659	                    onClick={saveAllPrices}
  1660	                    disabled={pricingSaving}
  1661	                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
  1662	                  >
  1663	                    <Save className="w-4 h-4" />
  1664	                    {pricingSaving ? "Salvando..." : "Salvar Todos os Preços"}
  1665	                  </button>
  1666	                </div>
  1667	              </>
  1668	            )}
  1669	          </div>
  1670	        )}
  1671	
  1672	        {/* ── NOTICES TAB ── */}
  1673	        {tab === "notices" && (
  1674	          <div className="space-y-6">
  1675	            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
  1676	              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Criar Novo Aviso</h3>
  1677	              <div className="space-y-3">
  1678	                <div>
  1679	                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
  1680	                  <div className="flex gap-2 flex-wrap">
  1681	                    {NOTICE_TYPES.map(nt => (
  1682	                      <button
  1683	                        key={nt.value}
  1684	                        onClick={() => setNewNotice(n => ({ ...n, type: nt.value as any }))}
  1685	                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
  1686	                          newNotice.type === nt.value
  1687	                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400"
  1688	                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
  1689	                        }`}
  1690	                      >
  1691	                        <nt.icon className="w-3.5 h-3.5" />
  1692	                        {nt.label}
  1693	                      </button>
  1694	                    ))}
  1695	                  </div>
  1696	                </div>
  1697	                <div>
  1698	                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título</label>
  1699	                  <input
  1700	                    type="text"
  1701	                    value={newNotice.title}
  1702	                    onChange={e => setNewNotice(n => ({ ...n, title: e.target.value }))}
  1703	                    placeholder="Título do aviso"
  1704	                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1705	                  />
  1706	                </div>
  1707	                <div>
  1708	                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mensagem</label>
  1709	                  <textarea
  1710	                    value={newNotice.message}
  1711	                    onChange={e => setNewNotice(n => ({ ...n, message: e.target.value }))}
  1712	                    placeholder="Mensagem do aviso"
  1713	                    rows={3}
  1714	                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
  1715	                  />
  1716	                </div>
  1717	                <button
  1718	                  onClick={createNotice}
  1719	                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-colors"
  1720	                >
  1721	                  Publicar Aviso
  1722	                </button>
  1723	              </div>
  1724	            </div>
  1725	
  1726	            <div>
  1727	              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Avisos Publicados</h3>
  1728	              {notices.length === 0 ? (
  1729	                <div className="text-center py-8 text-gray-400 text-sm">Nenhum aviso publicado</div>
  1730	              ) : (
  1731	                <div className="space-y-2">
  1732	                  {notices.map(n => (
  1733	                    <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border ${
  1734	                      n.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
  1735	                      n.type === "error" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" :
  1736	                      n.type === "success" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" :
  1737	                      "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
  1738	                    } ${!n.is_active ? "opacity-50" : ""}`}>
  1739	                      <div className="flex-1">
  1740	                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
  1741	                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
  1742	                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at || "")}</p>
  1743	                      </div>
  1744	                      <div className="flex items-center gap-1.5 flex-shrink-0">
  1745	                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
  1746	                          n.is_active
  1747	                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
  1748	                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
  1749	                        }`}>
  1750	                          {n.is_active ? "Ativo" : "Inativo"}
  1751	                        </span>
  1752	                        <button
  1753	                          onClick={() => n.id && toggleNotice(n.id, n.is_active)}
  1754	                          className="p-1.5 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-colors"
  1755	                        >
  1756	                          {n.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
  1757	                        </button>
  1758	                        <button
  1759	                          onClick={() => n.id && deleteNotice(n.id)}
  1760	                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
  1761	                        >
  1762	                          <Trash2 className="w-4 h-4" />
  1763	                        </button>
  1764	                      </div>
  1765	                    </div>
  1766	                  ))}
  1767	                </div>
  1768	              )}
  1769	            </div>
  1770	          </div>
  1771	        )}
  1772	
  1773	        {/* ── LOGS TAB ── */}
  1774	        {tab === "logs" && (
  1775	          <div>
  1776	            <div className="flex items-center gap-3 mb-4 flex-wrap">
  1777	              <div className="relative flex-1 max-w-sm">
  1778	                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  1779	                <input
  1780	                  type="text"
  1781	                  placeholder="Filtrar logs..."
  1782	                  value={logFilter}
  1783	                  onChange={e => setLogFilter(e.target.value)}
  1784	                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1785	                />
  1786	              </div>
  1787	              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
  1788	                {LOG_CATEGORIES.map(c => (
  1789	                  <button
  1790	                    key={c.value}
  1791	                    onClick={() => setLogCategory(c.value)}
  1792	                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
  1793	                      logCategory === c.value
  1794	                        ? "bg-yellow-500 text-white"
  1795	                        : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
  1796	                    }`}
  1797	                  >
  1798	                    <c.icon className="w-3 h-3" />
  1799	                    {c.label}
  1800	                    {logCategories[c.value] !== undefined && (
  1801	                      <span className="ml-0.5 opacity-70">({logCategories[c.value]})</span>
  1802	                    )}
  1803	                  </button>
  1804	                ))}
  1805	              </div>
  1806	              <button onClick={loadLogs} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors" title="Atualizar">
  1807	                <RefreshCw className="w-4 h-4" />
  1808	              </button>
  1809	              <button onClick={() => clearLogs("all")} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors text-xs font-semibold" title="Limpar todos os logs">
  1810	                <Trash className="w-3.5 h-3.5" />
  1811	                Limpar
  1812	              </button>
  1813	            </div>
  1814	            <div className="flex items-center gap-2 mb-4 flex-wrap">
  1815	              <Calendar className="w-4 h-4 text-gray-400" />
  1816	              <span className="text-xs text-gray-500 dark:text-gray-400">Período:</span>
  1817	              <input
  1818	                type="date"
  1819	                value={logDateFrom}
  1820	                onChange={e => setLogDateFrom(e.target.value)}
  1821	                className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1822	              />
  1823	              <span className="text-xs text-gray-400">até</span>
  1824	              <input
  1825	                type="date"
  1826	                value={logDateTo}
  1827	                onChange={e => setLogDateTo(e.target.value)}
  1828	                className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1829	              />
  1830	              {(logDateFrom || logDateTo) && (
  1831	                <button onClick={() => { setLogDateFrom(""); setLogDateTo(""); }} className="text-xs text-red-500 hover:text-red-700 font-semibold">
  1832	                  Limpar filtro
  1833	                </button>
  1834	              )}
  1835	            </div>
  1836	            {loading ? (
  1837	              <div className="flex items-center justify-center py-12">
  1838	                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
  1839	              </div>
  1840	            ) : filteredLogs.length === 0 ? (
  1841	              <div className="text-center py-12 text-gray-400 text-sm">
  1842	                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
  1843	                <p>Nenhum log encontrado</p>
  1844	              </div>
  1845	            ) : (
  1846	              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  1847	                <table className="w-full text-xs">
  1848	                  <thead>
  1849	                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  1850	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
  1851	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
  1852	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
  1853	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ação</th>
  1854	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Detalhes</th>
  1855	                    </tr>
  1856	                  </thead>
  1857	                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  1858	                    {filteredLogs.map(l => {
  1859	                      const severity = l.severity || "info";
  1860	                      const category = l.category || "admin";
  1861	                      return (
  1862	                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
  1863	                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(l.created_at)}</td>
  1864	                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{l.username || `#${l.user_id}` || "Sistema"}</td>
  1865	                          <td className="px-4 py-2.5">
  1866	                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
  1867	                              category === "payment"
  1868	                                ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
  1869	                                : category === "error"
  1870	                                ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
  1871	                                : category === "admin"
  1872	                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
  1873	                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
  1874	                            }`}>
  1875	                              {category}
  1876	                            </span>
  1877	                          </td>
  1878	                          <td className="px-4 py-2.5">
  1879	                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
  1880	                              severity === "error"
  1881	                                ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
  1882	                                : l.action.includes("delete") || l.action.includes("exclu")
  1883	                                ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
  1884	                                : l.action.includes("emit") || l.action.includes("create") || l.action.includes("credito")
  1885	                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
  1886	                                : l.action.includes("login")
  1887	                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
  1888	                                : l.action.includes("debito")
  1889	                                ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
  1890	                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
  1891	                            }`}>
  1892	                              {l.action}
  1893	                            </span>
  1894	                          </td>
  1895	                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
  1896	                            {(() => {
  1897	                              try {
  1898	                                const parsed = JSON.parse(l.details || "{}");
  1899	                                if (parsed.amount) return `R$ ${(parsed.amount / 100).toFixed(2)} - ${parsed.description || ""}`;
  1900	                                if (parsed.price) return `Preço: R$ ${(parsed.price / 100).toFixed(2)}`;
  1901	                                return l.details || "—";
  1902	                              } catch { return l.details || "—"; }
  1903	                            })()}
  1904	                          </td>
  1905	                        </tr>
  1906	                      );
  1907	                    })}
  1908	                  </tbody>
  1909	                </table>
  1910	              </div>
  1911	            )}
  1912	          </div>
  1913	        )}
  1914	
  1915	        {/* ── EMISSIONS TAB ── */}
  1916	        {tab === "emissions" && (
  1917	          <div>
  1918	            <div className="flex items-center gap-3 mb-4 flex-wrap">
  1919	              <div className="relative flex-1 max-w-sm">
  1920	                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  1921	                <input
  1922	                  type="text"
  1923	                  placeholder="Filtrar por paciente, usuário ou código..."
  1924	                  value={emissionsFilter}
  1925	                  onChange={e => setEmissionsFilter(e.target.value)}
  1926	                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1927	                />
  1928	              </div>
  1929	              <select
  1930	                value={emissionsTypeFilter}
  1931	                onChange={e => setEmissionsTypeFilter(e.target.value)}
  1932	                className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1933	              >
  1934	                <option value="all">Todos os Tipos</option>
  1935	                <option value="atestado">Atestado</option>
  1936	                <option value="receita">Receita</option>
  1937	                <option value="cnh">CNH</option>
  1938	                <option value="cha">CHA</option>
  1939	                <option value="toxicologico">Toxicológico</option>
  1940	                <option value="historico-sp">Histórico SP</option>
  1941	                <option value="historico-uninter">Histórico UNINTER</option>
  1942	                <option value="toxicria">Toxicológico Sodré</option>
  1943	                <option value="laudocria">Laudo Sodré</option>
  1944	              </select>
  1945	              <div className="flex items-center gap-2">
  1946	                <Calendar className="w-3.5 h-3.5 text-gray-400" />
  1947	                <input
  1948	                  type="date"
  1949	                  value={emissionsDateFrom}
  1950	                  onChange={e => setEmissionsDateFrom(e.target.value)}
  1951	                  className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1952	                  title="Data inicial"
  1953	                />
  1954	                <span className="text-xs text-gray-400">ate</span>
  1955	                <input
  1956	                  type="date"
  1957	                  value={emissionsDateTo}
  1958	                  onChange={e => setEmissionsDateTo(e.target.value)}
  1959	                  className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  1960	                  title="Data final"
  1961	                />
  1962	                {(emissionsDateFrom || emissionsDateTo) && (
  1963	                  <button onClick={() => { setEmissionsDateFrom(""); setEmissionsDateTo(""); }} className="p-1 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 hover:bg-red-200 transition-colors" title="Limpar filtro de data">
  1964	                    <X className="w-3 h-3" />
  1965	                  </button>
  1966	                )}
  1967	              </div>
  1968	              <button onClick={loadEmissions} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
  1969	                <RefreshCw className="w-4 h-4" />
  1970	              </button>
  1971	              <span className="text-xs text-gray-500 dark:text-gray-400">{filteredEmissions.length} emissões</span>
  1972	            </div>
  1973	            {loading ? (
  1974	              <div className="flex items-center justify-center py-12">
  1975	                <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
  1976	              </div>
  1977	            ) : filteredEmissions.length === 0 ? (
  1978	              <div className="text-center py-12 text-gray-400 text-sm">
  1979	                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
  1980	                <p>Nenhuma emissão encontrada</p>
  1981	              </div>
  1982	            ) : (
  1983	              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  1984		                <table className="w-full text-xs">
  1985		                  <thead>
  1986		                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  1987		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
  1988		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
  1989		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
  1990		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
  1991		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Tipo</th>
  1992	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Código QR</th>
  1993	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
  1994	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
  1995	                    </tr>
  1996	                  </thead>
  1997		                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  1998		                    {filteredEmissions.map(e => (
  1999		                      <tr key={`${e.table_source}-${e.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
  2000		                        <td className="px-4 py-2.5 font-mono text-gray-500 dark:text-gray-400">{e.id}</td>
  2001		                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(e.created_at)}</td>
  2002	                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{e.username || e.user_id || "—"}</td>
  2003	                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{e.nome || e.paciente || "—"}</td>
  2004	                        <td className="px-4 py-2.5 hidden md:table-cell">
  2005	                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
  2006	                            {DOC_TYPE_LABELS[e.type] || e.type}
  2007	                          </span>
  2008	                        </td>
  2009	                        <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 font-mono hidden md:table-cell">{e.codigo_qr || "—"}</td>
  2010	                        <td className="px-4 py-2.5">
  2011	                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
  2012	                            e.status === "emitido"
  2013	                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
  2014	                              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
  2015	                          }`}>
  2016	                            {e.status}
  2017	                          </span>
  2018	                        </td>
  2019		                        <td className="px-4 py-2.5">
  2020		                          <div className="flex items-center gap-1">
  2021		                            <button
  2022		                              onClick={() => openEmissionPreview(e)}
  2023		                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
  2024		                              title="Visualizar"
  2025		                            >
  2026		                              <Eye className="w-3.5 h-3.5" />
  2027		                            </button>
  2028		                            <button
  2029		                              onClick={() => editEmission(e)}
  2030		                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
  2031		                              title="Editar"
  2032		                            >
  2033		                              <Edit3 className="w-3.5 h-3.5" />
  2034		                            </button>
  2035		                            <button
  2036		                              onClick={() => deleteEmission(e.id, e.table_source || "documents", false)}
  2037	                              className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
  2038	                              title="Cancelar"
  2039	                            >
  2040	                              <X className="w-3.5 h-3.5" />
  2041	                            </button>
  2042	                            <button
  2043	                              onClick={() => deleteEmission(e.id, e.table_source || "documents", true)}
  2044	                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
  2045	                              title="Excluir permanentemente"
  2046	                            >
  2047	                              <Trash2 className="w-3.5 h-3.5" />
  2048	                            </button>
  2049	                          </div>
  2050	                        </td>
  2051	                      </tr>
  2052	                    ))}
  2053	                  </tbody>
  2054	                </table>
  2055	              </div>
  2056	            )}
  2057	          </div>
  2058	        )}
  2059	
  2060	        {/* ── REFERRAL TAB ── */}
  2061	        {tab === "referral" && (
  2062	          <div className="space-y-6">
  2063	            {/* Sub-tabs */}
  2064	            <div className="flex items-center justify-between gap-3 flex-wrap">
  2065	              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
  2066	                {(["overview", "referrals", "earnings", "cashback", "users"] as const).map(rt => (
  2067	                  <button
  2068	                    key={rt}
  2069	                    onClick={() => setReferralTab(rt)}
  2070	                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
  2071	                      referralTab === rt
  2072	                        ? "bg-yellow-500 text-white"
  2073	                        : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
  2074	                    }`}
  2075	                  >
  2076	                    {rt === "overview" ? "Visão Geral" : rt === "referrals" ? "Indicações" : rt === "earnings" ? "Ganhos Referral" : rt === "cashback" ? "Cashback" : "Usuários"}
  2077	                  </button>
  2078	                ))}
  2079	              </div>
  2080	              <button 
  2081	                onClick={() => setShowLinkModal(true)}
  2082	                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-xl hover:bg-yellow-200 transition-colors border border-yellow-200 dark:border-yellow-800"
  2083	              >
  2084	                <UserPlus className="w-4 h-4" />
  2085	                Vincular Indicação Manual
  2086	              </button>
  2087	            </div>
  2088	
  2089	            {/* Modal de Vínculo Manual */}
  2090	            {showLinkModal && (
  2091	              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowLinkModal(false)}>
  2092	                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
  2093	                  <div className="flex items-center justify-between mb-4">
  2094	                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
  2095	                      <UserPlus className="w-5 h-5 text-yellow-500" />
  2096	                      Vincular Indicação
  2097	                    </h3>
  2098	                    <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
  2099	                      <X className="w-5 h-5 text-gray-400" />
  2100	                    </button>
  2101	                  </div>
  2102	                  
  2103	                  <div className="space-y-4">
  2104	                    <div>
  2105	                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Quem indicou? (Indicador)</label>
  2106	                      <select 
  2107	                        value={linkReferrerId} 
  2108	                        onChange={e => setLinkReferrerId(e.target.value)}
  2109	                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  2110	                      >
  2111	                        <option value="">Selecione o indicador...</option>
  2112	                        {users.map(u => (
  2113	                          <option key={u.id} value={String(u.id)}>{u.username} ({u.email})</option>
  2114	                        ))}
  2115	                      </select>
  2116	                    </div>
  2117	
  2118	                    <div>
  2119	                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Quem foi indicado? (Indicado)</label>
  2120	                      <select 
  2121	                        value={linkReferredId} 
  2122	                        onChange={e => setLinkReferredId(e.target.value)}
  2123	                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  2124	                      >
  2125	                        <option value="">Selecione o indicado...</option>
  2126	                        {users.map(u => (
  2127	                          <option key={u.id} value={String(u.id)}>{u.username} ({u.email})</option>
  2128	                        ))}
  2129	                      </select>
  2130	                      <p className="mt-2 text-[10px] text-gray-400 italic">O indicado passará a gerar comissões para o indicador selecionado em todos os seus futuros depósitos.</p>
  2131	                    </div>
  2132	
  2133	                    <div className="pt-2">
  2134	                      <button 
  2135	                        onClick={linkManualReferral}
  2136	                        disabled={linking || !linkReferrerId || !linkReferredId}
  2137	                        className="w-full h-11 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
  2138	                      >
  2139	                        {linking ? (
  2140	                          <RefreshCw className="w-4 h-4 animate-spin" />
  2141	                        ) : (
  2142	                          <CheckCircle className="w-4 h-4" />
  2143	                        )}
  2144	                        Confirmar Vínculo Manual
  2145	                      </button>
  2146	                    </div>
  2147	                  </div>
  2148	                </div>
  2149	              </div>
  2150	            )}
  2151	
  2152	            {referralTab === "overview" && (
  2153	              <div className="space-y-6">
  2154	                {/* Stats cards */}
  2155	                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
  2156	                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
  2157	                    <Gift className="w-6 h-6 mx-auto mb-2 text-purple-500" />
  2158	                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{referralData.totalReferrals || 0}</p>
  2159	                    <p className="text-xs text-gray-500">Total Indicações</p>
  2160	                  </div>
  2161		                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
  2162		                    <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
  2163		                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{(referralData.earningsByReferrer || []).length || referralData.activeReferrers || 0}</p>
  2164		                    <p className="text-xs text-gray-500">Indicadores Ativos</p>
  2165		                  </div>
  2166	                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
  2167	                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
  2168	                    <p className="text-2xl font-bold text-green-600">R$ {((referralData.totalReferralEarnings || 0) / 100).toFixed(2)}</p>
  2169	                    <p className="text-xs text-gray-500">Total Pago (Referral)</p>
  2170	                  </div>
  2171		                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
  2172		                    <Percent className="w-6 h-6 mx-auto mb-2 text-orange-500" />
  2173		                    <p className="text-2xl font-bold text-orange-600">{referralData.activeCodes || 0}</p>
  2174		                    <p className="text-xs text-gray-500">Códigos Ativos</p>
  2175		                  </div>
  2176		                </div>
  2177	
  2178	                {/* Global settings */}
  2179	                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
  2180	                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Configurações Globais</h3>
  2181	                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  2182	                    <div>
  2183	                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">% Indicação (Referral)</label>
  2184	                      <div className="flex items-center gap-2">
  2185	                        <input
  2186	                          type="number" step="0.5" min="0" max="100"
  2187	                          value={referralSettings.referral_percentage}
  2188	                          onChange={e => setReferralSettings(s => ({ ...s, referral_percentage: parseFloat(e.target.value) || 0 }))}
  2189	                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  2190	                        />
  2191	                        <span className="text-sm text-gray-500">%</span>
  2192	                        <button
  2193	                          onClick={() => setReferralSettings(s => ({ ...s, referral_enabled: !s.referral_enabled }))}
  2194	                          className={`p-2 rounded-lg transition-colors ${referralSettings.referral_enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
  2195	                        >
  2196	                          {referralSettings.referral_enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
  2197	                        </button>
  2198	                      </div>
  2199	                      <p className="text-[10px] text-gray-400 mt-1">% que o indicador ganha sobre cada depósito do indicado</p>
  2200	                    </div>
  2201	                    <div>
  2202	                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">% Cashback (Depósito)</label>
  2203	                      <div className="flex items-center gap-2">
  2204	                        <input
  2205	                          type="number" step="0.5" min="0" max="100"
  2206	                          value={referralSettings.cashback_percentage}
  2207	                          onChange={e => setReferralSettings(s => ({ ...s, cashback_percentage: parseFloat(e.target.value) || 0 }))}
  2208	                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  2209	                        />
  2210	                        <span className="text-sm text-gray-500">%</span>
  2211	                        <button
  2212	                          onClick={() => setReferralSettings(s => ({ ...s, cashback_enabled: !s.cashback_enabled }))}
  2213	                          className={`p-2 rounded-lg transition-colors ${referralSettings.cashback_enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
  2214	                        >
  2215	                          {referralSettings.cashback_enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
  2216	                        </button>
  2217	                      </div>
  2218	                      <p className="text-[10px] text-gray-400 mt-1">% que o usuário ganha de volta ao depositar</p>
  2219	                    </div>
  2220	                  </div>
  2221		                  <div className="mt-4 flex justify-end">
  2222		                    <button onClick={saveReferralSettings} className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
  2223		                      <Save className="w-4 h-4" /> Salvar Configurações
  2224		                    </button>
  2225		                  </div>
  2226		                </div>
  2227		                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  2228		                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
  2229		                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Ganhos detalhados por indicador</h3>
  2230		                  </div>
  2231		                  <table className="w-full text-xs">
  2232		                    <thead>
  2233		                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  2234		                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicador</th>
  2235		                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicados</th>
  2236		                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Total ganho</th>
  2237		                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Último ganho</th>
  2238		                      </tr>
  2239		                    </thead>
  2240		                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  2241		                      {(referralData.earningsByReferrer || []).map((item: any) => (
  2242		                        <tr key={item.referrer_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
  2243		                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{item.referrer_username}</td>
  2244		                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{item.total_referred || 0}</td>
  2245		                          <td className="px-4 py-2.5 font-semibold text-green-600">R$ {((item.total_earned || 0) / 100).toFixed(2)}</td>
  2246		                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{item.last_earning_at ? formatDate(item.last_earning_at) : "—"}</td>
  2247		                        </tr>
  2248		                      ))}
  2249		                    </tbody>
  2250		                  </table>
  2251		                </div>
  2252		              </div>
  2253		            )}
  2254	
  2255	            {referralTab === "referrals" && (
  2256	              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  2257	                <table className="w-full text-xs">
  2258	                  <thead>
  2259		                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  2260		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Data</th>
  2261		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicador</th>
  2262		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicado</th>
  2263		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Status</th>
  2264		                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Comissão</th>
  2265		                    </tr>
  2266	                  </thead>
  2267	                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  2268	                    {(referralData.referrals || []).map((r: any) => (
  2269	                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
  2270	                        <td className="px-4 py-2.5 text-gray-500">{formatDate(r.created_at)}</td>
  2271	                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.referrer_name} <span className="text-gray-400">({r.referrer_email})</span></td>
  2272	                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.referred_name} <span className="text-gray-400">({r.referred_email})</span></td>
  2273		                        <td className="px-4 py-2.5 text-gray-500">{r.status || "active"}</td>
  2274		                        <td className="px-4 py-2.5 font-semibold text-green-600">
  2275		                          R$ {((r.commission_earned || r.total_earned || 0) / 100).toFixed(2)}
  2276		                          <span className="ml-1 text-gray-400 font-normal">{r.commission_percentage ? `(${r.commission_percentage}%)` : ""}</span>
  2277		                        </td>
  2278		                      </tr>
  2279	                    ))}
  2280	                  </tbody>
  2281	                </table>
  2282	                {(referralData.referrals || []).length === 0 && (
  2283	                  <div className="text-center py-8 text-gray-400 text-sm">Nenhuma indicação registrada</div>
  2284	                )}
  2285	              </div>
  2286	            )}
  2287	
  2288	            {referralTab === "earnings" && (
  2289	              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  2290	                <table className="w-full text-xs">
  2291	                  <thead>
  2292	                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  2293	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Data</th>
  2294	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicador</th>
  2295	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicado</th>
  2296	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Depósito</th>
  2297	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">%</th>
  2298	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Ganho</th>
  2299	                    </tr>
  2300	                  </thead>
  2301	                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  2302	                    {(referralData.earnings || []).map((e: any) => (
  2303	                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
  2304	                        <td className="px-4 py-2.5 text-gray-500">{formatDate(e.created_at)}</td>
  2305	                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{e.referrer_name}</td>
  2306	                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{e.referred_name}</td>
  2307	                        <td className="px-4 py-2.5 text-gray-600">R$ {((e.deposit_amount || 0) / 100).toFixed(2)}</td>
  2308	                        <td className="px-4 py-2.5 text-gray-500">{e.percentage}%</td>
  2309	                        <td className="px-4 py-2.5 font-semibold text-green-600">R$ {((e.earned_amount || 0) / 100).toFixed(2)}</td>
  2310	                      </tr>
  2311	                    ))}
  2312	                  </tbody>
  2313	                </table>
  2314	                {(referralData.earnings || []).length === 0 && (
  2315	                  <div className="text-center py-8 text-gray-400 text-sm">Nenhum ganho de indicação registrado</div>
  2316	                )}
  2317	              </div>
  2318	            )}
  2319	
  2320	            {referralTab === "cashback" && (
  2321	              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  2322	                <table className="w-full text-xs">
  2323	                  <thead>
  2324	                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  2325	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Data</th>
  2326	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Usuário</th>
  2327	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Depósito</th>
  2328	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">%</th>
  2329	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Cashback</th>
  2330	                    </tr>
  2331	                  </thead>
  2332	                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  2333	                    {(referralData.cashback || []).map((c: any) => (
  2334	                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
  2335	                        <td className="px-4 py-2.5 text-gray-500">{formatDate(c.created_at)}</td>
  2336	                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{c.user_name} <span className="text-gray-400">({c.user_email})</span></td>
  2337	                        <td className="px-4 py-2.5 text-gray-600">R$ {((c.deposit_amount || 0) / 100).toFixed(2)}</td>
  2338	                        <td className="px-4 py-2.5 text-gray-500">{c.percentage}%</td>
  2339	                        <td className="px-4 py-2.5 font-semibold text-green-600">R$ {((c.cashback_amount || 0) / 100).toFixed(2)}</td>
  2340	                      </tr>
  2341	                    ))}
  2342	                  </tbody>
  2343	                </table>
  2344	                {(referralData.cashback || []).length === 0 && (
  2345	                  <div className="text-center py-8 text-gray-400 text-sm">Nenhum cashback registrado</div>
  2346	                )}
  2347	              </div>
  2348	            )}
  2349	
  2350	            {referralTab === "users" && (
  2351	              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
  2352	                <table className="w-full text-xs">
  2353	                  <thead>
  2354	                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
  2355	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Usuário</th>
  2356	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Código</th>
  2357	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Indicados</th>
  2358	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Ganho Ref.</th>
  2359	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Cashback</th>
  2360	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">% Custom</th>
  2361	                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase">Ações</th>
  2362	                    </tr>
  2363	                  </thead>
  2364	                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
  2365	                    {(referralData.users || []).map((u: any) => (
  2366	                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
  2367	                        <td className="px-4 py-2.5">
  2368	                          <p className="font-medium text-gray-800 dark:text-gray-200">{u.name || u.email}</p>
  2369	                          <p className="text-[10px] text-gray-400">{u.email}</p>
  2370	                        </td>
  2371	                        <td className="px-4 py-2.5">
  2372	                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{u.code || "—"}</span>
  2373	                        </td>
  2374	                        <td className="px-4 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">{u.total_referred || 0}</td>
  2375	                        <td className="px-4 py-2.5 text-green-600 font-semibold">R$ {((u.total_earned || 0) / 100).toFixed(2)}</td>
  2376	                        <td className="px-4 py-2.5 text-orange-600 font-semibold">R$ {((u.total_cashback || 0) / 100).toFixed(2)}</td>
  2377	                        <td className="px-4 py-2.5">
  2378	                          {editUserRefId === u.id ? (
  2379	                            <div className="flex items-center gap-1">
  2380	                              <input type="number" step="0.5" placeholder="Ref %" value={editUserRefPct} onChange={e => setEditUserRefPct(e.target.value)} className="w-16 px-1 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" />
  2381	                              <input type="number" step="0.5" placeholder="CB %" value={editUserCbPct} onChange={e => setEditUserCbPct(e.target.value)} className="w-16 px-1 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" />
  2382	                              <button onClick={() => saveUserRefSettings(u.id)} className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"><Save className="w-3 h-3" /></button>
  2383	                              <button onClick={() => setEditUserRefId(null)} className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-3 h-3" /></button>
  2384	                            </div>
  2385	                          ) : (
  2386	                            <span className="text-xs text-gray-500">
  2387	                              {u.referral_percentage != null ? `Ref: ${u.referral_percentage}%` : "Global"}
  2388	                              {u.cashback_percentage != null ? ` | CB: ${u.cashback_percentage}%` : ""}
  2389	                            </span>
  2390	                          )}
  2391	                        </td>
  2392	                        <td className="px-4 py-2.5">
  2393	                          <button
  2394	                            onClick={() => { setEditUserRefId(u.id); setEditUserRefPct(u.referral_percentage?.toString() || ""); setEditUserCbPct(u.cashback_percentage?.toString() || ""); }}
  2395	                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
  2396	                            title="Editar %"
  2397	                          >
  2398	                            <Edit3 className="w-3.5 h-3.5" />
  2399	                          </button>
  2400	                        </td>
  2401	                      </tr>
  2402	                    ))}
  2403	                  </tbody>
  2404	                </table>
  2405	                {(referralData.users || []).length === 0 && (
  2406	                  <div className="text-center py-8 text-gray-400 text-sm">Nenhum usuário encontrado</div>
  2407	                )}
  2408	              </div>
  2409	            )}
  2410	          </div>
  2411	        )}
  2412	
  2413	        {/* ── DATABASE TAB ── */}
  2414		        {tab === "database" && (
  2415		          <div className="space-y-6">
  2416		            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
  2417		              <div className="flex items-center gap-2 mb-4">
  2418		                <AlertTriangle className="w-5 h-5 text-amber-500" />
  2419		                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Exclusão em Cascata de Usuário</h3>
  2420		              </div>
  2421		              {deleteTargetUserId ? (
  2422		                <div className="space-y-4">
  2423		                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
  2424		                    O usuário <strong>{deleteTargetUsername}</strong> foi selecionado. Esta ação remove documentos, transações, sessões, presença e vínculos de indicação.
  2425		                  </div>
  2426		                  <div>
  2427		                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
  2428		                      Digite o username para confirmar exclusão de dados do usuário
  2429		                    </label>
  2430		                    <input
  2431		                      type="text"
  2432		                      value={deleteUserConfirm}
  2433		                      onChange={e => setDeleteUserConfirm(e.target.value)}
  2434		                      placeholder={deleteTargetUsername}
  2435		                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
  2436		                    />
  2437		                  </div>
  2438		                  <div className="flex gap-3">
  2439		                    <button
  2440		                      onClick={deleteUserData}
  2441		                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors"
  2442		                    >
  2443		                      Excluir Dados do Usuário
  2444		                    </button>
  2445		                    <button
  2446		                      onClick={() => {
  2447		                        const target = users.find(user => String(user.id) === String(deleteTargetUserId));
  2448		                        if (target) deleteUser(target);
  2449		                      }}
  2450		                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors"
  2451		                    >
  2452		                      Excluir Usuário Completo
  2453		                    </button>
  2454		                  </div>
  2455		                </div>
  2456		              ) : (
  2457		                <p className="text-sm text-gray-500 dark:text-gray-400">
  2458		                  Selecione um usuário na aba <strong>Usuários</strong> para abrir a exclusão em cascata nesta seção.
  2459		                </p>
  2460		              )}
  2461		            </div>
  2462		            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 p-5">
  2463	              <div className="flex items-center gap-2 mb-4">
  2464	                <AlertTriangle className="w-5 h-5 text-red-500" />
  2465	                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Excluir TODOS os Dados</h3>
  2466	              </div>
  2467	              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 mb-4">
  2468	                <p className="text-xs text-red-700 dark:text-red-400 font-semibold">
  2469	                  ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os documentos emitidos de todos os usuários serão permanentemente excluídos.
  2470	                </p>
  2471	              </div>
  2472	              <div className="space-y-3">
  2473	                <div>
  2474	                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
  2475	                    Digite <strong className="text-red-600">EXCLUIR TUDO</strong> para confirmar
  2476	                  </label>
  2477	                  <input
  2478	                    type="text"
  2479	                    value={deleteConfirm}
  2480	                    onChange={e => setDeleteConfirm(e.target.value)}
  2481	                    placeholder='Digite "EXCLUIR TUDO"'
  2482	                    className="w-full px-3 py-2 text-sm rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
  2483	                  />
  2484	                </div>
  2485	                <button
  2486	                  onClick={deleteAllData}
  2487	                  disabled={deleteConfirm !== "EXCLUIR TUDO"}
  2488	                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
  2489	                >
  2490	                  Excluir TODOS os Dados
  2491	                </button>
  2492	              </div>
  2493	            </div>
  2494	          </div>
  2495	        )}
  2496	
  2497	        {/* ── SETTINGS TAB ── */}
  2498	        {tab === "settings" && (
  2499	          <div className="space-y-6">
  2500	            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
  2501	              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Configurações Gerais</h3>
  2502	              <div className="space-y-4">
  2503	                {[
  2504	                  { key: "site_name", label: "Nome do Site", placeholder: "DocMaster" },
  2505	                  { key: "support_whatsapp", label: "WhatsApp de Suporte", placeholder: "5511999999999" },
  2506	                  { key: "max_documents_per_day", label: "Máx. Documentos por Dia", placeholder: "100" },
  2507	                ].map(({ key, label, placeholder }) => (
  2508	                  <div key={key}>
  2509	                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
  2510	                    <input
  2511	                      type="text"
  2512	                      value={settings[key as keyof typeof settings] as string}
  2513	                      onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
  2514	                      placeholder={placeholder}
  2515	                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  2516	                    />
  2517	                  </div>
  2518	                ))}
  2519	                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
  2520	                  <div>
  2521	                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo Manutenção</p>
  2522	                    <p className="text-xs text-gray-500 dark:text-gray-400">Bloqueia acesso de usuários não-admin</p>
  2523	                  </div>
  2524	                  <button
  2525	                    onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
  2526	                    className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenance_mode ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`}
  2527	                  >
  2528	                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? "translate-x-5" : ""}`} />
  2529	                  </button>
  2530	                </div>
  2531		                <button
  2532		                  disabled={settingsSaving}
  2533		                  onClick={saveSettingsPayload}
  2534		                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
  2535		                >
  2536	                  {settingsSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Configurações</>}
  2537	                </button>
  2538	              </div>
  2539	            </div>
  2540	
  2541	            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
  2542	              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Logo do Painel</h3>
  2543	              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
  2544	                Faça upload de uma nova logo para o painel. A imagem será usada na sidebar e na página de login.
  2545	              </p>
  2546	              <div className="flex items-center gap-4">
  2547	                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
  2548	                  <img src="/assets/logo-icon.png" alt="Logo atual" className="w-16 h-16 object-contain" />
  2549	                </div>
  2550	                <div className="flex-1">
  2551	                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
  2552	                    <Save className="w-4 h-4" />
  2553	                    Escolher Arquivo
  2554	                    <input
  2555	                      type="file"
  2556	                      accept="image/*"
  2557	                      className="hidden"
  2558	                      onChange={(e) => {
  2559	                        const file = e.target.files?.[0];
  2560	                        if (file) {
  2561	                          toast.info(`Logo "${file.name}" selecionada. Funcionalidade de upload será implementada com R2 Storage.`);
  2562	                        }
  2563	                      }}
  2564	                    />
  2565	                  </label>
  2566	                  <p className="text-[10px] text-gray-400 mt-2">PNG, JPG ou WebP. Máximo 2MB.</p>
  2567	                </div>
  2568	              </div>
  2569	            </div>
  2570	
  2571	            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
  2572	              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Exclusão Automática de Documentos</h3>
  2573	              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
  2574	                Configure o período de retenção (em dias) para cada tipo de documento. Após esse período, os documentos serão excluídos automaticamente.
  2575	              </p>
  2576		              <div className="space-y-3">
  2577	                {[
  2578	                  { key: "auto_delete_atestado", label: "Atestados", defaultVal: "60" },
  2579	                  { key: "auto_delete_receita", label: "Receitas (Dr. Consulta)", defaultVal: "60" },
  2580	                  { key: "auto_delete_cnh", label: "CNH Digital", defaultVal: "365" },
  2581	                  { key: "auto_delete_cha", label: "CHA Náutica", defaultVal: "60" },
  2582	                  { key: "auto_delete_toxicologico", label: "Toxicológico", defaultVal: "60" },
  2583	                  { key: "auto_delete_historico", label: "Históricos Escolares", defaultVal: "90" },
  2584	                ].map(({ key, label, defaultVal }) => (
  2585	                  <div key={key} className="flex items-center gap-3">
  2586	                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 w-48 flex-shrink-0">{label}</label>
  2587	                    <input
  2588	                      type="number"
  2589	                      min="1"
  2590	                      max="3650"
  2591	                      value={(settings as any)[key] || defaultVal}
  2592	                      onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
  2593	                      className="w-24 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
  2594	                    />
  2595	                    <span className="text-xs text-gray-400">dias</span>
  2596	                  </div>
  2597	                ))}
  2598		              </div>
  2599		              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
  2600		                <button
  2601		                  onClick={saveSettingsPayload}
  2602		                  className="py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors"
  2603		                >
  2604		                  Salvar Configurações de Exclusão
  2605		                </button>
  2606		                <button
  2607		                  onClick={runCleanupNow}
  2608		                  disabled={cleanupRunning}
  2609		                  className="py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
  2610		                >
  2611		                  {cleanupRunning ? "Executando limpeza..." : "Executar Limpeza Agora"}
  2612		                </button>
  2613		              </div>
  2614		              <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
  2615		                <div className="flex items-center justify-between gap-3 mb-3">
  2616		                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Prévia da limpeza</p>
  2617		                  <button onClick={loadCleanupPreview} className="p-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
  2618		                    <RefreshCw className="w-3.5 h-3.5" />
  2619		                  </button>
  2620		                </div>
  2621		                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
  2622		                  {cleanupPreview?.pendingDeletion && Object.entries(cleanupPreview.pendingDeletion).map(([key, value]) => (
  2623		                    <div key={key} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
  2624		                      <p className="text-gray-400 uppercase">{key}</p>
  2625		                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{String(value)}</p>
  2626		                    </div>
  2627		                  ))}
  2628		                </div>
  2629		                <p className="text-[11px] text-gray-400 mt-3">
  2630		                  A prévia considera a data de emissão real (`data_emissao`) por tipo de documento.
  2631		                </p>
  2632		              </div>
  2633		            </div>
  2634	          </div>
  2635	        )}
  2636	      </div>
  2637	
  2638		      {/* User Detail Modal */}
  2639		      {userDetailOpen && selectedUser && (
  2640		        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  2641		          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
  2642		            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
  2643		              <div>
  2644		                <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser.username}</h3>
  2645	                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
  2646	              </div>
  2647	              <button onClick={() => setUserDetailOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
  2648	                <X className="w-4 h-4 text-gray-500" />
  2649	              </button>
  2650	            </div>
  2651	            <div className="p-5 overflow-y-auto flex-1">
  2652	              <div className="grid grid-cols-2 gap-3 mb-5">
  2653	                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3">
  2654	                  <p className="text-xs text-gray-500 dark:text-gray-400">Saldo</p>
  2655	                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
  2656	                    R$ {(selectedUser.balance / 100).toFixed(2).replace(".", ",")}
  2657	                  </p>
  2658	                </div>
  2659		                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
  2660		                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
  2661		                  <p className={`text-sm font-bold ${selectedUser.is_active ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
  2662		                    {selectedUser.is_active ? "Ativo" : "Inativo"}
  2663		                  </p>
  2664		                </div>
  2665		                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3">
  2666		                  <p className="text-xs text-gray-500 dark:text-gray-400">Documentos</p>
  2667		                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{userDetails?.summary?.total_documents || userHistory.length}</p>
  2668		                </div>
  2669		                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3">
  2670		                  <p className="text-xs text-gray-500 dark:text-gray-400">Transações</p>
  2671		                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{userDetails?.summary?.total_transactions || 0}</p>
  2672		                </div>
  2673		              </div>
  2674		              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Histórico de Emissões</h4>
  2675		              {userHistory.length === 0 ? (
  2676		                <p className="text-sm text-gray-400 text-center py-6">Nenhuma emissão registrada</p>
  2677		              ) : (
  2678	                <div className="space-y-2">
  2679	                  {userHistory.map((h: any, i: number) => (
  2680	                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
  2681	                      <div>
  2682	                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{h.paciente || h.nome || "—"}</p>
  2683	                        <p className="text-xs text-gray-500 dark:text-gray-400">{h.type || "atestado"} · {formatDate(h.created_at)}</p>
  2684	                      </div>
  2685	                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold">
  2686	                        {h.status || "emitido"}
  2687	                      </span>
  2688	                    </div>
  2689		                  ))}
  2690		                </div>
  2691		              )}
  2692		              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 mt-6">Transações</h4>
  2693		              {(userDetails?.transactions || []).length === 0 ? (
  2694		                <p className="text-sm text-gray-400 text-center py-4">Nenhuma transação registrada</p>
  2695		              ) : (
  2696		                <div className="space-y-2">
  2697		                  {userDetails.transactions.slice(0, 8).map((tx: any) => (
  2698		                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
  2699		                      <div>
  2700		                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.description || tx.type}</p>
  2701		                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</p>
  2702		                      </div>
  2703		                      <span className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
  2704		                        {tx.type === "credit" ? "+" : "-"}R$ {((tx.amount || 0) / 100).toFixed(2)}
  2705		                      </span>
  2706		                    </div>
  2707		                  ))}
  2708		                </div>
  2709		              )}
  2710		              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 mt-6">Indicações</h4>
  2711		              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  2712		                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
  2713		                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Como indicador</p>
  2714		                  {(userDetails?.referrals?.as_referrer || []).length === 0 ? (
  2715		                    <p className="text-sm text-gray-400">Nenhum indicado.</p>
  2716		                  ) : (
  2717		                    <div className="space-y-2">
  2718		                      {userDetails.referrals.as_referrer.slice(0, 5).map((item: any) => (
  2719		                        <div key={item.id} className="flex items-center justify-between text-xs">
  2720		                          <span className="text-gray-700 dark:text-gray-200">{item.referred_username}</span>
  2721		                          <span className="text-green-600 font-semibold">R$ {((item.total_earned || 0) / 100).toFixed(2)}</span>
  2722		                        </div>
  2723		                      ))}
  2724		                    </div>
  2725		                  )}
  2726		                </div>
  2727		                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
  2728		                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Como indicado</p>
  2729		                  {(userDetails?.referrals?.as_referred || []).length === 0 ? (
  2730		                    <p className="text-sm text-gray-400">Nenhum indicador vinculado.</p>
  2731		                  ) : (
  2732		                    <div className="space-y-2">
  2733		                      {userDetails.referrals.as_referred.slice(0, 5).map((item: any) => (
  2734		                        <div key={item.id} className="flex items-center justify-between text-xs">
  2735		                          <span className="text-gray-700 dark:text-gray-200">{item.referrer_username}</span>
  2736		                          <span className="text-gray-400">{item.status}</span>
  2737		                        </div>
  2738		                      ))}
  2739		                    </div>
  2740		                  )}
  2741		                </div>
  2742		              </div>
  2743		            </div>
  2744		          </div>
  2745		        </div>
  2746		      )}
  2747	
  2748		      {balanceModalUser && (
  2749		        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBalanceModalUser(null)}>
  2750		          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
  2751		            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Ajustar saldo</h3>
  2752		            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Usuário: {balanceModalUser.username}</p>
  2753		            <div className="flex gap-2 mb-4">
  2754		              <button onClick={() => setBalanceModalType("credit")} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${balanceModalType === "credit" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>Crédito</button>
  2755		              <button onClick={() => setBalanceModalType("debit")} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${balanceModalType === "debit" ? "bg-red-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>Débito</button>
  2756		            </div>
  2757		            <input
  2758		              type="number"
  2759		              min="0"
  2760		              step="0.01"
  2761		              value={balanceModalValue}
  2762		              onChange={e => setBalanceModalValue(e.target.value)}
  2763		              placeholder="Valor em R$"
  2764		              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
  2765		            />
  2766		            <div className="flex gap-3 mt-4">
  2767		              <button onClick={() => setBalanceModalUser(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold">Cancelar</button>
  2768		              <button onClick={submitBalanceAdjustment} disabled={savingBalance} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
  2769		                {savingBalance ? "Salvando..." : "Confirmar"}
  2770		              </button>
  2771		            </div>
  2772		          </div>
  2773		        </div>
  2774		      )}
  2775	
  2776		      {hardDeleteUser && (
  2777		        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setHardDeleteUser(null)}>
  2778		          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl p-6" onClick={e => e.stopPropagation()}>
  2779		            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Excluir usuário definitivamente</h3>
  2780		            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
  2781		              Esta exclusão é em cascata e remove documentos, transações, sessões, dados de presença e vínculos de indicação de <strong>{hardDeleteUser.username}</strong>.
  2782		            </p>
  2783		            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
  2784		              <input type="checkbox" checked={hardDeleteConfirmChecked} onChange={e => setHardDeleteConfirmChecked(e.target.checked)} />
  2785		              Confirmo que desejo excluir todos os dados em cascata
  2786		            </label>
  2787		            <input
  2788		              type="text"
  2789		              value={hardDeleteConfirmText}
  2790		              onChange={e => setHardDeleteConfirmText(e.target.value)}
  2791		              placeholder='Digite EXCLUIR'
  2792		              className="w-full px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
  2793		            />
  2794		            <div className="flex gap-3 mt-4">
  2795		              <button onClick={() => setHardDeleteUser(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold">Cancelar</button>
  2796		              <button
  2797		                disabled={!hardDeleteConfirmChecked || hardDeleteConfirmText !== "EXCLUIR"}
  2798		                onClick={async () => {
  2799		                  try {
  2800		                    const res = await fetch(`/api/admin/users/${hardDeleteUser.id}/delete`, {
  2801		                      method: "POST",
  2802		                      headers: { "Content-Type": "application/json" },
  2803		                      credentials: "include",
  2804		                      body: JSON.stringify({ confirm: true, confirmation_text: "EXCLUIR" }),
  2805		                    });
  2806		                    const data = await res.json();
  2807		                    if (data.success) {
  2808		                      toast.success("Usuário excluído com sucesso");
  2809		                      setHardDeleteUser(null);
  2810		                      loadUsers(showPasswords);
  2811		                    } else {
  2812		                      toast.error(data.error || "Erro ao excluir usuário");
  2813		                    }
  2814		                  } catch {
  2815		                    toast.error("Erro de conexão");
  2816		                  }
  2817		                }}
  2818		                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
  2819		              >
  2820		                Excluir em cascata
  2821		              </button>
  2822		            </div>
  2823		          </div>
  2824		        </div>
  2825		      )}
  2826	
  2827		      {emissionPreview && (
  2828		        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEmissionPreview(null)}>
  2829		          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
  2830		            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
  2831		              <div>
  2832		                <h3 className="font-bold text-gray-900 dark:text-white">Visualizar emissão</h3>
  2833		                <p className="text-xs text-gray-500 dark:text-gray-400">{emissionPreview.emission?.id}</p>
  2834		              </div>
  2835		              <button onClick={() => setEmissionPreview(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
  2836		                <X className="w-4 h-4 text-gray-500" />
  2837		              </button>
  2838		            </div>
  2839		            <div className="p-4 overflow-auto flex-1 bg-gray-100 dark:bg-gray-950">
  2840		              {emissionPreviewLoading ? (
  2841		                <div className="flex items-center justify-center py-12">
  2842		                  <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
  2843		                </div>
  2844		              ) : emissionPreview.document_type === "atestado" ? (
  2845		                <div className="flex justify-center">
  2846		                  <AttestationDocument data={buildAttestationPreviewData(emissionPreview.payload)} />
  2847		                </div>
  2848		              ) : (
  2849		                <pre className="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
  2850		                  {JSON.stringify(emissionPreview.payload || emissionPreview.document, null, 2)}
  2851		                </pre>
  2852		              )}
  2853		            </div>
  2854		          </div>
  2855		        </div>
  2856		      )}
  2857	
  2858	      {/* Confirmation Modal */}
  2859	      {confirmModal.open && (
  2860	        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  2861	          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl p-6">
  2862	            <div className="flex items-center gap-3 mb-4">
  2863	              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
  2864	                confirmModal.type === "danger" ? "bg-red-100 dark:bg-red-900/20" :
  2865	                confirmModal.type === "warning" ? "bg-amber-100 dark:bg-amber-900/20" :
  2866	                "bg-blue-100 dark:bg-blue-900/20"
  2867	              }`}>
  2868	                <AlertTriangle className={`w-5 h-5 ${
  2869	                  confirmModal.type === "danger" ? "text-red-500" :
  2870	                  confirmModal.type === "warning" ? "text-amber-500" :
  2871	                  "text-blue-500"
  2872	                }`} />
  2873	              </div>
  2874	              <h3 className="font-bold text-gray-900 dark:text-white">{confirmModal.title}</h3>
  2875	            </div>
  2876	            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{confirmModal.message}</p>
  2877	            <div className="flex gap-3">
  2878	              <button
  2879	                onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
  2880	                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
  2881	              >
  2882	                Cancelar
  2883	              </button>
  2884	              <button
  2885	                onClick={confirmModal.onConfirm}
  2886	                className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-sm transition-colors ${
  2887	                  confirmModal.type === "danger" ? "bg-red-500 hover:bg-red-600" :
  2888	                  confirmModal.type === "warning" ? "bg-amber-500 hover:bg-amber-600" :
  2889	                  "bg-blue-500 hover:bg-blue-600"
  2890	                }`}
  2891	              >
  2892	                Confirmar
  2893	              </button>
  2894	            </div>
  2895	          </div>
  2896	        </div>
  2897	      )}
  2898	    </DashboardLayout>
  2899	  );
  2900	}
  2901	