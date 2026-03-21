/**
 * PrescricaoDocument — Clone visual 100% fiel ao PDF de referência
 *
 * Estrutura: 2 páginas A4 separadas (cada via = 1 página completa)
 *  - Título: "Receituário  Controle  Especial" — serif, negrito, centralizado
 *  - Box "IDENTIFICAÇÃO DO EMITENTE" (esq, ~65%) + coluna "Via/Data" (dir, ~35%)
 *  - Box Paciente (nome + endereço), largura total
 *  - Área de Prescrição (numerada, uso interno/externo)
 *  - Rodapé: QR Code grande (esq) + Assinatura itálica azul (dir) + linha de assinatura
 *  - Box "IDENTIFICAÇÃO DO COMPRADOR" (esq, ~50%) + Box "Assinatura Farmacêutico" (dir, ~50%)
 *
 * Validação: https://verificamed.digital/verificar/receita/{codigo}
 */
import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";

export interface PrescricaoItem {
  numero: number;
  uso_interno: boolean;
  medicamento: string;
  quantidade: string;
  modo_uso: string;
}

export interface PrescricaoData {
  codigoQR: string;
  tipo_receituario: "simples" | "controle_especial" | "antimicrobiano";
  // Dados do paciente
  paciente: string;
  cpf?: string;
  identidade?: string;
  endereco?: string;
  telefone?: string;
  cidade?: string;
  // Dados do médico/emitente
  medico: string;
  crm: string;
  especialidade?: string;
  instituicao?: string;
  unidade?: string;
  endereco_emitente?: string;
  cnpj_emitente?: string;
  telefone_emitente?: string;
  site_emitente?: string;
  // Prescrição
  prescricao: PrescricaoItem[];
  // Data/hora
  data_emissao?: string;
  hora_emissao?: string;
  // Visual
  logo_url?: string;
  logo_right?: string;
  signature_color?: string;
  signature_image?: string;
}

