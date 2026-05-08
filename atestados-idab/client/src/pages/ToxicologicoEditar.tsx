/**
 * ToxicologicoEditar — Edição de Laudo Toxicológico salvo
 * Carrega dados pelo ID, permite editar todos os campos, salva via PUT /api/documents/:id
 * CPF bloqueado após emissão.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { toast } from "sonner";
import { Save, Lock, FlaskConical } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { exportElementToPDF } from "@/lib/pdfExport";

interface ToxData {
  nome: string; cpf: string; rg: string; dataNascimento: string;
  cnh: string; categoriaCNH: string; laboratorio: string; crf: string;
  responsavel: string; dataColeta: string; dataEmissao: string;
  resultado: "NEGATIVO" | "POSITIVO"; protocolo: string;
  validade: string; observacoes: string;
}

const LABORATORIOS = [
  "SODRÉ LABORATÓRIO DE ANÁLISES CLÍNICAS",
  "LABORATÓRIO SODRÉ",
  "LABORATÓRIO CENTRAL",
  "LABORATÓRIO CLÍNICO",
];

const SUBSTANCIAS = [
  "Cocaína e Metabólitos",
  "Anfetaminas e Derivados",
  "Maconha (THC)",
  "Opiáceos",
  "Benzodiazepínicos",
];

export default function ToxicologicoEditar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const docId = params.id;
  const docRef = useRef<HTMLDivElement>(null);

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [codigoQR, setCodigoQR] = useState("");
  const [data, setData] = useState<ToxData>({
    nome: "", cpf: "", rg: "", dataNascimento: "", cnh: "", categoriaCNH: "B",
    laboratorio: LABORATORIOS[0], crf: "", responsavel: "", dataColeta: "",
    dataEmissao: "", resultado: "NEGATIVO", protocolo: "", validade: "", observacoes: "",
  });

  useEffect(() => {
    if (!docId) return;
    setLoadingDoc(true);
    fetch(`/api/documents/${docId}`, { credentials: "include" })
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data) {
          const doc = result.data;
          let docData: any = {};
          try { docData = typeof doc.data === "string" ? JSON.parse(doc.data) : doc.data; } catch { docData = {}; }
          setData(prev => ({ ...prev, ...docData }));
          setCodigoQR(doc.codigo_qr || doc.id || "");
        } else {
          toast.error("Documento não encontrado");
          setLocation("/toxicologicosalvos");
        }
      })
      .catch(() => {
        toast.error("Erro ao carregar documento");
        setLocation("/toxicologicosalvos");
      })
      .finally(() => setLoadingDoc(false));
  }, [docId]);

  const set = (k: keyof ToxData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData(d => ({ ...d, [k]: e.target.value as any }));
  };

  const handleSave = async () => {
    if (!data.nome || !data.cpf) {
      toast.error("Preencha Nome e CPF obrigatoriamente!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Laudo Toxicológico atualizado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao salvar alterações");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPDF(docRef.current, {
        filename: `TOXICOLOGICO_${data.nome.replace(/\s+/g, "_").toUpperCase()}.pdf`,
        scale: 2,
      });
      toast.success("PDF exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "6px 10px", border: "1px solid #d1d5db",
    borderRadius: 6, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit",
  };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 3, display: "block", textTransform: "uppercase" };
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 12 };
  const secTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: "#1e3a5f", textTransform: "uppercase", borderBottom: "2px solid #e5e7eb", paddingBottom: 8, marginBottom: 12 };
  const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 };
  const row3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 };
  const btnGreen: React.CSSProperties = { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
  const btnGray: React.CSSProperties = { background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
  const btnBlue: React.CSSProperties = { background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" };

  if (loadingDoc) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            <FlaskConical style={{ width: 48, height: 48, margin: "0 auto 16px", opacity: 0.3 }} />
            <p>Carregando documento...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ background: "#1e3a5f", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => setLocation("/toxicologicosalvos")}>
              ← VOLTAR
            </button>
            <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>
              DocMaster — EDITAR LAUDO TOXICOLÓGICO
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnGreen, padding: "6px 14px", fontSize: 12 }} onClick={handleSave} disabled={saving}>
              <Save style={{ width: 14, height: 14, display: "inline", marginRight: 4 }} />
              {saving ? "Salvando..." : "SALVAR ALTERAÇÕES"}
            </button>
            <button style={{ ...btnBlue, padding: "6px 14px", fontSize: 12 }} onClick={handleDownloadPDF} disabled={isDownloading}>
              {isDownloading ? "Exportando..." : "📄 BAIXAR PDF"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, padding: 14, maxWidth: 2000, margin: "0 auto" }}>
          {/* Formulário */}
          <div style={{ width: 580, flexShrink: 0, overflowY: "auto", maxHeight: "calc(100vh - 70px)" }}>
            {/* Aviso CPF bloqueado */}
            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Lock style={{ width: 14, height: 14, color: "#d97706" }} />
              <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                CPF bloqueado após emissão — todos os outros campos podem ser editados.
              </span>
            </div>

            {/* Dados do Examinado */}
            <div style={card}>
              <p style={secTitle}>👤 Dados do Examinado</p>
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Nome Completo *</span>
                <input style={inp} value={data.nome} onChange={set("nome")} />
              </div>
              <div style={row2}>
                <div>
                  <span style={lbl}>CPF * <Lock style={{ width: 10, height: 10, display: "inline", color: "#d97706" }} /></span>
                  <input style={{ ...inp, background: "#f3f4f6", color: "#6b7280" }} value={data.cpf} readOnly />
                </div>
                <div>
                  <span style={lbl}>RG</span>
                  <input style={inp} value={data.rg} onChange={set("rg")} />
                </div>
              </div>
              <div style={row3}>
                <div>
                  <span style={lbl}>Data Nascimento</span>
                  <input style={inp} value={data.dataNascimento} onChange={set("dataNascimento")} placeholder="DD/MM/AAAA" />
                </div>
                <div>
                  <span style={lbl}>CNH</span>
                  <input style={inp} value={data.cnh} onChange={set("cnh")} />
                </div>
                <div>
                  <span style={lbl}>Categoria CNH</span>
                  <select style={inp} value={data.categoriaCNH} onChange={set("categoriaCNH")}>
                    {["A","B","C","D","E","AB","AC","AD","AE"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Dados do Laboratório */}
            <div style={card}>
              <p style={secTitle}>🔬 Laboratório</p>
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Laboratório</span>
                <select style={inp} value={data.laboratorio} onChange={set("laboratorio")}>
                  {LABORATORIOS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={row2}>
                <div>
                  <span style={lbl}>CRF</span>
                  <input style={inp} value={data.crf} onChange={set("crf")} />
                </div>
                <div>
                  <span style={lbl}>Responsável Técnico</span>
                  <input style={inp} value={data.responsavel} onChange={set("responsavel")} />
                </div>
              </div>
              <div style={row3}>
                <div>
                  <span style={lbl}>Data Coleta</span>
                  <input style={inp} value={data.dataColeta} onChange={set("dataColeta")} placeholder="DD/MM/AAAA" />
                </div>
                <div>
                  <span style={lbl}>Data Emissão</span>
                  <input style={inp} value={data.dataEmissao} onChange={set("dataEmissao")} placeholder="DD/MM/AAAA" />
                </div>
                <div>
                  <span style={lbl}>Validade</span>
                  <input style={inp} value={data.validade} onChange={set("validade")} placeholder="DD/MM/AAAA" />
                </div>
              </div>
              <div style={row2}>
                <div>
                  <span style={lbl}>Protocolo</span>
                  <input style={inp} value={data.protocolo} onChange={set("protocolo")} />
                </div>
                <div>
                  <span style={lbl}>Resultado</span>
                  <select style={inp} value={data.resultado} onChange={set("resultado")}>
                    <option value="NEGATIVO">NEGATIVO</option>
                    <option value="POSITIVO">POSITIVO</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Observações</span>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={data.observacoes} onChange={set("observacoes")} />
              </div>
            </div>

            {/* Botão Salvar */}
            <button
              style={{ ...btnGreen, width: "100%", padding: "12px 0", fontSize: 15, marginBottom: 24 }}
              onClick={handleSave}
              disabled={saving}
            >
              <Save style={{ width: 16, height: 16, display: "inline", marginRight: 6 }} />
              {saving ? "Salvando alterações..." : "💾 SALVAR ALTERAÇÕES"}
            </button>
          </div>

          {/* Preview do Documento */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 70px)" }}>
            <div style={{ ...card, marginBottom: 8 }}>
              <p style={{ ...secTitle, marginBottom: 8 }}>👁️ Visualizador — Laudo Toxicológico</p>
              <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>
                O visualizador reflete todas as edições em tempo real.
              </p>
            </div>
            {/* Documento Toxicológico */}
            <div ref={docRef} style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid #e5e7eb", fontFamily: "Arial, sans-serif" }}>
              <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "2px solid #1e3a5f", paddingBottom: 16 }}>
                <h2 style={{ color: "#1e3a5f", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
                  LAUDO TOXICOLÓGICO
                </h2>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{data.laboratorio}</p>
                {data.crf && <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>CRF: {data.crf}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>Nome do Examinado</p>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{data.nome || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>CPF</p>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{data.cpf || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>RG</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.rg || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>Data de Nascimento</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.dataNascimento || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>CNH / Categoria</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.cnh || "—"} / {data.categoriaCNH}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>Protocolo</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.protocolo || "—"}</p>
                </div>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 8px", textTransform: "uppercase" }}>
                  Substâncias Pesquisadas
                </p>
                {SUBSTANCIAS.map(s => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: 12 }}>{s}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: data.resultado === "NEGATIVO" ? "#dcfce7" : "#fee2e2",
                      color: data.resultado === "NEGATIVO" ? "#16a34a" : "#dc2626",
                    }}>
                      {data.resultado}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>Data da Coleta</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.dataColeta || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>Data de Emissão</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.dataEmissao || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>Validade</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{data.validade || "—"}</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
                <div>
                  <div style={{ borderTop: "1px solid #374151", width: 200, marginBottom: 4 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>{data.responsavel || "Responsável Técnico"}</p>
                  {data.crf && <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>CRF: {data.crf}</p>}
                </div>
                {codigoQR && (
                  <div style={{ textAlign: "center" }}>
                    <QRCodeSVG value={codigoQR} size={60} />
                    <p style={{ fontSize: 9, color: "#9ca3af", margin: "4px 0 0" }}>Código de Verificação</p>
                  </div>
                )}
              </div>

              {data.observacoes && (
                <div style={{ marginTop: 12, padding: 10, background: "#fffbeb", borderRadius: 6, border: "1px solid #fcd34d" }}>
                  <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}><strong>Obs:</strong> {data.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
