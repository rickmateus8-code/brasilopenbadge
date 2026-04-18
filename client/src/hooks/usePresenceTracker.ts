import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';

const SESSION_STORAGE_KEY = 'docmaster_presence_session_id';

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return `server-${Date.now()}`;
  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return stored;
  const next = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `presence-${Date.now()}`;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function describeAction(pathname: string) {
  const page = pathname.toLowerCase();
  if (page.includes('/admin')) return 'no painel admin';
  if (page.includes('/atestado/editar')) return 'editando atestado';
  if (page.includes('/atestado') || page.includes('/atestadocria')) return 'criando atestado';
  if (page.includes('/receita/editar')) return 'editando receita';
  if (page.includes('/receita') || page.includes('/receitacria')) return 'criando receita';
  if (page.includes('/cnh/editar')) return 'editando cnh';
  if (page.includes('/cnh')) return 'criando cnh';
  if (page.includes('/cha/editar')) return 'editando cha';
  if (page.includes('/cha')) return 'criando cha';
  if (page.includes('/toxicologico/editar')) return 'editando toxicológico';
  if (page.includes('/toxicologico')) return 'criando toxicológico';
  if (page.includes('/historico-sp')) return 'criando histórico sp';
  if (page.includes('/historico-uninter')) return 'criando histórico uninter';
  if (page.includes('/extrato')) return 'consultando extrato';
  if (page.includes('/recargas')) return 'realizando recarga';
  if (page.includes('/indicacoes')) return 'consultando indicações';
  if (page.includes('/configuracoes')) return 'ajustando configurações';
  if (page.includes('/dashboard')) return 'navegando no dashboard';
  return 'navegando';
}

function shouldTrack(pathname: string) {
  if (!pathname) return false;
  return !pathname.startsWith('/login') && !pathname.startsWith('/register');
}

export function usePresenceTracker() {
  const [location] = useLocation();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const currentPathRef = useRef(location);
  const currentActionRef = useRef(describeAction(location));

  useEffect(() => {
    currentPathRef.current = location;
    currentActionRef.current = describeAction(location);
  }, [location]);

  useEffect(() => {
    if (!shouldTrack(location)) return;

    const sendPresence = (keepalive = false) => {
      const payload = {
        session_id: sessionId,
        current_page: currentPathRef.current,
        current_action: currentActionRef.current,
        timestamp: new Date().toISOString(),
        meta: {
          title: typeof document !== 'undefined' ? document.title : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        },
      };

      try {
        fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive,
          body: JSON.stringify(payload),
        }).catch(() => undefined);
      } catch {
        return undefined;
      }
    };

    sendPresence();
    const interval = window.setInterval(() => sendPresence(), 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPresence();
      } else {
        sendPresence(true);
      }
    };

    const handleBeforeUnload = () => sendPresence(true);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendPresence(true);
    };
  }, [location, sessionId]);
}
