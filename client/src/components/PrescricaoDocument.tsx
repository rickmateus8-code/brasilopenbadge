/**
 * PrescricaoDocument — Layout 100% fiel ao modelo oficial
 *
 * Estrutura: 2 vias idênticas na mesma folha A4 (como no PDF de referência)
 *  - Título centralizado no topo
 *  - Cabeçalho: box "IDENTIFICAÇÃO DO EMITENTE" (esq) + "1ª/2ª Via" + Data (dir)
 *  - Box Paciente (nome + endereço)
 *  - Área de Prescrição
 *  - Rodapé: QR Code (esq) + Assinatura itálica azul (dir)
 *  - Box "IDENTIFICAÇÃO DO COMPRADOR" (esq) + Box "Assinatura do Farmacêutico" (dir)
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
    titulo: "Receituário Médico",
    viaLabel: "Via Única",
    viaDesc: "Retenção\nFacultativa",
    showComprador: false,
    borderColor: "#000000",
  },
  controle_especial: {
    titulo: "Receituário  Controle  Especial",
    viaLabel: "1/2ª Via",
    viaDesc: "Retenção na\nFarmácia ou\nDrogaria",
    showComprador: true,
    borderColor: "#000000",
  },
  antimicrobiano: {
    titulo: "Receituário  Antimicrobiano",
    viaLabel: "1/2ª Via",
    viaDesc: "Retenção na\nFarmácia",
    showComprador: true,
    borderColor: "#000000",
  },
};

// ─── Componente de uma Via ─────────────────────────────────────────────────────
function Via({
  viaNum,
  data,
  logoLeft,
  logoRight,
  signatureColor,
  signatureImage,
  isEmitted,
  qrValue,
  cfg,
  dataFormatada,
}: {
  viaNum: 1 | 2;
  data: PrescricaoData;
  logoLeft?: string;
  logoRight?: string;
  signatureColor: string;
  signatureImage: string;
  isEmitted: boolean;
  qrValue: string;
  cfg: typeof TIPO_CONFIG["simples"];
  dataFormatada: string;
}) {
  const viaLabel = viaNum === 1 ? cfg.viaLabel : cfg.viaLabel.replace("1/2", "2/2");

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 11,
      color: "#000",
      background: "#fff",
    }}>

      {/* ── CABEÇALHO: 2 colunas ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>

        {/* Coluna esquerda: IDENTIFICAÇÃO DO EMITENTE */}
        <div style={{
          flex: "0 0 72%",
          border: "1px solid #000",
          padding: "6px 10px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Label */}
          <div style={{
            fontSize: 8.5,
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "#000",
            marginBottom: 4,
            alignSelf: "stretch",
            textAlign: "center",
            borderBottom: "1px solid #000",
            paddingBottom: 4,
          }}>
            IDENTIFICAÇÃO DO EMITENTE
          </div>

          {/* Logo */}
          {(logoLeft || logoRight) && (
            <div style={{ margin: "4px 0", lineHeight: 0 }}>
              <img
                src={logoLeft || logoRight}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ maxHeight: 40, maxWidth: 200, objectFit: "contain" }}
              />
            </div>
          )}

          {/* Unidade / Nome da clínica */}
          {data.unidade && (
            <div style={{ fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", textAlign: "center", marginTop: logoLeft || logoRight ? 2 : 4, lineHeight: 1.3 }}>
              {data.unidade}
            </div>
          )}

          {/* CNPJ */}
          {data.cnpj_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", marginTop: 1 }}>
              CNPJ {data.cnpj_emitente}
            </div>
          )}

          {/* Endereço */}
          {data.endereco_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", marginTop: 1, lineHeight: 1.3 }}>
              {data.endereco_emitente}
            </div>
          )}

          {/* Telefone */}
          {data.telefone_emitente && (
            <div style={{ fontWeight: 700, fontSize: 9.5, textAlign: "center", marginTop: 3 }}>
              CENTRAL DE ATENDIMENTO: {data.telefone_emitente}
            </div>
          )}

          {/* Site */}
          {data.site_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", marginTop: 1 }}>
              {data.site_emitente}
            </div>
          )}

          {/* Fallback: Instituição quando não há unidade */}
          {!data.unidade && data.instituicao && (
            <div style={{ fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", textAlign: "center", marginTop: 4, lineHeight: 1.3 }}>
              {data.instituicao}
            </div>
          )}

          {/* Médico (quando não há logo/unidade) */}
          {!data.unidade && !data.instituicao && (
            <div style={{ fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", textAlign: "center", marginTop: 4 }}>
              {data.medico || "MÉDICO"}
            </div>
          )}
        </div>

        {/* Coluna direita: Via + Data */}
        <div style={{
          flex: "0 0 28%",
          border: "1px solid #000",
          borderLeft: "none",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 11 }}>{viaLabel}</div>
            <div style={{ fontSize: 9.5, lineHeight: 1.5, marginTop: 2, whiteSpace: "pre-line" }}>
              {cfg.viaDesc}
            </div>
          </div>
          <div style={{ fontSize: 11, marginTop: 8 }}>
            <span style={{ fontWeight: 400 }}>Data: </span>
            <span style={{ fontWeight: 400 }}>
              {data.data_emissao
                ? (() => {
                    const p = data.data_emissao.split("/");
                    if (p.length === 3) return `${p[0]}/${p[1]}/${p[2]}`;
                    return data.data_emissao;
                  })()
                : "__/__/____"}
            </span>
          </div>
        </div>
      </div>

      {/* ── BOX PACIENTE ── */}
      <div style={{
        border: "1px solid #000",
        padding: "6px 10px",
        marginBottom: 10,
        lineHeight: 1.7,
        fontSize: 11,
      }}>
        <div>
          <span style={{ fontWeight: 400 }}>Paciente: </span>
          <span style={{ fontWeight: 400 }}>{"  "}{data.paciente || "NOME DO PACIENTE"}</span>
        </div>
        {data.endereco && (
          <div>
            <span style={{ fontWeight: 400 }}>Endereço: </span>
            <span style={{ fontWeight: 400 }}>{"  "}{data.endereco}</span>
          </div>
        )}
      </div>

      {/* ── ÁREA DE PRESCRIÇÃO ── */}
      <div style={{ flex: "1 1 auto", paddingLeft: 2, overflow: "hidden" }}>
        {(data.prescricao || []).map((item, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 400, fontSize: 11, marginBottom: 2 }}>
              {idx + 1}) {item.uso_interno ? "Uso Interno" : "Uso Externo"}
            </div>
            <div style={{ fontSize: 11, marginBottom: 1, paddingLeft: 4 }}>
              {item.medicamento}
            </div>
            {item.quantidade && (
              <div style={{ fontWeight: 700, fontSize: 11, paddingLeft: 4, marginBottom: 1 }}>
                Quantidade: {item.quantidade}
              </div>
            )}
            {item.modo_uso && (
              <div style={{ fontSize: 11, paddingLeft: 4 }}>
                Uso:{"  "}{item.modo_uso}
              </div>
            )}
          </div>
        ))}

        {(!data.prescricao || data.prescricao.length === 0) && (
          <div style={{ fontSize: 11, color: "#aaa", paddingLeft: 4 }}>
            (Prescrição será exibida aqui)
          </div>
        )}
      </div>

      {/* ── RODAPÉ: QR Code + Assinatura ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 10,
        marginBottom: 8,
        gap: 12,
      }}>
        {/* QR Code — esquerda, grande */}
        <div style={{ flexShrink: 0 }}>
          {isEmitted ? (
            <QRCode
              value={qrValue}
              size={110}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          ) : (
            <div style={{ position: "relative", width: 110, height: 110 }}>
              <div style={{ filter: "blur(3px)", opacity: 0.4, lineHeight: 0 }}>
                <QRCode value="https://verificamed.digital" size={110} level="H" includeMargin={false} fgColor="#000" bgColor="#fff" />
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: "#555", textAlign: "center", fontWeight: 700, lineHeight: 1.3, padding: "0 6px" }}>QR Code gerado<br/>após emissão</span>
              </div>
            </div>
          )}
        </div>

        {/* Assinatura — direita, itálica azul */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", paddingRight: 8 }}>
          {signatureImage ? (
            <img
              src={signatureImage}
              alt="Assinatura"
              crossOrigin="anonymous"
              style={{ maxWidth: 200, maxHeight: 55, objectFit: "contain", marginBottom: 4 }}
            />
          ) : (
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: signatureColor || "#1a3a6b",
              lineHeight: 1.6,
              textAlign: "right",
              marginBottom: 4,
            }}>
              <div>{data.medico ? formatNomeAssinatura(data.medico) : "Dr(a). Nome do Médico"}</div>
              {data.especialidade && <div>{formatEspecialidade(data.especialidade)}</div>}
              <div style={{ fontWeight: 700 }}>{data.crm ? formatCRM(data.crm) : "CRM-UF: 000000"}</div>
            </div>
          )}
          {/* Linha de assinatura */}
          <div style={{ borderTop: "1px solid #000", width: 220, marginTop: 2 }} />
          <div style={{ borderTop: "1px solid #000", width: 220, marginTop: 18 }} />
          <div style={{ borderTop: "1px solid #000", width: 220, marginTop: 18 }} />
        </div>
      </div>

      {/* ── BOXES INFERIORES: Comprador + Farmacêutico ── */}
      {cfg.showComprador && (
        <div style={{ display: "flex", gap: 0, marginTop: 4 }}>

          {/* Box Identificação do Comprador */}
          <div style={{
            flex: "0 0 50%",
            border: "1px solid #000",
            padding: "6px 10px 10px",
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: 9,
              textTransform: "uppercase",
              textAlign: "center",
              borderBottom: "1px solid #000",
              paddingBottom: 4,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}>
              IDENTIFICAÇÃO DO COMPRADOR
            </div>
            <div style={{ fontSize: 10.5, lineHeight: 1.9 }}>
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
            padding: "6px 10px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}>
            <div style={{ borderTop: "1px solid #000", marginBottom: 18 }} />
            <div style={{ borderTop: "1px solid #000", marginBottom: 18 }} />
            <div style={{ borderTop: "1px solid #000", marginBottom: 6 }} />
            <div style={{ fontSize: 9.5, textAlign: "center", marginBottom: 4 }}>Assinatura do Farmacêutico</div>
            <div style={{ fontSize: 9.5, textAlign: "center" }}>
              Data ______ / ______ / ______
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers de formatação ─────────────────────────────────────────────────────
function formatNomeAssinatura(nome: string): string {
  if (!nome) return "";
  const upper = nome.toUpperCase();
  // Já começa com DR/DRA
  if (upper.startsWith("DR.") || upper.startsWith("DRA.") || upper.startsWith("DR ") || upper.startsWith("DRA ")) {
    return nome.split(" ").map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
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

// ─── Componente principal ──────────────────────────────────────────────────────
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

  // Dimensões A4 a 96dpi
  const DOC_W = 794;
  const DOC_H = 1123;
  const PAD_H = 38;  // horizontal
  const PAD_V = 28;  // vertical topo/base
  const DIVIDER_H = 16; // espaço entre as duas vias

  // Altura disponível para cada via
  const viaH = Math.floor((DOC_H - PAD_V * 2 - DIVIDER_H - 36) / 2); // 36 = título

  const viaProps = {
    data,
    logoLeft,
    logoRight,
    signatureColor: corAssinatura,
    signatureImage: fotoAssinatura,
    isEmitted,
    qrValue,
    cfg,
    dataFormatada: data.data_emissao || "",
  };

  return (
    <div
      ref={ref}
      id="prescricao-document"
      data-pdf-export="true"
      style={{
        width: `${DOC_W}px`,
        minHeight: `${DOC_H}px`,
        height: `${DOC_H}px`,
        background: "#ffffff",
        paddingTop: `${PAD_V}px`,
        paddingBottom: `${PAD_V}px`,
        paddingLeft: `${PAD_H}px`,
        paddingRight: `${PAD_H}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── TÍTULO ── */}
      <div style={{
        textAlign: "center",
        marginBottom: 10,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 1,
          color: "#000",
        }}>
          {cfg.titulo}
        </span>
      </div>

      {/* ── 1ª VIA ── */}
      <div style={{
        flex: "0 0 auto",
        height: `${viaH}px`,
        overflow: "hidden",
        borderBottom: "2px dashed #aaa",
        paddingBottom: 6,
        marginBottom: DIVIDER_H / 2,
      }}>
        <Via viaNum={1} {...viaProps} />
      </div>

      {/* ── 2ª VIA ── */}
      <div style={{
        flex: "0 0 auto",
        height: `${viaH}px`,
        overflow: "hidden",
        paddingTop: DIVIDER_H / 2,
      }}>
        <Via viaNum={2} {...viaProps} />
      </div>
    </div>
  );
});

PrescricaoDocument.displayName = "PrescricaoDocument";
export default PrescricaoDocument;
