import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { getQRCodeValue } from "@/config.qrcode";

interface AttestationData {
  id: string;
  paciente: string;
  sexo: string;
  nascimento: string;
  cpf?: string;
  cns?: string;
  tipoDoc?: "CPF" | "CNS";
  nomeMae: string;
  endereco: string;
  condicao?: string;
  vacinacao?: string;
  cid?: string;
  codigoQR: string;
  dataAssinatura: string;
  horaAssinatura: string;
  medico: string;
  crm: string;
  especialidade: string;
  dataEmissao: string;
  [key: string]: any;
}

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
  logoLeft?: string;
  logoRight?: string;
  signatureColor?: string;
  signatureImage?: string;
  documentType?: 'atestado' | 'laudo';
  logoLeftScale?: number;
  logoRightScale?: number;
  logoLeftX?: number;
  logoLeftY?: number;
  logoRightX?: number;
  logoRightY?: number;
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

// Dimensões A4 exatas em pixels a 96dpi
// A4 = 210mm × 297mm → 794px × 1123px
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;
const PAD_H = 56;  // ~15mm top/bottom
const PAD_V = 60;  // ~16mm left/right

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage, documentType, logoLeftScale = 1, logoRightScale = 1, logoLeftX = 0, logoLeftY = 0, logoRightX = 0, logoRightY = 0 }, ref) => {
    const isEmitted = data.codigoQR && data.codigoQR !== "XXXX.XXXX";
    // QR Code aponta para validaratestado.digital/validar?codigo=XXXX&data=YYYY-MM-DD
    // A data no banco está em DD/MM/YYYY — converte para YYYY-MM-DD para o parâmetro da URL
    const dataEmissaoForQR = data.dataEmissao
      ? (() => {
          const d = String(data.dataEmissao).trim();
          // Formato DD/MM/YYYY → YYYY-MM-DD
          const parts = d.split("/");
          if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
          // Se já vier em YYYY-MM-DD, retorna direto
          return d.substring(0, 10);
        })()
      : undefined;
    const qrValue = isEmitted
      ? getQRCodeValue(data.codigoQR, dataEmissaoForQR)
      : "https://validaratestado.digital";

    const effectiveLogoLeft = logoLeft || logoUrl || (data as any).logoUrl || "";
    const effectiveLogoRight = logoRight || (data as any).logoRight || "";

    const instituicao = (data as any).instituicao || "";
    const unidade = (data as any).unidade || "";
    const enderecoEmitente = (data as any).enderecoEmitente || "";
    const corAssinatura = signatureColor || (data as any).signatureColor || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || "";
    const textoAtestado = (data as any).textoAtestado || "";
    const cidDisplay = (data as any).cidDisplay || data.cid || "";
    const cidNome = (data as any).cidNome || "";
    const cidade = (data as any).cidade || "";
    const modoCarimbo = (data as any).modoCarimbo || false;
    const docType = (documentType || (data as any).documentType || (data as any).document_type || 'atestado').toLowerCase();
    const prefeituraLabel = cidade ? `PREFEITURA DE ${cidade.toUpperCase()}` : "";

    // Tipo de documento do paciente
    const tipoDoc = (data as any).tipoDoc || "CPF";
    const docLabel = tipoDoc === "CNS" ? "Cartão Nacional:" : "CPF:";
    const docValue = tipoDoc === "CNS"
      ? (data.cns || data.cpf || "___________")
      : (data.cpf || data.cns || "___________");

    // Data de emissão formatada
    const dataFormatada = (data as any).dataEmissaoFormatada || (() => {
      const d = data.dataEmissao || "";
      if (!d || d.length < 10) return d;
      const parts = d.split("/");
      if (parts.length === 3) {
        const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        const dia = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const ano = parts[2];
        // Validar se dia e mês são válidos para evitar NaN
        if (isNaN(dia) || isNaN(m) || m < 0 || m > 11 || dia < 1 || dia > 31) return d;
        return cidade
          ? `${cidade}, ${dia} DE ${meses[m]} DE ${ano}`
          : `${dia} DE ${meses[m]} DE ${ano}`;
      }
      return d;
    })();

    // Sexo em português
    const sexoLabel = (() => {
      const s = data.sexo?.toUpperCase();
      if (s === "MALE" || s === "M" || s === "MASCULINO") return "M";
      if (s === "FEMALE" || s === "F" || s === "FEMININO") return "F";
      return s || "______";
    })();

    return (
      <div
        ref={ref}
        id="attestation-document"
        data-pdf-export="true"
        style={{
          width: `${DOC_WIDTH_PX}px`,
          minHeight: `${DOC_HEIGHT_PX}px`,
          height: `${DOC_HEIGHT_PX}px`,
          background: "#ffffff !important",
          backgroundColor: "#ffffff",
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
        {/* Marca d'água para Preview — Não interfere no texto real nem na exportação final se o ID for real */}
        {(data.id === "XXXX.XXXX" || (data as any).codigoQR === "XXXX.XXXX") && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 60, // Reduzido em 30% conforme solicitado
            fontWeight: 900,
            color: "rgba(220, 38, 38, 0.08)", // Vermelho sutil e transparente
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            zIndex: 0, // No background, não sobrepõe textos
          }}>
            INVALIDO - NÃO EMITIDO - PRÉVIA
          </div>
        )}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&family=Courier+Prime:wght@400;700&display=swap');
          #attestation-document * { box-sizing: border-box; }
          #attestation-document .courier-prime { font-family: 'Courier Prime', 'Courier New', monospace !important; }
        `}</style>



        {/* ===== HEADER ===== */}
        <div id="preview-header" style={{
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
          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", flexShrink: 0, overflow: "visible" }}>
            {effectiveLogoLeft && (
              <img
                src={effectiveLogoLeft}
                alt="Logo"
                crossOrigin="anonymous"
                style={{
                  maxHeight: "100%",
                  maxWidth: 154,
                  objectFit: "contain",
                  transform: `scale(${logoLeftScale}) translate(${logoLeftX}px, ${logoLeftY}px)`,
                  transformOrigin: "left center",
                  transition: "transform 0.1s",
                }}
              />
            )}
          </div>

          {/* Centro — Nome da Instituição / Unidade / Endereço */}
          <div style={{ flex: 1, padding: "0 12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {instituicao && (
              <div style={{ fontSize: 14.7, fontWeight: 700, textTransform: "uppercase", marginBottom: 2, color: "#000", letterSpacing: 0, lineHeight: 1.3 }}>
                {instituicao}
              </div>
            )}
            {unidade && (
              <div style={{ fontSize: 12.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 2, color: "#000", lineHeight: 1.3 }}>
                {unidade}
              </div>
            )}
            {enderecoEmitente && (
              <div style={{ fontSize: 10.5, fontWeight: 400, textTransform: "uppercase", color: "#000", lineHeight: 1.3 }}>
                {enderecoEmitente}
              </div>
            )}
          </div>

          {/* Logo Direita */}
          <div style={{ width: 154, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, overflow: "visible" }}>
            {effectiveLogoRight && (
              <img
                src={effectiveLogoRight}
                alt="Logo Direita"
                crossOrigin="anonymous"
                style={{
                  maxHeight: "100%",
                  maxWidth: 154,
                  objectFit: "contain",
                  transform: `scale(${logoRightScale}) translate(${logoRightX}px, ${logoRightY}px)`,
                  transformOrigin: "right center",
                  transition: "transform 0.1s",
                }}
              />
            )}
          </div>
        </div>

        {/* ===== TÍTULO ===== */}
        <div style={{
          fontWeight: 900,
          fontSize: 23.15, // Aumentado em 5% (22.05 * 1.05)
          textTransform: "uppercase",
          borderTop: "none",
          borderBottom: "none",
          display: "block",
          padding: "0",
          width: "100%",
          textAlign: "center",
          marginTop: 12,
          marginBottom: 2, // Aproximado da linha inferior
          letterSpacing: 0, // Removido espaçamento
          position: "relative",
          zIndex: 2,
          color: "#000",
          flexShrink: 0,
        }}>
          {docType === 'laudo' ? (
            <div style={{ fontSize: 23.15, fontWeight: 900 }}>LAUDO MÉDICO</div>
          ) : (
            <div style={{ fontSize: 23.15, fontWeight: 900 }}>ATESTADO MÉDICO</div>
          )}
        </div>

        {/* Moldura Superior (Linha Preta) */}
        <div style={{
          borderTop: "2.04px solid #000", // Grossura aumentada em 2% (2 * 1.02)
          width: "100%",
          marginBottom: 25,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
        }} />

        {/* ===== DADOS DO PACIENTE ===== */}
        <div id="preview-patient" style={{
          border: "1px solid #000",
          padding: "8px 12px", // Ajustado para centralização
          fontSize: 10.815, // Aumentado em 3% (10.5 * 1.03)
          marginBottom: 10,
          lineHeight: 1.7,
          position: "relative",
          zIndex: 2,
          background: "#fff",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // Centralização vertical total
        }}>
          {/* Linha 1: Paciente | Sexo | Nasc */}
          <div style={{ display: "flex", gap: 12, marginBottom: 3, justifyContent: "center" }}>
            <div style={{ flex: 3 }}>
              <span style={{ fontWeight: 700, color: "#000" }}>Paciente: </span>
              <span style={{ color: "#000", textTransform: "uppercase" }}>{data.paciente}</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "#000" }}>Sexo: </span>
              <span style={{ color: "#000" }}>{sexoLabel}</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "#000" }}>Nasc.: </span>
              <span style={{ color: "#000" }}>{data.nascimento}</span>
            </div>
          </div>

          {/* Linha 2: CPF/CNS | Nome da Mãe */}
          <div style={{ display: "flex", gap: 12, marginBottom: 3, justifyContent: "center" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: "#000" }}>{docLabel} </span>
              <span style={{ color: "#000", textTransform: "uppercase" }}>{docValue}</span>
            </div>
            <div style={{ flex: 2 }}>
              <span style={{ fontWeight: 700, color: "#000" }}>Nome da Mãe: </span>
              <span style={{ color: "#000", textTransform: "uppercase" }}>{data.nomeMae}</span>
            </div>
          </div>

          {/* Linha 3: Endereço */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%" }}>
              <span style={{ fontWeight: 700, color: "#000" }}>Endereço: </span>
              <span style={{ color: "#000", textTransform: "uppercase" }}>{data.endereco}</span>
            </div>
          </div>
        </div>

        {/* Endereço Emitente (Opcional) */}
        {effectiveLogoLeft && (
          <div style={{
            fontSize: 10.5,
            lineHeight: 1.2,
            fontFamily: "Arial, Helvetica, sans-serif",
            textAlign: "left",
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
            marginBottom: 20, 
            fontWeight: 700,
            textTransform: "uppercase"
          }}>
            ENDEREÇO EMITENTE: {enderecoEmitente}
          </div>
        )}

        {/* ===== CORPO DO TEXTO ===== */}
        <div id="preview-body" style={{
          flex: "1 1 auto",
          fontSize: 15.18, // Aumentado em 3% (14.74 * 1.03)
          lineHeight: 1.9,
          textAlign: "justify",
          position: "relative",
          zIndex: 2,
          paddingTop: 48,
          paddingBottom: 8,
          color: "#111",
          fontWeight: 400,
        }}>
          {/* Parágrafo com recuo extra (+2 espaços) */}
          <p style={{
            margin: 0,
            textIndent: "4em", // Aumentado de 3em para 4em para refletir os 2 espaços extras
            lineHeight: 1.9,
            whiteSpace: "pre-wrap",
          }}>
            {"  "}{textoAtestado || "Atesto para os devidos fins que o(a) paciente acima identificado(a) compareceu a esta unidade de saúde na data de hoje para atendimento médico. Necessita de 04 (quatro) dias de afastamento de suas atividades laborais para repouso e tratamento de saúde."}
          </p>

          {cidDisplay && (
            <div style={{
              fontWeight: 700,
              fontSize: 15.18, // Igualado ao corpo do texto
              marginTop: 28,
              color: "#000",
              textTransform: "uppercase",
            }}>
              CID: {cidDisplay}{cidNome ? ` — ${cidNome}` : ""}
            </div>
          )}
        </div>

        {/* ===== RODAPÉ DIGITAL ===== */}
        {!modoCarimbo && (
          <div id="preview-footer" style={{
            marginTop: "auto",
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 0,
            paddingRight: 0,
            marginLeft: 0,
            marginRight: 0,
          }}>
            {/* Linha de divisão do cabeçalho — separa o corpo do rodapé */}
            <div style={{ borderTop: "2px solid #000", marginBottom: 6 }} />

            {/* Linha do rodapé: bloco data/validação à esquerda + moldura QR+médico à direita */}
            <div style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-end",
              gap: 0,
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: 0,
              paddingRight: 0,
            }}>
              {/* Esquerda: cidade/data + URL validação — AJUSTADO PARA ALINHAMENTO PERFEITO NA BASE */}
              <div style={{ 
                color: "#000", 
                lineHeight: 1.2, 
                fontFamily: "Arial, Helvetica, sans-serif", 
                flexShrink: 0, 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "flex-end", 
                marginRight: "auto", 
                height: 111, 
                boxSizing: "border-box", 
                paddingLeft: 2,
                paddingBottom: 2, // Espaçamento de segurança para não ultrapassar a linha inferior
                overflow: "hidden" // Garantir que o texto nunca vaze para baixo
              }}>
                <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 10.42, marginBottom: 3 }}>
                  {dataFormatada || data.dataEmissao}
                </div>
                <div style={{ fontSize: 9.85 }}>Valide este documento acessando o endereço:</div>
                <strong style={{ fontSize: 10.42, display: "block", marginBottom: 3 }}>https://validaratestado.digital</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "nowrap" }}>
                  <span style={{ fontWeight: 400, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 9.85, whiteSpace: "nowrap", lineHeight: 1 }}>Código:</span>
                  <strong style={{ fontSize: 10.42, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1, marginLeft: "2px" }}>
                    {isEmitted ? data.codigoQR : "****.****"}
                  </strong>
                </div>
              </div>

              {/* Moldura: 385×111px | QR centralizado à esquerda | texto à DIREITA */}
              <div style={{
                border: "1px solid #000",
                width: 385,
                height: 111,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "stretch",
                background: "white",
                flex: "0 0 auto",
                overflow: "hidden",
                marginLeft: "auto",
                marginRight: 0,
              }}>
                {/* Coluna esquerda: QR centralizado | padding 6px left/right, 19px top/bottom */}
                <div style={{ width: 108, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "19px 6px" }}>
                  {isEmitted ? (
                    <QRCode
                      value={qrValue}
                      size={96}
                      level="H"
                      includeMargin={false}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ filter: isEmitted ? 'none' : 'blur(4px)', opacity: isEmitted ? 1 : 0.5, lineHeight: 0 }}>
                        <QRCode
                          value="https://validaratestado.digital"
                          size={96}
                          level="H"
                          includeMargin={false}
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                          style={{ display: "block" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Coluna direita: texto médico alinhado à DIREITA, centralizado verticalmente */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", textAlign: "right", lineHeight: 1.2, color: "#000", paddingRight: 10 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 400, whiteSpace: "nowrap" }}>Documento assinado digitalmente conforme MP nº 2.200-2</div>
                  <strong style={{ fontWeight: 700, fontSize: 11.2, textTransform: "uppercase", display: "block" }}>
                    {data.medico}
                  </strong>
                  <span style={{ display: "block", fontSize: 10.1 }}>{data.crm}</span>
                  <span style={{ fontSize: 10.1, display: "block", textTransform: "uppercase" }}>{data.especialidade}</span>
                  <span style={{ display: "block", fontSize: 10.1 }}>
                    Assinado em {data.dataAssinatura} {data.horaAssinatura}
                  </span>
                </div>
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
            paddingBottom: 46,
            marginTop: "auto",
            flexShrink: 0,
          }}>
            <div style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 30, fontSize: 11 }}>
              {dataFormatada || data.dataEmissao}
            </div>

            <div style={{
              position: "relative",
              textAlign: "center",
              width: 300,
              height: 90,
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
                  style={{ maxWidth: 240, maxHeight: 75, objectFit: "contain", position: "absolute", zIndex: 3 }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Herr Von Muellerhoff', cursive",
                    fontSize: 44,
                    fontWeight: 100,
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%) rotate(-8deg)",
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    color: corAssinatura,
                  }}
                  dangerouslySetInnerHTML={{ __html: gerarRubrica(data.medico) }}
                />
              )}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 220,
                height: 1,
                background: "#000",
                zIndex: 1,
              }} />
            </div>

            <div style={{ textAlign: "center", marginTop: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{data.medico}</div>
              <div style={{ fontSize: 10 }}>{data.crm}</div>
              <div style={{ fontSize: 9, color: "#555" }}>{data.especialidade}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
export type { AttestationData };
