/**
 * Hook para ler configurações do sistema do painel admin.
 * Lê o auto_delete_days do banco via API e disponibiliza para os componentes.
 * Cache de 5 minutos para evitar requisições excessivas.
 */
import { useState, useEffect } from "react";

interface SystemSettings {
  site_name: string;
  support_whatsapp: string;
  max_documents_per_day: string;
  auto_delete_days: string;
  maintenance_mode: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  site_name: "DocMaster",
  support_whatsapp: "",
  max_documents_per_day: "100",
  auto_delete_days: "60",
  maintenance_mode: false,
};

// Cache simples em memória
let cachedSettings: SystemSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(cachedSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    const now = Date.now();
    // Usar cache se ainda válido
    if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/admin/settings")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ success: boolean; settings: SystemSettings }>;
      })
      .then((data) => {
        if (!cancelled && data.success && data.settings) {
          cachedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
          cacheTimestamp = Date.now();
          setSettings(cachedSettings);
        }
      })
      .catch(() => {
        // Silently fall back to defaults on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return {
    settings,
    loading,
    /** Número de dias de validade dos documentos (lido do banco) */
    validityDays: parseInt(settings.auto_delete_days, 10) || 60,
  };
}
