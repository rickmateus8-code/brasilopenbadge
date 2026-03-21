/**
 * ValidationReceita.tsx
 * Página de validação de receitas médicas para verificamed.digital
 * Layout idêntico ao verificamed.online
 */
import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface MedicamentoValidado {
  uso_tipo: "interno" | "externo";
  nome: string;
  quantidade: string;
  posologia: string;
}

interface ReceitaValidada {
  codigo: string;
  tipo_receituario: string;
  // Paciente
  paciente_nome: string;
  paciente_cpf?: string;
  paciente_nascimento?: string;
  paciente_identidade?: string;
  paciente_endereco?: string;
  paciente_telefone?: string;
  paciente_cidade?: string;
  // Médico
  medico_nome: string;
  medico_crm: string;
  medico_uf: string;
  medico_especialidade?: string;
  // Prescrição
  medicamentos: MedicamentoValidado[];
  // Emissão
  data_emissao: string;
  validade?: string;
  // Emitente
  nome_unidade?: string;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function formatDate(d: string): string {
  if (!d) return "";
  if (d.includes("/")) return d;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatDateLong(d: string): string {
  if (!d) return "";
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  try {
    let day: string, month: string, year: string;
    if (d.includes("/")) {
      [day, month, year] = d.split("/");
    } else {
      [year, month, day] = d.split("-");
    }
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  } catch {
    return d;
  }
}

function addDays(dateStr: string, days: number): string {
  try {
    let d: Date;
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      d = new Date(dateStr);
    }
    d.setDate(d.getDate() + days);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "";
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ValidationReceita() {
  const params = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [receita, setReceita] = useState<ReceitaValidada | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codigoInput, setCodigoInput] = useState("");

  // ── Validar receita ────────────────────────────────────────────────────────
  const validarReceita = useCallback(async (codeOverride?: string) => {
    const code = (codeOverride || codigoInput).trim().toUpperCase();
    if (!code) { setErrorMsg("Informe o código da receita."); return; }
    setIsLoading(true);
    setErrorMsg(null);
    setReceita(null);
    try {
      const res = await fetch(`/api/validate/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.valid && json.data) {
        const d = json.data;
        // Normalizar os dados da receita
        setReceita({
          codigo: code,
          tipo_receituario: d.tipo_receituario || d.tipoReceituario || "controle_especial",
          paciente_nome: d.paciente_nome || d.paciente || "",
          paciente_cpf: d.paciente_cpf || d.cpf || "",
          paciente_nascimento: d.paciente_nascimento || d.nascimento || "",
          paciente_identidade: d.paciente_identidade || d.identidade || "",
          paciente_endereco: d.paciente_endereco || d.endereco || "",
          paciente_telefone: d.paciente_telefone || d.telefone || "",
          paciente_cidade: d.paciente_cidade || d.cidade || "",
          medico_nome: d.medico_nome || d.medico || "",
          medico_crm: d.medico_crm || d.crm || "",
          medico_uf: d.medico_uf || d.uf || "",
          medico_especialidade: d.medico_especialidade || d.especialidade || "",
          medicamentos: d.medicamentos || [],
          data_emissao: d.data_emissao || d.dataEmissao || "",
          validade: d.validade || "",
          nome_unidade: d.nome_unidade || d.unidade || d.instituicao || "",
        });
      } else {
        setErrorMsg(json.message || "Receita não encontrada na base de dados oficial.");
      }
    } catch {
      setErrorMsg("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [codigoInput]);

  // ── Auto-validar se vier código na URL ────────────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromQuery = urlParams.get("codigo") || urlParams.get("code") || "";
    const codeFromPath = params.id ? (params.id as string) : "";
    const code = (codeFromQuery || codeFromPath).trim().toUpperCase();
    if (code) {
      setCodigoInput(code);
      setTimeout(() => validarReceita(code), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tipo de receituário em texto ──────────────────────────────────────────
  const tipoLabel = (tipo: string) => {
    if (tipo === "controle_especial") return "Receituário Controle Especial";
    if (tipo === "antimicrobiano") return "Receituário Antimicrobiano";
    return "Receituário Simples";
  };

  // ── Validade (30 dias após emissão se não informada) ──────────────────────
  const validadeStr = receita?.validade
    ? formatDate(receita.validade)
    : receita?.data_emissao
    ? addDays(receita.data_emissao, 30)
    : "";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: "Arial, Helvetica, sans-serif",
      margin: 0,
      padding: 0,
    }}>

      {/* ── Header azul escuro ─────────────────────────────────────────────── */}
      <div style={{
        background: "#1e3a5f",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          🛡️
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
            Verificação de Receita
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            Sistema de Validação Digital
          </div>
        </div>
      </div>

      {/* ── Conteúdo principal ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 40px" }}>

        {/* ── Tela inicial (sem receita validada) ─────────────────────────── */}
        {!receita && (
          <div style={{
            background: "#fff",
            borderRadius: 10,
            padding: "28px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", margin: "0 0 20px", textAlign: "center" }}>
              Verificar Receita Médica
            </h2>

            {/* Carregando */}
            {isLoading && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{
                  width: 40, height: 40, border: "4px solid #e5e7eb",
                  borderTopColor: "#1e3a5f", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ color: "#6b7280", fontSize: 14 }}>Verificando receita...</div>
              </div>
            )}

            {/* Formulário */}
            {!isLoading && (
              <>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Código da Receita
                </label>
                <input
                  style={{
                    width: "100%", padding: "11px 14px",
                    borderRadius: 7, border: "1.5px solid #d1d5db",
                    fontSize: 15, outline: "none",
                    fontFamily: "monospace", letterSpacing: 2,
                    textTransform: "uppercase", boxSizing: "border-box",
                    marginBottom: 14,
                  }}
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                  placeholder="RX-XXXX-XXXX"
                  onKeyDown={(e) => e.key === "Enter" && validarReceita()}
                />

                <button
                  style={{
                    background: "#1e3a5f", color: "#fff", border: "none",
                    padding: "12px 20px", borderRadius: 7, fontSize: 14,
                    fontWeight: 700, cursor: "pointer", width: "100%",
                    letterSpacing: 0.5, marginBottom: 8,
                  }}
                  onClick={() => validarReceita()}
                >
                  VERIFICAR RECEITA
                </button>

                {errorMsg && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 7, color: "#dc2626", fontSize: 13, fontWeight: 600,
                  }}>
                    ❌ {errorMsg}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Resultado da validação ──────────────────────────────────────── */}
        {receita && (
          <>
            {/* Card: RECEITA VÁLIDA */}
            <div style={{
              background: "#d4edda", border: "1px solid #c3e6cb",
              borderRadius: 10, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
              marginBottom: 14,
            }}>
              <div style={{
                width: 40, height: 40, background: "#28a745",
                borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#155724", letterSpacing: 0.3 }}>
                  RECEITA VÁLIDA
                </div>
                <div style={{ fontSize: 13, color: "#155724" }}>
                  Esta receita foi verificada e está ativa.
                </div>
              </div>
            </div>

            {/* Card: Tipo de Receituário */}
            <div style={{
              background: "#28a745", borderRadius: 10,
              padding: "14px 18px", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 18 }}>✏️</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                  {tipoLabel(receita.tipo_receituario)} —
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                  Código: {receita.codigo}
                </div>
              </div>
            </div>

            {/* Card: Paciente */}
            <div style={{
              background: "#fff", borderRadius: 10,
              padding: "16px 18px", marginBottom: 14,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Paciente</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <FieldBox label="NOME" value={receita.paciente_nome} />
                {receita.paciente_cpf && <FieldBox label="CPF" value={receita.paciente_cpf} />}
                {receita.paciente_nascimento && <FieldBox label="NASCIMENTO" value={formatDate(receita.paciente_nascimento)} />}
              </div>
              {(receita.paciente_endereco || receita.paciente_cidade) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  {receita.paciente_endereco && <FieldBox label="ENDEREÇO" value={receita.paciente_endereco} />}
                  {receita.paciente_cidade && <FieldBox label="CIDADE" value={receita.paciente_cidade} />}
                </div>
              )}
            </div>

            {/* Card: Medicamentos Prescritos */}
            <div style={{
              background: "#fff", borderRadius: 10,
              padding: "16px 18px", marginBottom: 14,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>💊</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Medicamentos Prescritos</span>
              </div>

              {(receita.medicamentos || []).map((med, idx) => (
                <div key={idx} style={{
                  border: "1px solid #e5e7eb", borderRadius: 8,
                  padding: "12px 14px", marginBottom: 10,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 6 }}>
                    {med.nome}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, fontSize: 13, color: "#374151" }}>
                    <div>
                      <span style={{ color: "#6b7280", fontSize: 11, display: "block" }}>Uso</span>
                      {med.uso_tipo === "interno" ? "Interno" : "Externo"}
                    </div>
                    <div>
                      <span style={{ color: "#6b7280", fontSize: 11, display: "block" }}>Qtd</span>
                      {med.quantidade}
                    </div>
                    <div>
                      <span style={{ color: "#6b7280", fontSize: 11, display: "block" }}>Posologia</span>
                      {med.posologia}
                    </div>
                  </div>
                </div>
              ))}

              {/* Badge: Válida até */}
              {validadeStr && (
                <div style={{
                  display: "inline-block",
                  border: "1.5px solid #1e3a5f", borderRadius: 7,
                  padding: "6px 14px", marginTop: 6,
                }}>
                  <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, letterSpacing: 0.5 }}>VÁLIDA ATÉ</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1e3a5f" }}>{validadeStr}</div>
                </div>
              )}
            </div>

            {/* Card: Médico Responsável */}
            <div style={{
              background: "#fff", borderRadius: 10,
              padding: "16px 18px", marginBottom: 14,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>🩺</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Médico Responsável</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <FieldBox label="NOME" value={receita.medico_nome} />
                <FieldBox label="CRM" value={`${receita.medico_crm}/${receita.medico_uf}`} />
                {receita.medico_especialidade && (
                  <FieldBox label="ESPECIALIDADE" value={receita.medico_especialidade} />
                )}
              </div>
            </div>

            {/* Data de emissão */}
            <div style={{
              background: "#fff", borderRadius: 10,
              padding: "12px 18px", marginBottom: 14,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14, color: "#6b7280" }}>🕐</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                Emitida em {formatDateLong(receita.data_emissao)}
              </span>
            </div>

            {/* Card: Documento Credenciado */}
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 10, padding: "16px 18px", marginBottom: 20,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, background: "#28a745",
                  borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Documento Credenciado</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Verificado pelo Sistema VerificaMed</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
                Esta receita foi verificada eletronicamente e é reconhecida pelo{" "}
                <strong>Sistema Nacional de Verificação de Documentos Médicos</strong>.
              </p>
            </div>

            {/* Botão: Voltar ao Início */}
            <div style={{ textAlign: "center" }}>
              <button
                style={{
                  background: "#fff", border: "1.5px solid #d1d5db",
                  color: "#374151", padding: "11px 28px",
                  borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", display: "inline-flex",
                  alignItems: "center", gap: 8,
                }}
                onClick={() => {
                  setReceita(null);
                  setCodigoInput("");
                  setErrorMsg(null);
                }}
              >
                🏠 Voltar ao Início
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid #e5e7eb",
        padding: "14px 20px",
        textAlign: "center",
        fontSize: 12,
        color: "#9ca3af",
        background: "#fff",
      }}>
        © {new Date().getFullYear()} VerificaMed — Sistema de Verificação de Documentos Médicos
      </div>
    </div>
  );
}

// ─── Campo de dado ────────────────────────────────────────────────────────────
function FieldBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: 7,
      padding: "8px 12px", minHeight: 52,
    }}>
      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: 0.5, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111", wordBreak: "break-word" }}>
        {value || "—"}
      </div>
    </div>
  );
}
