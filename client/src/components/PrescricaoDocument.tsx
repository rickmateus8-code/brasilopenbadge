/**
 * PrescricaoDocument — Documento visual de Receituário Médico
 *
 * Suporta 3 tipos de receituário:
 * - Simples: branco, sem tarja
 * - Controle Especial (Tarja Amarela): 2 vias, retenção na farmácia
 * - Antimicrobiano (Tarja Azul): notificação obrigatória
 *
 * Layout A4 (794px × 1123px @ 96dpi) idêntico ao AttestationDocument.
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

// Dimensões A4 exatas em pixels a 96dpi
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;
const PAD_H = 48;
const PAD_V = 56;

function gerarRubrica(nome: string): string {
  if (!nome || nome === "NOME DO MÉDICO") return "Assinado";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    const inicial = partes[1].charAt(0).toUpperCase();
    return `${primeiro} ${inicial}.`;
  }
  return partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
}

const TIPO_CONFIG = {
  simples: {
    label: "RECEITUÁRIO MÉDICO",
    sublabel: "",
    headerBg: "#ffffff",
    headerColor: "#000000",
    tarjaColor: "",
    tarjaLabel: "",
  },
  controle_especial: {
    label: "RECEITUÁRIO DE CONTROLE ESPECIAL",
    sublabel: "Portaria SVS/MS nº 344/98 — 2ª via (Farmácia)",
    headerBg: "#fffbeb",
    headerColor: "#92400e",
    tarjaColor: "#f59e0b",
    tarjaLabel: "TARJA AMARELA — RETENÇÃO NA FARMÁCIA",
  },
  antimicrobiano: {
    label: "RECEITUÁRIO ANTIMICROBIANO",
    sublabel: "RDC ANVISA nº 20/2011 — Notificação Obrigatória",
    headerBg: "#eff6ff",
    headerColor: "#1e40af",
    tarjaColor: "#3b82f6",
    tarjaLabel: "TARJA AZUL — ANTIMICROBIANO",
  },
};

const PrescricaoDocument = forwardRef<HTMLDivElement, {
  data: PrescricaoData;
  logoLeft?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
}>(({ data, logoLeft, logoRight, signatureColor, signatureImage }, ref) => {
  const isEmitted = data.codigoQR && data.codigoQR !== "RX-XXXX-XXXX";
  const qrValue = isEmitted
    ? `https://validaratestado.digital/receita/${data.codigoQR}`
    : "https://validaratestado.digital";

  const tipo = data.tipo_receituario || "simples";
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.simples;

  const corAssinatura = signatureColor || data.signature_color || "#0b109f";
  const fotoAssinatura = signatureImage || data.signature_image || "";
  const rubrica = gerarRubrica(data.medico || "");

  const dataFormatada = (() => {
    const d = data.data_emissao || "";
    if (!d || d.length < 10) return d;
    const parts = d.split("/");
    if (parts.length === 3) {
      const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
      const m = parseInt(parts[1]) - 1;
      const cidade = data.cidade || "";
      return cidade
        ? `${cidade}, ${parseInt(parts[0])} DE ${meses[m] || parts[1]} DE ${parts[2]}`
        : `${parseInt(parts[0])} DE ${meses[m] || parts[1]} DE ${parts[2]}`;
    }
    return d;
  })();

  return (
    <div
      ref={ref}
      id="prescricao-document"
      data-pdf-export="true"
      style={{
        width: `${DOC_WIDTH_PX}px`,
        minHeight: `${DOC_HEIGHT_PX}px`,
        height: `${DOC_HEIGHT_PX}px`,
        background: "#ffffff",
        paddingTop: `${PAD_H}px`,
        paddingBottom: `${PAD_H}px`,
        paddingLeft: `${PAD_V}px`,
        paddingRight: `${PAD_V}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&display=swap');
        #prescricao-document * { box-sizing: border-box; }
      `}</style>

      {/* Background de segurança */}
      <div style={{
        backgroundImage: "radial-gradient(#ddd 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        opacity: 0.25,
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      {/* Tarja colorida (controle especial / antimicrobiano) */}
      {cfg.tarjaColor && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 8,
          background: cfg.tarjaColor,
          zIndex: 10,
        }} />
      )}

      {/* ===== HEADER ===== */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        height: 80,
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
      }}>
        {/* Logo Esquerda */}
        <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexShrink: 0 }}>
          {logoLeft && (
            <img src={logoLeft} alt="Logo" crossOrigin="anonymous"
              style={{ maxHeight: "100%", maxWidth: 154, objectFit: "contain" }} />
          )}
        </div>

        {/* Centro */}
        <div style={{ flex: 1, padding: "0 12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {data.instituicao && (
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", marginBottom: 1, color: "#000", letterSpacing: 0.5, lineHeight: 1.3 }}>
              {data.instituicao}
            </div>
          )}
          {data.unidade && (
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 1, color: "#000", lineHeight: 1.3 }}>
              {data.unidade}
            </div>
          )}
          {data.endereco_emitente && (
            <div style={{ fontSize: 10, fontWeight: 400, textTransform: "uppercase", color: "#000", lineHeight: 1.3 }}>
              {data.endereco_emitente}
            </div>
          )}
        </div>

        {/* Logo Direita */}
        <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
          {logoRight && (
            <img src={logoRight} alt="Logo Direita" crossOrigin="anonymous"
              style={{ maxHeight: "100%", maxWidth: 154, objectFit: "contain" }} />
          )}
        </div>
      </div>

      {/* Linha separadora */}
      <div style={{ borderTop: "2px solid #000", marginBottom: 8, position: "relative", zIndex: 2 }} />

      {/* Título do Receituário */}
      <div style={{
        textAlign: "center",
        marginBottom: 10,
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: cfg.headerColor || "#000",
          background: cfg.tarjaColor ? `${cfg.tarjaColor}22` : "transparent",
          padding: cfg.tarjaColor ? "4px 16px" : "0",
          borderRadius: 4,
          display: "inline-block",
        }}>
          {cfg.label}
        </div>
        {cfg.sublabel && (
          <div style={{ fontSize: 9.5, color: cfg.headerColor || "#666", marginTop: 2, fontWeight: 600 }}>
            {cfg.sublabel}
          </div>
        )}
        {cfg.tarjaLabel && (
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#fff",
            background: cfg.tarjaColor,
            padding: "2px 10px",
            borderRadius: 3,
            display: "inline-block",
            marginTop: 4,
            letterSpacing: 0.5,
          }}>
            {cfg.tarjaLabel}
          </div>
        )}
      </div>

      {/* ===== DADOS DO PACIENTE ===== */}
      <div style={{
        border: "1px solid #000",
        padding: "7px 10px",
        fontSize: 10.5,
        marginBottom: 8,
        lineHeight: 1.7,
        position: "relative",
        zIndex: 2,
        background: "rgba(255,255,255,0.9)",
        flexShrink: 0,
      }}>
        <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", marginBottom: 4, color: "#005CA9", borderBottom: "1px solid #e5e7eb", paddingBottom: 3 }}>
          Identificação do Paciente
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
          <div style={{ flex: 3 }}>
            <span style={{ fontWeight: 700 }}>Paciente: </span>
            <span style={{ textTransform: "uppercase" }}>{data.paciente || "NOME DO PACIENTE"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
          {data.cpf && (
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700 }}>CPF: </span>
              <span>{data.cpf}</span>
            </div>
          )}
          {data.identidade && (
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700 }}>RG/Identidade: </span>
              <span>{data.identidade}</span>
            </div>
          )}
          {data.telefone && (
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700 }}>Tel: </span>
              <span>{data.telefone}</span>
            </div>
          )}
        </div>
        {data.endereco && (
          <div>
            <span style={{ fontWeight: 700 }}>Endereço: </span>
            <span style={{ textTransform: "uppercase" }}>{data.endereco}</span>
          </div>
        )}
      </div>

      {/* ===== PRESCRIÇÃO ===== */}
      <div style={{
        flex: "1 1 auto",
        position: "relative",
        zIndex: 2,
        paddingTop: 4,
        paddingBottom: 8,
        overflow: "hidden",
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 10,
          textTransform: "uppercase",
          color: "#005CA9",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 3,
          marginBottom: 10,
        }}>
          Prescrição Médica
        </div>

        {(data.prescricao || []).map((item, idx) => (
          <div key={idx} style={{
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: idx < (data.prescricao || []).length - 1 ? "1px dashed #d1d5db" : "none",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {/* Número */}
              <div style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#005CA9",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {item.numero || idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                {/* Uso interno/externo */}
                <div style={{ fontSize: 9, fontWeight: 700, color: item.uso_interno ? "#059669" : "#7c3aed", marginBottom: 2, textTransform: "uppercase" }}>
                  {item.uso_interno ? "● USO INTERNO" : "○ USO EXTERNO"}
                </div>
                {/* Nome do medicamento */}
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#000", lineHeight: 1.4, marginBottom: 3 }}>
                  {item.medicamento || "MEDICAMENTO"}
                </div>
                {/* Quantidade */}
                {item.quantidade && (
                  <div style={{ fontSize: 11, color: "#374151", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>Qtd.: </span>{item.quantidade}
                  </div>
                )}
                {/* Modo de uso */}
                {item.modo_uso && (
                  <div style={{ fontSize: 11, color: "#374151", fontStyle: "italic" }}>
                    {item.modo_uso}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!data.prescricao || data.prescricao.length === 0) && (
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", paddingTop: 20 }}>
            Adicione medicamentos à prescrição
          </div>
        )}
      </div>

      {/* ===== RODAPÉ ===== */}
      <div style={{
        borderTop: "2px solid #000",
        marginTop: "auto",
        paddingTop: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
        gap: 16,
      }}>
        {/* Esquerda: data + URL validação */}
        <div style={{ fontSize: 9, color: "#000", lineHeight: 1.6, fontFamily: "Arial, Helvetica, sans-serif", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 1, fontSize: 9 }}>
            {dataFormatada || data.data_emissao || ""}
          </div>
          <div style={{ fontSize: 8.5 }}>Valide este documento acessando o endereço:</div>
          <strong style={{ fontSize: 9, display: "block" }}>https://validaratestado.digital</strong>
          <div style={{ marginTop: 1 }}>
            <span style={{ fontWeight: 400, fontSize: 8.5 }}>Código: </span>
            <strong style={{ fontFamily: "'Courier New', monospace", letterSpacing: 1, fontSize: 9 }}>
              {isEmitted ? data.codigoQR : "Gerado após emissão"}
            </strong>
          </div>
        </div>

        {/* Centro: Assinatura */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          minWidth: 0,
        }}>
          {fotoAssinatura ? (
            <img
              src={fotoAssinatura}
              alt="Assinatura"
              crossOrigin="anonymous"
              style={{ maxWidth: 180, maxHeight: 55, objectFit: "contain", marginBottom: 4, filter: `drop-shadow(0 0 0 ${corAssinatura})`, opacity: 0.9 }}
            />
          ) : (
            <div
              style={{
                fontFamily: "'Herr Von Muellerhoff', cursive",
                fontSize: 38,
                color: corAssinatura,
                lineHeight: 1,
                marginBottom: 2,
                opacity: 0.85,
                filter: "contrast(120%) sepia(20%)",
                transform: "rotate(-1deg)",
              }}
              dangerouslySetInnerHTML={{ __html: rubrica }}
            />
          )}
          <div style={{ borderTop: "1.5px solid #000", width: 200, textAlign: "center", paddingTop: 3 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>{data.medico || "NOME DO MÉDICO"}</div>
            <div style={{ fontSize: 9 }}>{data.crm || "CRM/UF 00000"}</div>
            {data.especialidade && <div style={{ fontSize: 9, textTransform: "uppercase" }}>{data.especialidade}</div>}
          </div>
        </div>

        {/* Direita: QR Code */}
        <div style={{
          border: "1.75px solid #000",
          padding: "6px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "center",
          background: "white",
          flex: "0 0 auto",
        }}>
          {isEmitted ? (
            <QRCode
              value={qrValue}
              size={80}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          ) : (
            <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
              <div style={{ filter: "blur(3.5px) brightness(0.8)", opacity: 0.55, lineHeight: 0 }}>
                <QRCode value="https://validaratestado.digital" size={80} level="H" includeMargin={false} fgColor="#1a1a1a" bgColor="#FFFFFF" />
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.35)" }}>
                <span style={{ fontSize: 7, color: "#374151", textAlign: "center", fontWeight: 700, lineHeight: 1.3, padding: "0 4px" }}>Após emissão</span>
              </div>
            </div>
          )}
          <div style={{ fontSize: 7.5, color: "#555", textAlign: "center" }}>Documento assinado<br/>digitalmente MP 2.200-2</div>
        </div>
      </div>
    </div>
  );
});

PrescricaoDocument.displayName = "PrescricaoDocument";
export default PrescricaoDocument;
