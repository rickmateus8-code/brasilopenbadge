import { AttestationData } from "@/data/attestations";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { APP_CONFIG } from "@/config";
import { getQRCodeValue } from "@/config.qrcode";

const DEFAULT_LOGO_URL =
  "/logos/logo-default.png";

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
  /** URL/base64 da logo à esquerda */
  logoLeft?: string;
  /** URL/base64 da logo à direita */
  logoRight?: string;
  /** Cor da assinatura cursiva: "#0b109f" (azul) | "#000000" (preto) */
  signatureColor?: string;
  /** URL/base64 da foto da assinatura (sobrepõe a rubrica cursiva) */
  signatureImage?: string;
}

// Gerar rubrica cursiva a partir do nome do médico
function gerarRubrica(nome: string): string {
  if (!nome || nome === "NOME DO MÉDICO") return "Assinado";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    const inicial = partes[1].charAt(0).toUpperCase();
    return `${primeiro} <span style="font-size:0.75em;margin-left:-2px">${inicial}.</span>`;
  }
  return partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
}

// Dimensões A4 em pixels a 96dpi: 793.7 x 1122.5
// Padding: 15mm top/bottom = 56.7px, 20mm left/right = 75.6px
// Usamos escala 1.0 com mm reais via CSS
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage }, ref) => {
    const qrValue = getQRCodeValue(data.codigoQR);

    // Logo esquerda: prioridade logoLeft > logoUrl > data.logoUrl > DEFAULT
    const effectiveLogoLeft =
      logoLeft || logoUrl || (data as any).logoUrl || DEFAULT_LOGO_URL;
    // Logo direita: só exibida se fornecida
    const effectiveLogoRight = logoRight || (data as any).logoRight || "";

    const instituicao = (data as any).instituicao || "Clínica / Hospital";
    const unidade = (data as any).unidade || "Unidade de Saúde";
    const enderecoEmitente =
      (data as any).enderecoEmitente ||
      "Endereço da Clínica";
    const corAssinatura = signatureColor || (data as any).signatureColor || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || "";
    const textoAtestado = (data as any).textoAtestado || "";
    const cidDisplay = (data as any).cidDisplay || data.cid || "";
    const cidNome = (data as any).cidNome || "";
    const cidade = (data as any).cidade || "SALVADOR";
    const modoCarimbo = (data as any).modoCarimbo || false;

    // Formatar data de emissão no padrão "GUARULHOS, 19 DE MARÇO DE 2026"
    const dataFormatada = (() => {
      const d = (data as any).dataEmissaoFormatada || data.dataEmissao || "";
      return d;
    })();

    // Sexo em português
    const sexoLabel = (() => {
      const s = data.sexo?.toUpperCase();
      if (s === "MALE" || s === "M" || s === "MASCULINO") return "M";
      if (s === "FEMALE" || s === "F" || s === "FEMININO") return "F";
      return s || "______";
    })();

    // Label do documento (CPF ou CNS)
    const docLabel = (data as any).tipoDoc === "CNS" ? "Cartão Nacional:" : "CPF:";
    const docValue = data.cpf || (data as any).cns || "___________";

    return (
      <div
        ref={ref}
        id="attestation-document"
        data-pdf-export="true"
        style={{
          width: `${DOC_WIDTH_PX}px`,
          height: `${DOC_HEIGHT_PX}px`,
          background: "#ffffff",
          padding: "56px 75px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          position: "relative",
          fontFamily: "Inter, Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* ===== ESTILOS INLINE ===== */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Herr+Von+Muellerhoff&display=swap');
          #attestation-document * { box-sizing: border-box; }
        `}</style>

        {/* ===== BACKGROUND DE SEGURANÇA (pontilhado) ===== */}
        <div style={{
          backgroundImage: "radial-gradient(#ddd 1px, transparent 1px)",
          backgroundSize: "15px 15px",
          opacity: 0.3,
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }} />

        {/* ===== HEADER ===== */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          height: "80px",
          position: "relative",
          zIndex: 2,
        }}>
          {/* Logo Esquerda */}
          <div style={{ width: "160px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {effectiveLogoLeft && (
              <img
                src={effectiveLogoLeft}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              />
            )}
          </div>

          {/* Centro — Nome da Instituição */}
          <div style={{ flex: 1, padding: "0 10px", textAlign: "center" }}>
            <div style={{
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: "3px",
              color: "#000",
              letterSpacing: "-0.5px",
            }}>
              {instituicao}
            </div>
            {unidade && (
              <div style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "3px",
                color: "#000",
              }}>
                {unidade}
              </div>
            )}
            <div style={{
              fontSize: "10px",
              lineHeight: "1.2",
              color: "#333",
              fontWeight: 400,
            }}>
              {enderecoEmitente}
            </div>
          </div>

          {/* Logo Direita */}
          <div style={{ width: "160px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {effectiveLogoRight && (
              <img
                src={effectiveLogoRight}
                alt="Logo Direita"
                crossOrigin="anonymous"
                style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              />
            )}
          </div>
        </div>

        {/* ===== TÍTULO ===== */}
        <div style={{
          fontWeight: 700,
          fontSize: "24px",
          textTransform: "uppercase",
          borderBottom: "3px solid #000",
          display: "block",
          paddingBottom: "4px",
          width: "100%",
          textAlign: "center",
          marginBottom: "25px",
          marginTop: "10px",
          letterSpacing: "-0.5px",
          position: "relative",
          zIndex: 2,
          color: "#000",
        }}>
          ATESTADO MÉDICO
        </div>

        {/* ===== DADOS DO PACIENTE ===== */}
        <div style={{
          border: "1px solid #000",
          padding: "6px",
          fontSize: "11px",
          marginBottom: "5px",
          lineHeight: "1.6",
          position: "relative",
          zIndex: 2,
          background: "rgba(255,255,255,0.8)",
        }}>
          {/* Linha 1: Paciente | Sexo | Nasc */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px", marginBottom: "2px" }}>
            <div style={{ flex: 3 }}>
              <span style={{ fontWeight: 700, marginRight: "4px", color: "#000" }}>Paciente:</span>
              <span style={{ color: "#000", fontWeight: 400, textTransform: "uppercase" }}>{data.paciente}</span>
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <span style={{ fontWeight: 700, marginRight: "4px", color: "#000" }}>Sexo:</span>
              <span style={{ color: "#000", fontWeight: 400 }}>{sexoLabel}</span>
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <span style={{ fontWeight: 700, marginRight: "4px", color: "#000" }}>Nasc:</span>
              <span style={{ color: "#000", fontWeight: 400 }}>{data.nascimento}</span>
            </div>
          </div>

          {/* Linha 2: CPF/CNS | Nome da Mãe */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px", marginBottom: "2px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, marginRight: "4px", color: "#000" }}>{docLabel}</span>
              <span style={{ color: "#000", fontWeight: 400, textTransform: "uppercase" }}>{docValue}</span>
            </div>
            <div style={{ flex: 2 }}>
              <span style={{ fontWeight: 700, marginRight: "4px", color: "#000" }}>Nome da Mãe:</span>
              <span style={{ color: "#000", fontWeight: 400, textTransform: "uppercase" }}>{data.nomeMae}</span>
            </div>
          </div>

          {/* Linha 3: Endereço */}
          <div style={{ display: "flex", paddingBottom: "2px" }}>
            <div style={{ width: "100%" }}>
              <span style={{ fontWeight: 700, marginRight: "4px", color: "#000" }}>Endereço:</span>
              <span style={{ color: "#000", fontWeight: 400, textTransform: "uppercase" }}>{data.endereco}</span>
            </div>
          </div>
        </div>

        {/* ===== LINHA DO EMITENTE ===== */}
        <div style={{
          fontSize: "10px",
          marginBottom: "20px",
          textTransform: "uppercase",
          width: "100%",
          color: "#000",
          marginTop: "4px",
          fontWeight: 700,
          position: "relative",
          zIndex: 2,
        }}>
          <span style={{ fontWeight: 700 }}>Endereço Emitente: </span>
          <span style={{ fontWeight: 700 }}>{enderecoEmitente}</span>
        </div>

        {/* ===== CORPO DO TEXTO ===== */}
        <div style={{
          flex: "0 1 auto",
          fontSize: "14px",
          lineHeight: "1.8",
          textAlign: "justify",
          whiteSpace: "pre-wrap",
          padding: "20px 0",
          color: "#111",
          fontWeight: 400,
          position: "relative",
          zIndex: 2,
        }}>
          {textoAtestado || data.condicao || "Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico."}
          {cidDisplay && (
            <div style={{
              fontWeight: 700,
              fontSize: "12px",
              marginTop: "5px",
              color: "#000",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}>
              CID: {cidDisplay}{cidNome ? ` - ${cidNome}` : ""}
            </div>
          )}
        </div>

        {/* ===== RODAPÉ DIGITAL ===== */}
        {!modoCarimbo && (
          <div style={{
            borderTop: "2px solid #000",
            marginTop: "auto",
            paddingTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            position: "relative",
            zIndex: 2,
          }}>
            {/* Esquerda: cidade/data + URL validação */}
            <div style={{
              fontSize: "9px",
              color: "#000",
              lineHeight: "1.3",
              fontFamily: "Arial, Helvetica, sans-serif",
            }}>
              <div style={{ fontWeight: 700, textTransform: "uppercase" }}>
                {dataFormatada || `${cidade}, ${data.dataEmissao}`}
              </div>
              <div>Valide este documento acessando o endereço:</div>
              <strong>{APP_CONFIG.validationBaseUrl}</strong>
              <br />
              <span>Código: </span>
              <strong style={{ fontFamily: "'Courier New', monospace", letterSpacing: "3px", color: "#64748b" }}>
                {data.codigoQR}
              </strong>
            </div>

            {/* Direita: QR Code + Dados do Médico */}
            <div style={{
              border: "1px solid #000",
              padding: "5px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginLeft: "auto",
              maxWidth: "380px",
              background: "white",
            }}>
              <div style={{ flexShrink: 0, lineHeight: 0 }}>
                <QRCode
                  value={qrValue}
                  size={90}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div style={{ fontSize: "9px", textAlign: "right", lineHeight: "1.2", color: "#000" }}>
                <div>Documento assinado digitalmente conforme MP nº 2.200-2</div>
                <strong style={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>
                  {data.medico}
                </strong>
                <br />
                <span>{data.crm}</span>
                <br />
                <span style={{ fontSize: "8px" }}>{data.especialidade}</span>
                <br />
                <span>Assinado em {data.dataAssinatura} {data.horaAssinatura}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== RODAPÉ FÍSICO (CARIMBO) ===== */}
        {modoCarimbo && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            position: "relative",
            zIndex: 2,
            paddingBottom: "20px",
            marginTop: "40px",
          }}>
            {/* Data */}
            <div style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: "20px", fontSize: "11px" }}>
              {dataFormatada || `${cidade}, ${data.dataEmissao}`}
            </div>

            {/* Área de Assinatura */}
            <div style={{
              position: "relative",
              textAlign: "center",
              width: "300px",
              height: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.85,
              filter: "contrast(120%) sepia(20%)",
              transform: "rotate(-1deg)",
            }}>
              {fotoAssinatura ? (
                <img
                  src={fotoAssinatura}
                  alt="Assinatura"
                  crossOrigin="anonymous"
                  style={{ maxWidth: "250px", maxHeight: "80px", objectFit: "contain", position: "absolute", zIndex: 3 }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Herr Von Muellerhoff', cursive",
                    fontSize: "45px",
                    fontWeight: 100,
                    position: "absolute",
                    top: "-10px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(-8deg)",
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    color: corAssinatura,
                  }}
                  dangerouslySetInnerHTML={{ __html: gerarRubrica(data.medico) }}
                />
              )}

              {/* Carimbo */}
              <div style={{
                padding: "8px 25px",
                display: "inline-block",
                textAlign: "center",
                borderRadius: "4px",
                position: "relative",
                zIndex: 1,
                marginTop: "15px",
                opacity: 0.9,
                color: "rgba(0,0,0,0.69)",
              }}>
                <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "9px", display: "block" }}>
                  {data.medico}
                </span>
                <span style={{ fontWeight: "bold", fontSize: "9px", display: "block", marginTop: "2px" }}>
                  {data.crm}
                </span>
                <span style={{ fontSize: "9px", textTransform: "uppercase", display: "block", marginTop: "3px" }}>
                  {data.especialidade}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
