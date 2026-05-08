import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Hook que envia heartbeat de presença a cada 30 segundos.
 * Rastreia a página atual e a ação em andamento do usuário.
 */
export function useHeartbeat() {
  const [location] = useLocation();
  const locationRef = useRef(location);
  const actionRef = useRef("navegando");

  useEffect(() => {
    locationRef.current = location;

    // Determine action based on page
    const page = location.toLowerCase();
    if (page.includes("cria") || page.includes("atestado") || page.includes("receita")) {
      if (page.includes("cria")) {
        actionRef.current = "emitindo documento";
      } else {
        actionRef.current = "visualizando formulário";
      }
    } else if (page.includes("admin")) {
      actionRef.current = "no painel admin";
    } else if (page.includes("dashboard")) {
      actionRef.current = "navegando";
    } else if (page.includes("extrato")) {
      actionRef.current = "consultando extrato";
    } else if (page.includes("recarga")) {
      actionRef.current = "realizando recarga";
    } else if (page.includes("config")) {
      actionRef.current = "nas configurações";
    } else {
      actionRef.current = "navegando";
    }
  }, [location]);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            current_page: locationRef.current,
            current_action: actionRef.current,
          }),
        });
      } catch {
        // Silently fail - heartbeat is non-critical
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, []);
}
