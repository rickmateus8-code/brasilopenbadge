import { useEffect } from "react";
import { useLocation } from "wouter";
import { queueRecarregaModalOpen } from "@/components/RecarregaModal";

export default function Recargas() {
  const [, navigate] = useLocation();

  useEffect(() => {
    queueRecarregaModalOpen();
    navigate("/dashboard");
  }, [navigate]);

  return null;
}
