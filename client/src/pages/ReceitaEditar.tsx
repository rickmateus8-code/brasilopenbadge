/**
 * ReceitaEditar — Edição de Receituário Médico (Dr. Consulta)
 *
 * Regras:
 * - CPF BLOQUEADO após emissão (segurança)
 * - Sem cobrança de saldo na edição
 * - Preview em tempo real com PrescricaoDocument
 * - Salva via PUT /api/receitas/:id
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import PrescricaoDocument from "@/components/PrescricaoDocument";
import type { PrescricaoItem, Medicamento } from "@/components/PrescricaoDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Máscaras ────────────────────────────────────────────────────────────────
function handleDateInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type TipoReceituario = "simples" | "controle_especial" | "antimicrobiano";

// ─── Componente ──────────────────────────────────────────────────────────────
export default function ReceitaEditar() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const previewRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Assinatura
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureImage, setSignatureImage] = useState("");
  const signatureRef = useRef<HTMLInputElement>(null);

  // CPF original (bloqueado)
  const [cpfOriginal, setCpfOriginal] = useState("");
  const [codigoQR, setCodigoQR] = useState("");

  // Tipo
  const [tipoReceituario, setTipoReceituario] = useState<TipoReceituario>("controle_especial");

  // Formulário
  const [form, setForm] = useState({
    unidade: "",
    enderecoEmitente: "",
    cnpjEmitente: "",
    telefoneEmitente: "",
    siteEmitente: "",
    medico: "",
    crm: "",
    especialidade: "",
    paciente: "",
    identidade: "",
    endereco: "",
    telefone: "",
    cidade: "",
    dataEmissao: "",
    horaEmissao: "",
    logoUrl: "",
  });

  // Prescrição
  const [prescricao, setPrescricao] = useState<PrescricaoItem[]>([
    { numero: 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" },
  ]);

  // ── Carregar dados da receita ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/receitas/${id}`, { credentials: "include" });
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const json = await res.json();
        const d = json.data || json;
        if (!d || !d.id) { setNotFound(true); setLoading(false); return; }

        // CPF bloqueado
        setCpfOriginal(d.cpf || "");
        setCodigoQR(d.codigo_qr || d.codigoQR || "");
        setSignatureColor(d.signature_color || d.signatureColor || "#0b109f");
        setSignatureImage(d.signature_image || d.signatureImage || "");
        setTipoReceituario((d.tipo_receituario || "controle_especial") as TipoReceituario);

        setForm({
          unidade: d.unidade || d.instituicao || "",
          enderecoEmitente: d.endereco_emitente || d.enderecoEmitente || "",
          cnpjEmitente: d.cnpj_emitente || d.cnpjEmitente || "14.245.016/0059-95",
          telefoneEmitente: d.telefone_emitente || d.telefoneEmitente || "4090-1510",
          siteEmitente: d.site_emitente || d.siteEmitente || "www.drconsulta.com",
          medico: d.medico || "",
          crm: d.crm || "",
          especialidade: d.especialidade || "",
          paciente: d.paciente || "",
          identidade: d.identidade || "",
          endereco: d.endereco || "",
          telefone: d.telefone || "",
          cidade: d.cidade || "",
          dataEmissao: d.data_emissao || d.dataEmissao || "",
          horaEmissao: d.hora_emissao || d.horaEmissao || "",
          logoUrl: d.logo_url || d.logoUrl || "/logos/drconsulta.png",
        });

        // Parse prescrição
        let presc: PrescricaoItem[] = [];
        try {
          const raw = typeof d.prescricao === "string" ? JSON.parse(d.prescricao) : d.prescricao;
          if (Array.isArray(raw) && raw.length > 0) {
            presc = raw.map((item: any, idx: number) => ({
              numero: idx + 1,
              uso_interno: item.uso_interno !== undefined ? item.uso_interno : (item.uso_tipo === "interno"),
              medicamento: item.medicamento || item.nome || "",
              quantidade: item.quantidade || "",
              modo_uso: item.modo_uso || item.posologia || "",
            }));
          }
        } catch {}
        if (presc.length === 0) {
          presc = [{ numero: 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" }];
        }
        setPrescricao(presc);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Auto-download quando vem de "Baixar PDF" nos Salvos ───────────────────
  useEffect(() => {
    if (loading || notFound) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("download") === "1" && previewRef.current) {
      const timer = setTimeout(async () => {
        try {
          const filename = generatePDFFilename(form.paciente || "RECEITA", "receita");
          await exportElementToPDF(previewRef.current!, { filename, scale: 2, quality: 0.92, multiPage: true });
        } catch (err) {
          console.error("Auto-download falhou:", err);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, notFound]);

  // ── Salvar edição ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      const prescricaoValida = prescricao.filter(p => p.medicamento.trim());
      const payload = {
        tipo_receituario: tipoReceituario,
        paciente: form.paciente.toUpperCase(),
        identidade: form.identidade || null,
        endereco: form.endereco || null,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        medico: form.medico.toUpperCase(),
        crm: form.crm,
        especialidade: form.especialidade.toUpperCase(),
        instituicao: form.unidade || null,
        endereco_emitente: form.enderecoEmitente || null,
        cnpj_emitente: form.cnpjEmitente || null,
        telefone_emitente: form.telefoneEmitente || null,
        site_emitente: form.siteEmitente || null,
        prescricao: prescricaoValida.map(p => ({
          uso_tipo: p.uso_interno ? "interno" : "externo",
          nome: p.medicamento,
          quantidade: p.quantidade,
          posologia: p.modo_uso,
        })),
        data_emissao: form.dataEmissao,
        hora_emissao: form.horaEmissao,
        logo_url: form.logoUrl,
        signature_color: signatureColor,
        signature_image: signatureImage,
      };

      const res = await fetch(`/api/receitas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erro ao salvar");
      setSavedMsg("Receita atualizada com sucesso!");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (error) {
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Download PDF ───────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const filename = generatePDFFilename(form.paciente || "RECEITA", "receita");
      await exportElementToPDF(previewRef.current, { filename, scale: 2, quality: 0.92, multiPage: true });
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  // ── Upload assinatura ──────────────────────────────────────────────────────
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSignatureImage(await readFileAsBase64(file));
  };

  // ── Prescrição helpers ─────────────────────────────────────────────────────
  const addMedicamento = () => setPrescricao(p => [...p, { numero: p.length + 1, uso_interno: true, medicamento: "", quantidade: "", modo_uso: "" }]);
  const removeMedicamento = (idx: number) => setPrescricao(p => p.filter((_, i) => i !== idx).map((item, i) => ({ ...item, numero: i + 1 })));
  const updateMedicamento = (idx: number, field: keyof PrescricaoItem, value: any) => setPrescricao(p => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  // ── Estilos ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: isDark ? "#1e293b" : "#fff", borderRadius: 10, boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.08)", padding: "14px 16px", marginBottom: 12, border: isDark ? "1px solid #334155" : "none" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: isDark ? "#60a5fa" : "#005CA9", borderBottom: isDark ? "2px solid #3b82f6" : "2px solid #005CA9", paddingBottom: 5, marginBottom: 10 };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: isDark ? "#cbd5e1" : "#000", marginBottom: 3 };
  const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", border: isDark ? "1px solid #475569" : "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: isDark ? "#e2e8f0" : "#000", background: isDark ? "#0f172a" : "#fff" };
  const sel: React.CSSProperties = { ...inp, background: isDark ? "#0f172a" : "#fff" };
  const btnBlue: React.CSSProperties = { background: "#005CA9", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 0.5 };
  const btnGreen: React.CSSProperties = { background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" };
  const btnGray: React.CSSProperties = { background: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#e2e8f0" : "#000", border: isDark ? "1px solid #475569" : "1px solid #cbd5e1", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" };
  const btnRed: React.CSSProperties = { background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" };

  // ── Preview data ───────────────────────────────────────────────────────────
  const previewData = {
    tipo_receituario: tipoReceituario,
    logo_url: form.logoUrl || "/logos/drconsulta.png",
    nome_unidade: form.unidade || "UNIDADE DR. CONSULTA",
    cnpj_emitente: form.cnpjEmitente || undefined,
    endereco_emitente: form.enderecoEmitente || undefined,
    telefone_emitente: form.telefoneEmitente || undefined,
    site_emitente: form.siteEmitente || undefined,
    paciente_nome: form.paciente || "NOME DO PACIENTE",
    paciente_cpf: cpfOriginal || undefined,
    paciente_identidade: form.identidade || undefined,
    paciente_endereco: form.endereco || undefined,
    paciente_telefone: form.telefone || undefined,
    paciente_cidade: form.cidade || undefined,
    medico_nome: form.medico || "NOME DO MÉDICO",
    medico_crm: form.crm || "000000",
    medico_uf: (() => { const m = form.crm.match(/CRM\/(\w+)/); return m ? m[1] : "SP"; })(),
    medico_especialidade: form.especialidade || undefined,
    medico_assinatura_url: signatureImage || undefined,
    signature_color: signatureColor,
    medicamentos: prescricao.filter(p => p.medicamento.trim()).map(p => ({
      uso_tipo: p.uso_interno ? "interno" as const : "externo" as const,
      nome: p.medicamento, quantidade: p.quantidade, posologia: p.modo_uso,
    })),
    data_emissao: form.dataEmissao || "DD/MM/AAAA",
    codigo_qr: codigoQR || undefined,
    qr_code_url: codigoQR ? `https://verificamed.digital/verificar/receita/${codigoQR}` : undefined,
  };

  // ── Loading / Not Found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #005CA9", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 14 }}>Carregando receita...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📋</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Receita não encontrada</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>A receita solicitada não existe ou você não tem permissão.</p>
          <button style={btnBlue} onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#0f172a" : "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif", color: isDark ? "#e2e8f0" : "#1e293b" }}>

      {/* Header */}
      <div style={{ background: "#005CA9", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Editar Receita Médica</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnGreen, fontSize: 11, padding: "6px 14px" }} onClick={handleDownloadPdf}>BAIXAR PDF</button>
          <button
            style={{ ...btnBlue, fontSize: 11, padding: "6px 14px", background: "#fff", color: "#005CA9", opacity: saving ? 0.7 : 1 }}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
          </button>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {savedMsg && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 20px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
          {savedMsg}
        </div>
      )}

      {/* Aviso CPF bloqueado */}
      <div style={{ background: "#fef3c7", color: "#92400e", padding: "8px 20px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #fbbf24" }}>
        <strong>Segurança:</strong> O CPF do paciente não pode ser alterado após a emissão do documento.
      </div>

      <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 2000, margin: "0 auto" }}>
        {/* ═══ COLUNA ESQUERDA — FORMULÁRIO ═══ */}
        <div style={{ width: 520, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>

          {/* CPF Bloqueado */}
          <div style={card}>
            <div style={secTitle}>CPF {cpfOriginal || "do Paciente"}</div>
            <div style={{
              background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6,
              padding: "8px 12px", fontSize: 14, fontWeight: 700, color: "#6b7280",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {cpfOriginal || "CPF não registrado"}
            </div>
            <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
              Por segurança, o CPF é bloqueado após emissão e não pode ser editado.
            </p>
          </div>

          {/* Tipo de Receituário */}
          <div style={card}>
            <div style={secTitle}>Tipo de Receituário</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {([
                { value: "simples", label: "Simples", desc: "Branco", color: "#374151" },
                { value: "controle_especial", label: "Controle Especial", desc: "2 vias — Retenção", color: "#92400e" },
                { value: "antimicrobiano", label: "Antimicrobiano", desc: "Notificação", color: "#1e40af" },
              ] as const).map(t => (
                <button key={t.value} type="button" onClick={() => setTipoReceituario(t.value)}
                  style={{
                    padding: "10px 8px", borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: "pointer", textAlign: "center",
                    border: tipoReceituario === t.value ? `2px solid ${t.color}` : "2px solid #d1d5db",
                    background: tipoReceituario === t.value ? `${t.color}15` : "#f8fafc",
                    color: tipoReceituario === t.value ? t.color : "#374151",
                  }}>
                  <div style={{ marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 400, color: "#6b7280" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dados do Paciente */}
          <div style={card}>
            <div style={secTitle}>Dados do Paciente</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <label style={lbl}>Nome Completo</label>
                <input style={inp} value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value.toUpperCase() }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>RG / Identidade</label>
                  <input style={inp} value={form.identidade} onChange={e => setForm(p => ({ ...p, identidade: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Telefone</label>
                  <input style={inp} value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Cidade</label>
                  <input style={inp} value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label style={lbl}>Endereço</label>
                  <input style={inp} value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Médico */}
          <div style={card}>
            <div style={secTitle}>Dados do Médico</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>Nome do Médico</label>
                  <input style={inp} value={form.medico} onChange={e => setForm(p => ({ ...p, medico: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label style={lbl}>CRM</label>
                  <input style={inp} value={form.crm} onChange={e => setForm(p => ({ ...p, crm: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Especialidade</label>
                <input style={inp} value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value.toUpperCase() }))} />
              </div>
            </div>

            {/* Assinatura */}
            <div style={{ marginTop: 10, borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Assinatura do Médico</p>
              <div style={{ display: "grid", gap: 6 }}>
                <div>
                  <label style={lbl}>Cor da Tinta</label>
                  <select style={sel} value={signatureColor} onChange={e => setSignatureColor(e.target.value)}>
                    <option value="#0b109f">Azul Caneta</option>
                    <option value="#000000">Preto</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Foto da Assinatura</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {signatureImage ? (
                      <div style={{ position: "relative" }}>
                        <img src={signatureImage} alt="Assinatura" style={{ maxHeight: 50, maxWidth: 160, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 6 }} />
                        <button type="button" onClick={() => { setSignatureImage(""); if (signatureRef.current) signatureRef.current.value = ""; }}
                          style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ ...btnBlue, padding: "5px 10px", cursor: "pointer", fontSize: 10 }}>
                        ENVIAR FOTO
                        <input ref={signatureRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSignatureUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Emitente */}
          <div style={card}>
            <div style={secTitle}>Dados do Emitente</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <label style={lbl}>Unidade / Instituição</label>
                <input style={inp} value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={lbl}>Endereço do Emitente</label>
                <input style={inp} value={form.enderecoEmitente} onChange={e => setForm(p => ({ ...p, enderecoEmitente: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={lbl}>CNPJ</label>
                  <input style={inp} value={form.cnpjEmitente} onChange={e => setForm(p => ({ ...p, cnpjEmitente: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Telefone</label>
                  <input style={inp} value={form.telefoneEmitente} onChange={e => setForm(p => ({ ...p, telefoneEmitente: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Site</label>
                <input style={inp} value={form.siteEmitente} onChange={e => setForm(p => ({ ...p, siteEmitente: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Prescrição */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ ...secTitle, margin: 0, border: "none", padding: 0 }}>Prescrição Médica</div>
              <button type="button" style={{ ...btnBlue, padding: "5px 12px", fontSize: 11 }} onClick={addMedicamento}>+ ADICIONAR</button>
            </div>
            {prescricao.map((item, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: "#fafafa" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#005CA9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{idx + 1}</div>
                    <button type="button" onClick={() => updateMedicamento(idx, "uso_interno", !item.uso_interno)}
                      style={{ padding: "3px 10px", borderRadius: 4, fontWeight: 600, fontSize: 10, cursor: "pointer", background: item.uso_interno ? "#059669" : "#7c3aed", color: "#fff", border: "none" }}>
                      {item.uso_interno ? "USO INTERNO" : "USO EXTERNO"}
                    </button>
                  </div>
                  {prescricao.length > 1 && <button type="button" style={btnRed} onClick={() => removeMedicamento(idx)}>✕</button>}
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  <input style={inp} value={item.medicamento} onChange={e => updateMedicamento(idx, "medicamento", e.target.value.toUpperCase())} placeholder="Nome do Medicamento" />
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 2fr", gap: 5, alignItems: "end" }}>
                    <div>
                      <label style={{ ...lbl, fontSize: 10 }}>Qtd</label>
                      <select style={{ ...sel, width: 60, padding: "7px 4px", fontSize: 12 }}
                        value={(() => { const m = item.quantidade.match(/^(\d+)/); return m ? (parseInt(m[1]) <= 10 ? m[1] : "custom") : ""; })()}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "custom") { updateMedicamento(idx, "quantidade", ""); return; }
                          if (!v) { updateMedicamento(idx, "quantidade", ""); return; }
                          const n = parseInt(v);
                          const ext: Record<number,string> = {1:"uma",2:"duas",3:"três",4:"quatro",5:"cinco",6:"seis",7:"sete",8:"oito",9:"nove",10:"dez"};
                          const numStr = String(n).padStart(2, "0");
                          updateMedicamento(idx, "quantidade", `${numStr} (${ext[n]}) caixa${n > 1 ? "s" : ""}`);
                        }}>
                        <option value="">-</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{String(n).padStart(2,"0")}</option>)}
                        <option value="custom">+</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: 10 }}>Quantidade</label>
                      <input style={inp} value={item.quantidade} onChange={e => updateMedicamento(idx, "quantidade", e.target.value)} placeholder="Ex: 01 (uma) caixa" />
                    </div>
                    <input style={inp} value={item.modo_uso} onChange={e => updateMedicamento(idx, "modo_uso", e.target.value)} placeholder="Uso: Tomar 1 cápsula de 8/8h por 7 dias" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Data e Hora */}
          <div style={card}>
            <div style={secTitle}>Data de Emissão</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={lbl}>Data</label>
                <input style={inp} value={form.dataEmissao} onChange={e => setForm(p => ({ ...p, dataEmissao: handleDateInput(e.target.value) }))} placeholder="DD/MM/AAAA" maxLength={10} />
              </div>
              <div>
                <label style={lbl}>Hora</label>
                <input style={inp} type="time" value={form.horaEmissao} onChange={e => setForm(p => ({ ...p, horaEmissao: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              style={{ ...btnGreen, flex: 1, padding: "12px 0", fontSize: 14, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Salvando..." : "SALVAR ALTERAÇÕES"}
            </button>
            <button style={{ ...btnGray, flex: 1, padding: "12px 0", fontSize: 14 }} onClick={() => navigate("/dashboard")}>
              CANCELAR
            </button>
          </div>
        </div>

        {/* ═══ COLUNA DIREITA — PREVIEW ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "8px 12px", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>Preview em Tempo Real</span>
            {codigoQR && (
              <span style={{ fontSize: 11, color: "#166534", background: "#dcfce7", padding: "3px 8px", borderRadius: 5, fontWeight: 600 }}>
                QR Code: {codigoQR}
              </span>
            )}
          </div>
          <div style={{ flex: 1, overflow: "auto", background: "#525659", borderRadius: 10, padding: 14, maxHeight: "calc(100vh - 120px)" }}>
            <div ref={previewRef} style={{ width: 794, margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <PrescricaoDocument data={previewData} />
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
