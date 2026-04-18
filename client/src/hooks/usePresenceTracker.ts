     1	import { useEffect, useMemo, useRef } from 'react';
     2	import { useLocation } from 'wouter';
     3	
     4	const SESSION_STORAGE_KEY = 'docmaster_presence_session_id';
     5	
     6	function getOrCreateSessionId() {
     7	  if (typeof window === 'undefined') return `server-${Date.now()}`;
     8	  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
     9	  if (stored) return stored;
    10	  const next = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `presence-${Date.now()}`;
    11	  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    12	  return next;
    13	}
    14	
    15	function describeAction(pathname: string) {
    16	  const page = pathname.toLowerCase();
    17	  if (page.includes('/admin')) return 'no painel admin';
    18	  if (page.includes('/atestado/editar')) return 'editando atestado';
    19	  if (page.includes('/atestado') || page.includes('/atestadocria')) return 'criando atestado';
    20	  if (page.includes('/receita/editar')) return 'editando receita';
    21	  if (page.includes('/receita') || page.includes('/receitacria')) return 'criando receita';
    22	  if (page.includes('/cnh/editar')) return 'editando cnh';
    23	  if (page.includes('/cnh')) return 'criando cnh';
    24	  if (page.includes('/cha/editar')) return 'editando cha';
    25	  if (page.includes('/cha')) return 'criando cha';
    26	  if (page.includes('/toxicologico/editar')) return 'editando toxicológico';
    27	  if (page.includes('/toxicologico')) return 'criando toxicológico';
    28	  if (page.includes('/historico-sp')) return 'criando histórico sp';
    29	  if (page.includes('/historico-uninter')) return 'criando histórico uninter';
    30	  if (page.includes('/extrato')) return 'consultando extrato';
    31	  if (page.includes('/recargas')) return 'realizando recarga';
    32	  if (page.includes('/indicacoes')) return 'consultando indicações';
    33	  if (page.includes('/configuracoes')) return 'ajustando configurações';
    34	  if (page.includes('/dashboard')) return 'navegando no dashboard';
    35	  return 'navegando';
    36	}
    37	
    38	function shouldTrack(pathname: string) {
    39	  if (!pathname) return false;
    40	  return !pathname.startsWith('/login') && !pathname.startsWith('/register');
    41	}
    42	
    43	export function usePresenceTracker() {
    44	  const [location] = useLocation();
    45	  const sessionId = useMemo(() => getOrCreateSessionId(), []);
    46	  const currentPathRef = useRef(location);
    47	  const currentActionRef = useRef(describeAction(location));
    48	
    49	  useEffect(() => {
    50	    currentPathRef.current = location;
    51	    currentActionRef.current = describeAction(location);
    52	  }, [location]);
    53	
    54	  useEffect(() => {
    55	    if (!shouldTrack(location)) return;
    56	
    57	    const sendPresence = (keepalive = false) => {
    58	      const payload = {
    59	        session_id: sessionId,
    60	        current_page: currentPathRef.current,
    61	        current_action: currentActionRef.current,
    62	        timestamp: new Date().toISOString(),
    63	        meta: {
    64	          title: typeof document !== 'undefined' ? document.title : '',
    65	          referrer: typeof document !== 'undefined' ? document.referrer : '',
    66	        },
    67	      };
    68	
    69	      try {
    70	        fetch('/api/heartbeat', {
    71	          method: 'POST',
    72	          headers: { 'Content-Type': 'application/json' },
    73	          credentials: 'include',
    74	          keepalive,
    75	          body: JSON.stringify(payload),
    76	        }).catch(() => undefined);
    77	      } catch {
    78	        return undefined;
    79	      }
    80	    };
    81	
    82	    sendPresence();
    83	    const interval = window.setInterval(() => sendPresence(), 30000);
    84	
    85	    const handleVisibilityChange = () => {
    86	      if (document.visibilityState === 'visible') {
    87	        sendPresence();
    88	      } else {
    89	        sendPresence(true);
    90	      }
    91	    };
    92	
    93	    const handleBeforeUnload = () => sendPresence(true);
    94	
    95	    document.addEventListener('visibilitychange', handleVisibilityChange);
    96	    window.addEventListener('beforeunload', handleBeforeUnload);
    97	
    98	    return () => {
    99	      window.clearInterval(interval);
   100	      document.removeEventListener('visibilitychange', handleVisibilityChange);
   101	      window.removeEventListener('beforeunload', handleBeforeUnload);
   102	      sendPresence(true);
   103	    };
   104	  }, [location, sessionId]);
   105	}
   106	