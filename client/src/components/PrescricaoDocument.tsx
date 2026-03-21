/**
 * PrescricaoDocument — Clone visual 100% fiel ao PDF de referência
 *
 * Carimbo do emitente:
 *  - Logo (dr.consulta em azul ou upload do usuário)
 *  - UNIDADE (negrito, maiúsculas)
 *  - CNPJ
 *  - Endereço
 *  - CENTRAL DE ATENDIMENTO: telefone (negrito)
 *  - www.site.com (negrito)
 *
 * Estrutura: 2 páginas A4 separadas (cada via = 1 página completa)
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
  // Unidades próximas
  unidades_proximas?: string[];
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
    viaDesc1: "Via Única",
    viaDesc2: "Retenção\nFacultativa",
    showComprador: false,
  },
  controle_especial: {
    titulo: "Receituário  Controle  Especial",
    viaDesc1: "1/2ª Via",
    viaDesc2: "Retenção na\nFarmácia ou\nDrogaria",
    showComprador: true,
  },
  antimicrobiano: {
    titulo: "Receituário  Antimicrobiano",
    viaDesc1: "1/2ª Via",
    viaDesc2: "Retenção na\nFarmácia",
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
  return crm.replace("/", "-").replace(" ", ": ");
}

// ─── Logo padrão dr.consulta (SVG inline) ─────────────────────────────────────
// Replica exatamente: "dr." em azul (#1a56db) + "consulta" em azul escuro (#1a3a6b)
// fonte sans-serif, peso 700, letras minúsculas
function DrConsultaLogo({ height = 38 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 220 50"
      height={height}
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="40"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="42"
        fill="#1a56db"
        letterSpacing="-1"
      >
        dr.consulta
      </text>
    </svg>
  );
}

// ─── Componente de UMA VIA (página A4 completa) ───────────────────────────────
function ViaPage({
  viaNum,
  data,
  logoUrl,
  signatureColor,
  signatureImage,
  isEmitted,
  qrValue,
  cfg,
}: {
  viaNum: 1 | 2;
  data: PrescricaoData;
  logoUrl?: string;
  signatureColor: string;
  signatureImage: string;
  isEmitted: boolean;
  qrValue: string;
  cfg: typeof TIPO_CONFIG["controle_especial"];
}) {
  // Rótulo da via
  const viaNum1 = viaNum === 1 ? cfg.viaDesc1 : cfg.viaDesc1.replace("1/2ª", "2/2ª");

  return (
    <div
      style={{
        width: 794,
        height: 1123,
        background: "#fff",
        paddingTop: 30,
        paddingBottom: 24,
        paddingLeft: 42,
        paddingRight: 42,
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
        marginBottom: 16,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 1,
          color: "#000",
        }}>
          {cfg.titulo}
        </span>
      </div>

      {/* ── CABEÇALHO: Box Emitente (esq ~65%) + Coluna Via/Data (dir ~35%) ── */}
      <div style={{
        display: "flex",
        flexShrink: 0,
        marginBottom: 8,
        alignItems: "stretch",
      }}>

        {/* ── Box Identificação do Emitente ── */}
        <div style={{
          flex: "0 0 65%",
          border: "1px solid #000",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "6px 16px 12px",
        }}>
          {/* Label */}
          <div style={{
            fontSize: 8.5,
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "#000",
            alignSelf: "stretch",
            textAlign: "center",
            borderBottom: "1px solid #000",
            paddingBottom: 5,
            marginBottom: 10,
          }}>
            IDENTIFICAÇÃO DO EMITENTE
          </div>

          {/* ── LOGO ── */}
          {logoUrl ? (
            /* Logo customizado enviado pelo usuário */
            <div style={{ marginBottom: 6, lineHeight: 0 }}>
              <img
                src={logoUrl}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ maxHeight: 44, maxWidth: 220, objectFit: "contain" }}
              />
            </div>
          ) : (
            /* Logo padrão dr.consulta */
            <div style={{ marginBottom: 6 }}>
              <DrConsultaLogo height={36} />
            </div>
          )}

          {/* ── NOME DA UNIDADE — negrito, maiúsculas ── */}
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

          {/* Fallback: nome do médico */}
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

          {/* ── CNPJ ── */}
          {data.cnpj_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", marginBottom: 2 }}>
              CNPJ {data.cnpj_emitente}
            </div>
          )}

          {/* ── ENDEREÇO ── */}
          {data.endereco_emitente && (
            <div style={{ fontSize: 9.5, textAlign: "center", lineHeight: 1.4, marginBottom: 4 }}>
              {data.endereco_emitente}
            </div>
          )}

          {/* ── CENTRAL DE ATENDIMENTO ── negrito */}
          {data.telefone_emitente && (
            <div style={{ fontWeight: 700, fontSize: 9.5, textAlign: "center", marginBottom: 1 }}>
              CENTRAL DE ATENDIMENTO: {data.telefone_emitente}
            </div>
          )}

          {/* ── SITE ── negrito */}
          {data.site_emitente && (
            <div style={{ fontWeight: 700, fontSize: 9.5, textAlign: "center" }}>
              {data.site_emitente}
            </div>
          )}
        </div>

        {/* ── Coluna direita: Via + Data ── */}
        <div style={{
          flex: "0 0 35%",
          boxSizing: "border-box",
          padding: "8px 12px 12px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignSelf: "stretch",
        }}>
          {/* Via — topo: negrito pequeno + sublinhado menor */}
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 8.5, marginBottom: 1, color: "#000" }}>
              {viaNum1}
            </div>
            <div style={{
              fontSize: 8,
              lineHeight: 1.5,
              textDecoration: "underline",
              whiteSpace: "pre-line",
              color: "#000",
            }}>
              {cfg.viaDesc2}
            </div>
          </div>

          {/* Data — base: fonte maior, alinhada à esquerda */}
          <div style={{ fontSize: 13, fontWeight: 400, color: "#000" }}>
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
        padding: "7px 14px",
        marginBottom: 12,
        flexShrink: 0,
        lineHeight: 1.85,
        fontSize: 11,
      }}>
        <div>
          <span style={{ fontWeight: 400 }}>Paciente:</span>
          <span style={{ marginLeft: 12 }}>{data.paciente || "NOME DO PACIENTE"}</span>
        </div>
        {data.endereco && (
          <div>
            <span style={{ fontWeight: 400 }}>Endereço:</span>
            <span style={{ marginLeft: 12 }}>{data.endereco}</span>
          </div>
        )}
      </div>

      {/* ── ÁREA DE PRESCRIÇÃO ── */}
      <div style={{
        flex: "1 1 auto",
        overflow: "hidden",
        fontSize: 11,
        lineHeight: 1.55,
        paddingLeft: 2,
      }}>
        {(data.prescricao || []).map((item, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 2 }}>
              {idx + 1}) {item.uso_interno ? "Uso Interno" : "Uso Externo"}
            </div>
            <div style={{ marginBottom: 2, paddingLeft: 12 }}>
              {item.medicamento}
            </div>
            {item.quantidade && (
              <div style={{ paddingLeft: 12 }}>
                Quantidade: {item.quantidade}
              </div>
            )}
            {item.modo_uso && (
              <div style={{ paddingLeft: 12 }}>
                {item.modo_uso}
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
        {/* QR Code — esquerda */}
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
  logoUrl?: string;
  signatureColor?: string;
  signatureImage?: string;
}>(({ data, logoUrl, signatureColor, signatureImage }, ref) => {

  const isEmitted = !!(data.codigoQR && data.codigoQR !== "RX-XXXX-XXXX");
  const qrValue = isEmitted
    ? `https://verificamed.digital/verificar/receita/${data.codigoQR}`
    : "https://verificamed.digital";

  const tipo = data.tipo_receituario || "simples";
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.simples;

  const corAssinatura = signatureColor || data.signature_color || "#1a3a6b";
  const fotoAssinatura = signatureImage || data.signature_image || "";

  // Logo: prioridade para upload do usuário, depois logo_url do data
  const logoFinal = logoUrl || data.logo_url || "";

  const viaProps = {
    data,
    logoUrl: logoFinal,
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

      {/* ── 2ª VIA (Página 2) ── */}
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
