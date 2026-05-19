import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { getQRCodeValue } from "@/config.qrcode";
import { ATTESTATION_LAYOUT } from "@/config/attestationLayout";

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
  stampScale?: number;
  stampX?: number;
  stampY?: number;
  stampRotate?: number;
  hideQRCode?: boolean;
  showStampInfo?: boolean;
  isExporting?: boolean;
}

// Gerar rubrica cursiva a partir do nome do médico
// ... rest of helper functions ...

// Dimensões A4 exatas em pixels a 96dpi
// A4 = 210mm × 297mm → 794px × 1123px
const DOC_WIDTH_PX = 794;
const DOC_HEIGHT_PX = 1123;
const PAD_H = 56;  // ~15mm top/bottom
const PAD_V = 60;  // ~16mm left/right

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ 
    data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage, documentType, 
    logoLeftScale = 1, logoRightScale = 1, logoLeftX = 0, logoLeftY = 0, logoRightX = 0, logoRightY = 0,
    stampScale, stampX, stampY, stampRotate, hideQRCode, showStampInfo,
    isExporting = false
  }, ref) => {
    const isEmitted = data.codigoQR && data.codigoQR !== "XXXX.XXXX";
    // QR Code aponta para validaratestado.digital/validar?codigo=XXXX&data=YYYY-MM-DD
    // A data no banco está em DD/MM/YYYY — converte para YYYY-MM-DD para o parâmetro da URL
    // PRIORIDADE: Data da Emissão (Assinatura) conforme solicitado pelo usuário
    const rawDateToUse = data.dataAssinatura || data.dataEmissao || "";
    const dataEmissaoForQR = rawDateToUse
      ? (() => {
          const d = String(rawDateToUse).trim();
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

    const getCrossOrigin = (url: string) => {
      if (!url || url.startsWith("data:") || url.startsWith("/")) return undefined;
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === window.location.hostname) return undefined;
      } catch {
        return undefined;
      }
      return "anonymous";
    };

    const effectiveLogoLeft = logoLeft || logoUrl || (data as any).logoUrl || (data as any).logo_url || "";
    const effectiveLogoRight = logoRight || (data as any).logoRight || (data as any).logo_right || "";

    const instituicao = (data as any).instituicao || "";
    const unidade = (data as any).unidade || "";
    const enderecoEmitente = (data as any).enderecoEmitente || (data as any).endereco_emitente || "";
    const corAssinatura = signatureColor || (data as any).signatureColor || (data as any).signature_color || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || (data as any).signature_image || "";
    const textoAtestado = (data as any).textoAtestado || (data as any).texto_atestado || "";
    const cidDisplay = (data as any).cidDisplay || (data as any).cid_display || data.cid || "";
    const cidNome = (data as any).cidNome || (data as any).cid_nome || "";
    const cidade = (data as any).cidade || "";
    const modoCarimbo = (data as any).modoCarimbo || (data as any).modo_carimbo || false;

    // --- CONFIGURAÇÃO CENTRALIZADA (CÉREBRO ÚNICO) ---
    const layout = ATTESTATION_LAYOUT;

    // Extrair parâmetros de layout com fallbacks da config global
    const sScale = stampScale ?? (data as any).stampScale ?? (data as any).stamp_scale ?? layout.stamp.defaultScale;
    const sX = stampX ?? (data as any).stampX ?? (data as any).stamp_x ?? layout.stamp.defaultX;
    const sY = stampY ?? (data as any).stampY ?? (data as any).stamp_y ?? layout.stamp.defaultY;
    const sRotate = stampRotate ?? (data as any).stampRotate ?? (data as any).stamp_rotate ?? layout.stamp.defaultRotate;
    const hQRCode = hideQRCode || (data as any).hideQRCode || (data as any).hide_qr_code === 1;
    const sStampInfo = showStampInfo && ((data as any).showStampInfo !== false && (data as any).show_stamp_info !== 0);

    const docType = (documentType || (data as any).documentType || (data as any).document_type || (data as any).tipo || 'atestado').toLowerCase();
    
    const dataAssinatura = data.dataAssinatura || (data as any).data_assinatura || "";
    const horaAssinatura = data.horaAssinatura || (data as any).hora_assinatura || "";
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
          backgroundColor: "#ffffff",
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
          <div data-html2canvas-ignore="true" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 48.6, // Reduzido em 10% (54 * 0.9)
            fontWeight: 900,
            color: "rgba(220, 38, 38, 0.08)", // Vermelho sutil e transparente
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            zIndex: 99, // Alterado para 99 para sobrepor todos os elementos (molduras, textos, logos)
          }}>
            DOCUMENTO INVALIDO - NÃO EMITIDO - PRÉVIA
          </div>
        )}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&family=Courier+Prime:wght@400;700&display=swap');
          #attestation-document * { box-sizing: border-box; }
          #attestation-document .courier-prime { font-family: 'Courier Prime', 'Courier New', monospace !important; }
        `}</style>



        {/* ===== HEADER (LOGOS APENAS) ===== */}
        <div id="preview-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 0,
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
                crossOrigin={getCrossOrigin(effectiveLogoLeft)}
                style={{
                  maxHeight: "100%",
                  maxWidth: 149.38, // Reduzido em 3% (154 * 0.97)
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
            {unidade && unidade !== instituicao && (
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
          <div style={{ width: 149.38, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, overflow: "visible" }}>
            {effectiveLogoRight && (
              <img
                src={effectiveLogoRight}
                alt="Logo Direita"
                crossOrigin={getCrossOrigin(effectiveLogoRight)}
                style={{
                  maxHeight: "100%",
                  maxWidth: 149.38, // Reduzido em 3%
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
          fontSize: 23.15, 
          textTransform: "uppercase",
          borderTop: "none",
          borderBottom: "none",
          display: "block",
          padding: "0",
          width: "100%",
          textAlign: "center",
          marginTop: 15, // Aumentado de 12 para 15 (+3) conforme solicitado
          marginBottom: 11, // Aumentado de 8 para 11 (+3) conforme solicitado
          lineHeight: 1, 
          letterSpacing: 0, 
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
          borderTop: "2.04px solid #000", 
          width: "100%",
          marginBottom: 23, // Aumentado de 20 para 23 (+3) conforme solicitado
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
        }} />

        {/* ===== DADOS DO PACIENTE ===== */}
        <div id="preview-patient" style={{
          border: "1px solid #000",
          // Ajuste de centralização vertical estrita para EXPORTAÇÃO (html2canvas offset)
          // O usuário reportou que sai muito pra baixo, então reduzimos o padding-top e aumentamos o bottom significativamente na exportação.
          padding: isExporting ? "6px 15px 22px 15px" : "14.25px 15px", 
          boxSizing: "border-box",
          fontSize: 10.815,
          marginBottom: 10,
          lineHeight: 1.2, 
          gap: 4,
          position: "relative",
          zIndex: 2,
          background: "#fff",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>          {/* Linha 1: Paciente | Sexo | Nasc */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
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
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
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
        {enderecoEmitente && (
          <div style={{
            fontSize: 10.5,
            lineHeight: 1.2,
            fontFamily: "Arial, Helvetica, sans-serif",
            textAlign: "left",
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
            marginTop: isExporting ? -42 : -2, // Subido ~4% total (~40px) na exportação
            marginBottom: isExporting ? 62 : 22, // Compensa o deslocamento para manter o corpo do texto estável
            color: "#000",
            textTransform: "uppercase"
          }}>
            <span style={{ fontWeight: 700 }}>ENDEREÇO EMITENTE:</span> <span style={{ fontWeight: 400 }}>{enderecoEmitente}</span>
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
          color: "#000",
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
              fontSize: 13.42, // Reduzido em 1% adicional (13.56 * 0.99)
              marginTop: 28,
              color: "#000",
              textTransform: "uppercase",
            }}>
              CID: {cidDisplay}{cidNome ? ` — ${cidNome}` : ""}
            </div>
          )}
        </div>

        {/* ===== RODAPÉ DIGITAL ===== */}
        {!hQRCode && (
          <div id="preview-footer" style={{
            marginTop: modoCarimbo ? 20 : "auto",
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
              {/* Esquerda: cidade/data + URL validação — AJUSTADO PARA ALINHAMENTO NA BASE DA MOLDURA */}
              <div style={{ 
                color: "#000", 
                lineHeight: 1.2, 
                fontFamily: "Arial, Helvetica, sans-serif", 
                flexShrink: 0, 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "flex-end", // Alinhado ao limite inferior (base da moldura)
                marginRight: "auto", 
                height: 111, 
                boxSizing: "border-box", 
                paddingLeft: 2,
                paddingBottom: 4, // Modificado de 2 para 4 para não cortar letras como 'g'
                overflow: "visible", // Permitir que descendentes fiquem perfeitamente legíveis
                gap: 3, 
              }}>
                <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 10.21, marginBottom: 0 }}>
                  {dataFormatada || data.dataEmissao}
                </div>
                <div style={{ fontSize: 9.65 }}>Valide este documento acessando o endereço:</div>
                <strong style={{ fontSize: 10.21, display: "block", marginBottom: 0 }}>https://validaratestado.digital</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "nowrap" }}>
                  <span style={{ fontWeight: 400, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 9.65, whiteSpace: "nowrap", lineHeight: 1 }}>Código: </span>
                  <strong style={{ fontSize: 10.21, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1, marginLeft: 2 }}>
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

        {/* ===== RODAPÉ DE SISTEMA (MODO FÍSICO / QR OCULTO) ===== */}
        {hQRCode && (
          <div style={{
            marginTop: "auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
            paddingBottom: 10,
          }}>
            {/* Data FIXA no lado inferior DIREITO (X: 253px, Y: -128px) */}
            <div style={{
              position: "absolute",
              bottom: 100, // Mesma base Y do carimbo (quando hQRCode)
              left: "50%", // Mesma base X do carimbo
              marginLeft: -150, // Mesma margem do carimbo
              transform: "translate(253px, -128px)", // Coordenadas exatas solicitadas
              width: 300, // Mesma largura base para manter referência de centro
              textAlign: "center",
              fontSize: 12.5,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#000",
              fontFamily: "Arial, sans-serif",
              cursor: "default",
              zIndex: 5,
            }}>
              {dataFormatada || data.dataEmissao}
            </div>

            {/* Linha de Assinatura Centralizada (Aprox. 6 linhas acima das info de sistema) */}
            <div style={{
              textAlign: "center",
              width: "100%",
              marginBottom: 48,
              fontSize: 14,
              color: "#000",
              fontWeight: 400,
              userSelect: "none",
            }}>
              ___________________________
            </div>

            {/* Informações de Sistema (Rodapé Estrito) */}
            <div style={{ 
              width: "100%", 
              textAlign: "left", 
              fontSize: 8.5, 
              color: "#666", 
              fontFamily: "monospace", 
              lineHeight: 1.2,
              opacity: 0.8
            }}>
              <div>Gerado por {data.medico?.toUpperCase()}</div>
              <div>Versão.5.123.9.23129</div>
              <div>1/1</div>
              <div>{data.dataAssinatura || data.dataEmissao} {data.horaAssinatura || "17:51"}</div>
            </div>
          </div>
        )}

        {/* ===== CARIMBO REALISTA INTERATIVO (ELITE 3.0) ===== */}
        {modoCarimbo && (
          <div 
            id="draggable-stamp"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 300,
              position: "absolute",
              bottom: hQRCode ? 100 : 150, // Posição padrão acima do rodapé
              left: "50%",
              marginLeft: -150,
              zIndex: 99, 
              flexShrink: 0,
              transform: `scale(${sScale}) translate(${sX}px, ${sY}px) rotate(${sRotate}deg)`,
              transformOrigin: "center center",
              transition: "transform 0.05s ease-out",
              pointerEvents: "auto", 
              cursor: "default", // Remover maozinha conforme solicitado
            }}
          >
            {/* Visual de Carimbo Estilo 'Dr. Antonio' (Sem Moldura) */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}>
              {/* Área do Rabisco / Assinatura (Sobreposta aos dados) */}
              <div style={{
                position: "relative",
                textAlign: "center",
                width: 280,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: "contrast(110%) brightness(105%)",
              }}>
                {fotoAssinatura && (
                  <img
                    src={fotoAssinatura}
                    alt="Rabisco"
                    crossOrigin={getCrossOrigin(fotoAssinatura)}
                    style={{ 
                      maxWidth: 273, 
                      maxHeight: 89, 
                      objectFit: "contain", 
                      position: "absolute", 
                      zIndex: 3,
                      transform: "rotate(-1deg)",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                )}
              </div>

              {/* Dados do Médico (Nome/CRM/Especialidade) */}
              {sStampInfo && (
                <div style={{ 
                  textAlign: "center", 
                  marginTop: -5, 
                  color: corAssinatura,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  userSelect: "none",
                  gap: 1.5,
                  // EFEITO REALISMO: Falhas de tinta e textura de carimbo
                  // No Preview: Filtros complexos (Blur/Mask) funcionam perfeitamente
                  // Na Exportação: html2canvas não suporta masks/blur complexos. 
                  // Usamos mixBlendMode e opacity para simular a tinta penetrando no papel.
                  opacity: isExporting ? 0.88 : 0.94,
                  filter: isExporting ? "none" : "contrast(1.2) brightness(0.95) blur(0.15px)",
                  mixBlendMode: isExporting ? "multiply" : "normal",
                  maskImage: isExporting ? "none" : `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  WebkitMaskImage: isExporting ? "none" : `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12.23, textTransform: "uppercase", lineHeight: 1.0 }}>{data.medico}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.0 }}>{data.crm}</div>
                  <div style={{ fontSize: 9.5, opacity: 0.9, textTransform: "uppercase", lineHeight: 1.0 }}>{data.especialidade}</div>
                </div>
              )}
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
