/**
 * CHAEditar — Edição de CHA Náutica salva
 * Carrega dados pelo ID, permite editar todos os campos, salva via PUT /api/documents/:id
 * CPF bloqueado após emissão.
 */
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { toast } from "sonner";
import { Save, Lock, Anchor } from "lucide-react";

interface CHAForm {
  cpf: string; senha: string; nome: string; localCode: string;
  inscricao: string; nascimento: string; emissao: string;
  validade: string; categoria1: string; categoria2: string;
  limites: string; requisitos: string;
}

const CATEGORIAS1 = ["ARRAIS-AMADOR","MESTRE-AMADOR","CAPITÃO-AMADOR","MOTONAUTA"];
const CATEGORIAS2 = ["NENHUMA","ARRAIS-AMADOR","MESTRE-AMADOR","CAPITÃO-AMADOR","MOTONAUTA"];
const LOCAL_CODES = ["CPSP","CPRJ","CPMG","CPBA","CPRS","CPPR","CPSC","CPCE","CPGO","CPDF"];

export default function CHAEditar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const docId = params.id;

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CHAForm>({
    cpf: "", senha: "", nome: "", localCode: "CPSP",
    inscricao: "", nascimento: "", emissao: "", validade: "",
    categoria1: "ARRAIS-AMADOR", categoria2: "NENHUMA",
    limites: "NAVEGAÇÃO INTERIOR\nINLAND NAVIGATION",
    requisitos: "******** / ********",
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
          setForm(prev => ({ ...prev, ...docData }));
        } else {
          toast.error("Documento não encontrado");
          setLocation("/chasalvas");
        }
      })
      .catch(() => {
        toast.error("Erro ao carregar documento");
        setLocation("/chasalvas");
      })
      .finally(() => setLoadingDoc(false));
  }, [docId]);

  const set = (k: keyof CHAForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.nome || !form.cpf) {
      toast.error("Preencha Nome e CPF obrigatoriamente!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("CHA Náutica atualizada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao salvar alterações");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
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
  const btnGreen: React.CSSProperties = { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
  const btnGray: React.CSSProperties = { background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" };

  if (loadingDoc) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            <Anchor style={{ width: 48, height: 48, margin: "0 auto 16px", opacity: 0.3 }} />
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
            <button style={{ ...btnGray, padding: "5px 12px", fontSize: 11 }} onClick={() => setLocation("/chasalvas")}>
              ← VOLTAR
            </button>
            <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>
              DocMaster — EDITAR CHA NÁUTICA
            </h1>
          </div>
          <button style={{ ...btnGreen, padding: "6px 14px", fontSize: 12 }} onClick={handleSave} disabled={saving}>
            <Save style={{ width: 14, height: 14, display: "inline", marginRight: 4 }} />
            {saving ? "Salvando..." : "SALVAR ALTERAÇÕES"}
          </button>
        </div>

        <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
          {/* Aviso CPF bloqueado */}
          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock style={{ width: 14, height: 14, color: "#d97706" }} />
            <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>
              CPF bloqueado após emissão — todos os outros campos podem ser editados.
            </span>
          </div>

          {/* Dados Pessoais */}
          <div style={card}>
            <p style={secTitle}>⚓ Dados do Habilitado</p>
            <div style={{ marginBottom: 10 }}>
              <span style={lbl}>Nome Completo *</span>
              <input style={inp} value={form.nome} onChange={set("nome")} />
            </div>
            <div style={row2}>
              <div>
                <span style={lbl}>CPF * <Lock style={{ width: 10, height: 10, display: "inline", color: "#d97706" }} /></span>
                <input style={{ ...inp, background: "#f3f4f6", color: "#6b7280" }} value={form.cpf} readOnly />
              </div>
              <div>
                <span style={lbl}>Senha</span>
                <input style={inp} value={form.senha} onChange={set("senha")} />
              </div>
            </div>
            <div style={row2}>
              <div>
                <span style={lbl}>Nascimento</span>
                <input style={inp} value={form.nascimento} onChange={set("nascimento")} placeholder="DD/MM/AAAA" />
              </div>
              <div>
                <span style={lbl}>Inscrição</span>
                <input style={inp} value={form.inscricao} onChange={set("inscricao")} />
              </div>
            </div>
          </div>

          {/* Dados da Habilitação */}
          <div style={card}>
            <p style={secTitle}>🚢 Dados da Habilitação</p>
            <div style={row2}>
              <div>
                <span style={lbl}>Categoria 1</span>
                <select style={inp} value={form.categoria1} onChange={set("categoria1")}>
                  {CATEGORIAS1.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <span style={lbl}>Categoria 2</span>
                <select style={inp} value={form.categoria2} onChange={set("categoria2")}>
                  {CATEGORIAS2.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={row2}>
              <div>
                <span style={lbl}>Emissão</span>
                <input style={inp} value={form.emissao} onChange={set("emissao")} placeholder="DD/MM/AAAA" />
              </div>
              <div>
                <span style={lbl}>Validade</span>
                <input style={inp} value={form.validade} onChange={set("validade")} placeholder="DD/MM/AAAA" />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={lbl}>Capitania / Local</span>
              <select style={inp} value={form.localCode} onChange={set("localCode")}>
                {LOCAL_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={lbl}>Limites</span>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.limites} onChange={set("limites")} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={lbl}>Requisitos</span>
              <input style={inp} value={form.requisitos} onChange={set("requisitos")} />
            </div>
          </div>

          {/* Botão Salvar */}
          <button
            style={{ ...btnGreen, width: "100%", padding: "12px 0", fontSize: 15 }}
            onClick={handleSave}
            disabled={saving}
          >
            <Save style={{ width: 16, height: 16, display: "inline", marginRight: 6 }} />
            {saving ? "Salvando alterações..." : "💾 SALVAR ALTERAÇÕES"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