// ─── Configuração por tipo ─────────────────────────────────────────────────────
const TIPO_CONFIG = {
  simples: {
    titulo: "Receituário  Médico",
    viaDesc: "Via Única\nRetenção\nFacultativa",
    showComprador: false,
  },
  controle_especial: {
    titulo: "Receituário  Controle  Especial",
    viaDesc: "1/2ª Via\nRetenção na\nFarmácia ou\nDrogaria",
    showComprador: true,
  },
  antimicrobiano: {
    titulo: "Receituário  Antimicrobiano",
    viaDesc: "1/2ª Via\nRetenção na\nFarmácia",
    showComprador: true,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNomeAssinatura(nome: string): string {
  if (!nome) return "";
  const upper = nome.toUpperCase();
  if (upper.startsWith("DR.") || upper.startsWith("DRA.") || upper.startsWith("DR ") || upper.startsWith("DRA ")) {
    return nome.split(" ").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  }
  const partes = nome.trim().split(/\s+/);
  const formatado = partes.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  return `Dr(a). ${formatado}`;
}

function formatEspecialidade(esp: string): string {
  if (!esp) return "";
  return esp.charAt(0).toUpperCase() + esp.slice(1).toLowerCase();
}

function formatCRM(crm: string): string {
  // "CRM/SP 12345" → "CRM-SP: 12345"
  return crm.replace("/", "-").replace(" ", ": ");
}

// ─── Componente de UMA VIA (página A4 completa) ───────────────────────────────
function ViaPage({
  viaNum,
  data,
  logoLeft,
  logoRight,
  signatureColor,
  signatureImage,
  isEmitted,
  qrValue,
  cfg,
}: {
  viaNum: 1 | 2;
  data: PrescricaoData;
  logoLeft?: string;
  logoRight?: string;
  signatureColor: string;
  signatureImage: string;
  isEmitted: boolean;
  qrValue: string;
  cfg: typeof TIPO_CONFIG["controle_especial"];
}) {
  // Rótulo da via: "1/2ª Via" para via 1, "2/2ª Via" para via 2 (controle especial)
  const viaLabel = viaNum === 1
    ? cfg.viaDesc
    : cfg.viaDesc.replace("1/2ª Via", "2/2ª Via");

  return (
    <div
      style={{
        width: 794,
        height: 1123,
        background: "#fff",
        paddingTop: 32,
        paddingBottom: 28,
        paddingLeft: 40,
        paddingRight: 40,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 11,
        color: "#000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── TÍTULO ── */}
      <div style={{
        textAlign: "center",
        marginBottom: 14,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 0,
          color: "#000",
        }}>
          {cfg.titulo}
        </span>
      </div>

      {/* ── CABEÇALHO: Box Emitente (esq) + Via/Data (dir) ── */}
      <div style={{
        display: "flex",
        flexShrink: 0,
        marginBottom: 8,
        alignItems: "stretch",
      }}>
        {/* Box Identificação do Emitente — ~65% */}
        <div style={{
          flex: "0 0 65%",
          border: "1px solid #000",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "6px 12px 10px",
        }}>
          {/* Label do box */}
          <div style={{
            fontSize: 8.5,
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "#000",
            alignSelf: "stretch",
            textAlign: "center",
            borderBottom: "1px solid #000",
            paddingBottom: 4,
            marginBottom: 6,
          }}>
            IDENTIFICAÇÃO DO EMITENTE
          </div>

          {/* Logo */}
          {(logoLeft || logoRight) && (
            <div style={{ marginBottom: 4, lineHeight: 0 }}>
              <img
                src={logoLeft || logoRight}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ maxHeight: 44, maxWidth: 220, objectFit: "contain" }}
              />
            </div>
          )}

          {/* Nome da unidade/clínica */}
          {(data.unidade || data.instituicao) && (
            <div style={{
              fontWeight: 700,
              fontSize: 10.5,
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.35,
              marginBottom: 2,
            }}>
              {data.unidade || data.instituicao}
            </div>
          )}

          {/* Fallback: nome do médico quando não há unidade/instituição */}
          {!data.unidade && !data.instituicao && (
            <div style={{
              fontWeight: 700,
              fontSize: 10.5,
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.35,
              marginBottom: 2,
            }}>
              {data.medico || "MÉDICO"}
            </div>
          )}

          {/* CNPJ */}
          {data.cnpj_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", marginBottom: 1 }}>
              CNPJ {data.cnpj_emitente}
            </div>
          )}

          {/* Endereço do emitente */}
          {data.endereco_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", lineHeight: 1.35, marginBottom: 2 }}>
              {data.endereco_emitente}
            </div>
          )}

          {/* Telefone central de atendimento */}
          {data.telefone_emitente && (
            <div style={{ fontWeight: 700, fontSize: 9.5, textAlign: "center", marginBottom: 1 }}>
              CENTRAL DE ATENDIMENTO: {data.telefone_emitente}
            </div>
          )}

          {/* Site */}
          {data.site_emitente && (
            <div style={{ fontWeight: 700, fontSize: 9.5, textAlign: "center" }}>
              {data.site_emitente}
            </div>
          )}
        </div>

        {/* Coluna direita: Via + Data — ~35% */}
        <div style={{
          flex: "0 0 35%",
          border: "1px solid #000",
          borderLeft: "none",
          boxSizing: "border-box",
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          {/* Via */}
          <div style={{
            fontSize: 10.5,
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            color: "#000",
          }}>
            {viaLabel}
          </div>

          {/* Data */}
          <div style={{ fontSize: 11, color: "#000" }}>
            Data: {data.data_emissao
              ? (() => {
                  const p = data.data_emissao.split("/");
                  if (p.length === 3) return `${p[0]}/${p[1]}/${p[2]}`;
                  return data.data_emissao;
                })()
              : "__/__/____"}
          </div>
        </div>
      </div>

      {/* ── BOX PACIENTE ── */}
      <div style={{
        border: "1px solid #000",
        padding: "7px 12px",
        marginBottom: 12,
        flexShrink: 0,
        lineHeight: 1.75,
        fontSize: 11,
      }}>
        <div>
          <span>Paciente:{"   "}</span>
          <span>{data.paciente || "NOME DO PACIENTE"}</span>
        </div>
        {data.endereco && (
          <div>
            <span>Endereço:{"  "}</span>
            <span>{data.endereco}</span>
          </div>
        )}
      </div>

      {/* ── ÁREA DE PRESCRIÇÃO ── */}
      <div style={{
        flex: "1 1 auto",
        overflow: "hidden",
        fontSize: 11,
        lineHeight: 1.5,
        paddingLeft: 2,
      }}>
        {(data.prescricao || []).map((item, idx) => (
          <div key={idx} style={{ marginBottom: 14 }}>
            {/* Número e tipo de uso */}
            <div style={{ marginBottom: 3 }}>
              {idx + 1}) {item.uso_interno ? "Uso Interno" : "Uso Externo"}
            </div>
            {/* Medicamento */}
            <div style={{ marginBottom: 2 }}>
              {item.medicamento}
            </div>
            {/* Quantidade */}
            {item.quantidade && (
              <div style={{ marginBottom: 2 }}>
                Quantidade: {item.quantidade}
              </div>
            )}
            {/* Modo de uso */}
            {item.modo_uso && (
              <div>
                Uso:{"  "}{item.modo_uso}
              </div>
            )}
          </div>
        ))}

        {(!data.prescricao || data.prescricao.length === 0) && (
          <div style={{ fontSize: 11, color: "#bbb" }}>
            (Prescrição será exibida aqui)
          </div>
        )}
      </div>

      {/* ── RODAPÉ: QR Code (esq) + Assinatura itálica azul (dir) ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexShrink: 0,
        marginTop: 10,
        marginBottom: 10,
        gap: 16,
      }}>
        {/* QR Code — esquerda, grande */}
        <div style={{ flexShrink: 0 }}>
          {isEmitted ? (
            <QRCode
              value={qrValue}
              size={120}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          ) : (
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <div style={{ filter: "blur(3px)", opacity: 0.35, lineHeight: 0 }}>
                <QRCode
                  value="https://verificamed.digital"
                  size={120}
                  level="H"
                  includeMargin={false}
                  fgColor="#000"
                  bgColor="#fff"
                />
              </div>
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 8,
                  color: "#444",
                  textAlign: "center",
                  fontWeight: 700,
                  lineHeight: 1.4,
                  padding: "0 8px",
                }}>
                  QR Code gerado<br />após emissão
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Assinatura — direita, itálica azul */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          paddingRight: 4,
        }}>
          {signatureImage ? (
            <img
              src={signatureImage}
              alt="Assinatura"
              crossOrigin="anonymous"
              style={{ maxWidth: 210, maxHeight: 60, objectFit: "contain", marginBottom: 6 }}
            />
          ) : (
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: signatureColor || "#1a3a6b",
              lineHeight: 1.65,
              textAlign: "right",
              marginBottom: 6,
            }}>
              <div>{data.medico ? formatNomeAssinatura(data.medico) : "Dr(a). Nome do Médico"}</div>
              {data.especialidade && <div>{formatEspecialidade(data.especialidade)}</div>}
              <div>{data.crm ? formatCRM(data.crm) : "CRM-UF: 000000"}</div>
            </div>
          )}
          {/* Linha de assinatura */}
          <div style={{ borderTop: "1px solid #000", width: 230, marginTop: 2 }} />
        </div>
      </div>

      {/* ── BOXES INFERIORES: Comprador (esq) + Farmacêutico (dir) ── */}
      {cfg.showComprador && (
        <div style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 0,
        }}>
          {/* Box Identificação do Comprador */}
          <div style={{
            flex: "0 0 50%",
            border: "1px solid #000",
            boxSizing: "border-box",
            padding: "6px 12px 12px",
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: 9,
              textTransform: "uppercase",
              textAlign: "center",
              borderBottom: "1px solid #000",
              paddingBottom: 4,
              marginBottom: 8,
              letterSpacing: 0.3,
            }}>
              IDENTIFICAÇÃO DO COMPRADOR
            </div>
            <div style={{ fontSize: 10.5, lineHeight: 2.0 }}>
              <div>Nome completo: {data.paciente || ""}</div>
              {data.identidade && <div>Ident. {data.identidade}</div>}
              {data.endereco && <div>End. completo: {data.endereco}</div>}
              {data.telefone && <div>Telefone: {data.telefone}</div>}
              {data.cidade && <div>Cidade: {data.cidade}</div>}
            </div>
          </div>

          {/* Box Assinatura do Farmacêutico */}
          <div style={{
            flex: "0 0 50%",
            border: "1px solid #000",
            borderLeft: "none",
            boxSizing: "border-box",
            padding: "12px 12px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}>
            {/* 3 linhas de preenchimento manual */}
            <div style={{ borderTop: "1px solid #000", marginBottom: 22 }} />
            <div style={{ borderTop: "1px solid #000", marginBottom: 22 }} />
            <div style={{ borderTop: "1px solid #000", marginBottom: 8 }} />
            <div style={{ fontSize: 9.5, textAlign: "center", marginBottom: 6 }}>
              Assinatura do Farmacêutico
            </div>
            <div style={{ fontSize: 9.5, textAlign: "center" }}>
              Data _______ / _______ / _______
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal — exporta 2 páginas A4 ──────────────────────────────
const PrescricaoDocument = forwardRef<HTMLDivElement, {
  data: PrescricaoData;
  logoLeft?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
}>(({ data, logoLeft, logoRight, signatureColor, signatureImage }, ref) => {

  const isEmitted = !!(data.codigoQR && data.codigoQR !== "RX-XXXX-XXXX");
  const qrValue = isEmitted
    ? `https://verificamed.digital/verificar/receita/${data.codigoQR}`
    : "https://verificamed.digital";

  const tipo = data.tipo_receituario || "simples";
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.simples;

  const corAssinatura = signatureColor || data.signature_color || "#1a3a6b";
  const fotoAssinatura = signatureImage || data.signature_image || "";

  const viaProps = {
    data,
    logoLeft,
    logoRight,
    signatureColor: corAssinatura,
    signatureImage: fotoAssinatura,
    isEmitted,
    qrValue,
    cfg,
  };

  return (
    <div
      ref={ref}
      id="prescricao-document"
      data-pdf-export="true"
      style={{
        width: 794,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── 1ª VIA (Página 1) ── */}
      <ViaPage viaNum={1} {...viaProps} />

      {/* ── 2ª VIA (Página 2) — separador de página para impressão/PDF ── */}
      <div style={{
        pageBreakBefore: "always",
        breakBefore: "page",
      }}>
        <ViaPage viaNum={2} {...viaProps} />
      </div>
    </div>
  );
});

PrescricaoDocument.displayName = "PrescricaoDocument";
export default PrescricaoDocument;
