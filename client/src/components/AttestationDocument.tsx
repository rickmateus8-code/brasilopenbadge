import { AttestationData } from "@/data/attestations";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { APP_CONFIG } from "@/config";
import { getQRCodeValue } from "@/config.qrcode";

const DEFAULT_LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
  /** URL/base64 da logo à esquerda (substitui logoUrl quando presente) */
  logoLeft?: string;
  /** URL/base64 da logo à direita */
  logoRight?: string;
  /** Cor da assinatura cursiva: "#0b109f" (azul) | "#000000" (preto) */
  signatureColor?: string;
  /** URL/base64 da foto da assinatura (sobrepõe a rubrica cursiva) */
  signatureImage?: string;
}

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl, logoLeft, logoRight, signatureColor, signatureImage }, ref) => {
    const qrValue = getQRCodeValue(data.codigoQR);
    const sexLabel = data.sexo === "MALE" ? "MALE" : "FEMALE";

    // Logo esquerda: prioridade logoLeft > logoUrl > data.logoUrl > DEFAULT
    const effectiveLogoLeft =
      logoLeft || logoUrl || (data as any).logoUrl || DEFAULT_LOGO_URL;
    // Logo direita: só exibida se fornecida
    const effectiveLogoRight = logoRight || "";

    const instituicao = (data as any).instituicao || "IDAB - SALVADOR/BAHIA";
    const enderecoEmitente =
      (data as any).enderecoEmitente ||
      "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000";
    const unidade = (data as any).unidade || "";
    const corAssinatura = signatureColor || (data as any).signatureColor || "#0b109f";
    const fotoAssinatura = signatureImage || (data as any).signatureImage || "";

    // Gerar rubrica cursiva a partir do nome do médico
    const gerarRubrica = (nome: string): string => {
      if (!nome || nome === "NOME DO MÉDICO") return "Assinado";
      const partes = nome.trim().split(/\s+/).filter(Boolean);
      if (partes.length >= 2) {
        const primeiro =
          partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
        const inicial = partes[1].charAt(0).toUpperCase();
        return `${primeiro} ${inicial}.`;
      }
      return partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    };

    const s = 1.1875; // Scale factor A4

    return (
      <div
        ref={ref}
        id="attestation-document"
        className="attestation-print-container"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${11 * s}px`,
          lineHeight: "1.2",
          color: "#000000",
          padding: `${50 * s}px ${40 * s}px`,
          maxWidth: `${850 * s}px`,
          margin: "0 auto",
          backgroundColor: "#ffffff",
          position: "relative",
        }}
      >
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&display=swap');
            @media print {
              .attestation-print-container {
                padding: ${40 * s}px !important;
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
              }
              body { margin: 0 !important; padding: 0 !important; }
            }
            .rubrica-cursiva {
              font-family: 'Herr Von Muellerhoff', cursive;
              font-size: ${36 * s}px;
              line-height: 1;
            }
          `}
        </style>

        {/* ===== HEADER — Logo Esquerda + Info Centralizada + Logo Direita ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: `${25 * s}px`,
            position: "relative",
          }}
        >
          {/* Logo Esquerda */}
          <div style={{ width: `${138 * s}px`, flexShrink: 0, zIndex: 1 }}>
            <img
              src={effectiveLogoLeft}
              alt="Logo"
              style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: `${80 * s}px` }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Informações da Instituição — Centralizadas */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: `${14 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
              {instituicao}
            </div>
            {unidade && (
              <div style={{ fontSize: `${11 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
                {unidade}
              </div>
            )}
            <div style={{ fontSize: `${11 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
              DERMATOLOGY AND ALLERGY INSTITUTE
            </div>
            <div style={{ fontSize: `${10 * s}px`, fontWeight: "bold", marginBottom: `${1 * s}px` }}>
              CNPJ 15.180.631/0003-79
            </div>
            <div style={{ fontSize: `${9.5 * s}px`, marginBottom: `${1 * s}px` }}>
              AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA,
            </div>
            <div style={{ fontSize: `${9.5 * s}px` }}>SALVADOR - BA, 41825-000</div>
          </div>

          {/* Logo Direita (opcional) */}
          {effectiveLogoRight && (
            <div style={{ width: `${138 * s}px`, flexShrink: 0, marginLeft: "auto", zIndex: 1 }}>
              <img
                src={effectiveLogoRight}
                alt="Logo Direita"
                style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: `${80 * s}px` }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </div>

        {/* ===== TÍTULO ===== */}
        <div
          style={{
            textAlign: "center",
            margin: `${15 * s}px 0`,
            borderBottom: `${2 * s}px solid #000`,
            paddingBottom: `${8 * s}px`,
          }}
        >
          <h2 style={{ fontSize: `${20 * s}px`, fontWeight: "bold", margin: 0, letterSpacing: "2px" }}>
            MEDICAL CERTIFICATE
          </h2>
        </div>

        {/* ===== DADOS DO PACIENTE ===== */}
        <div
          style={{
            border: `${2 * s}px solid #000`,
            padding: `${12 * s}px ${15 * s}px`,
            margin: `${15 * s}px 0`,
            fontSize: `${10 * s}px`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: `${6 * s}px` }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: "bold" }}>Patient: </span>
              <span>{data.paciente}</span>
            </div>
            <div style={{ width: `${140 * s}px` }}>
              <span style={{ fontWeight: "bold" }}>Sex: </span>
              <span>{sexLabel}</span>
            </div>
            <div style={{ width: `${160 * s}px` }}>
              <span style={{ fontWeight: "bold" }}>Date of Birth: </span>
              <span>{data.nascimento}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: `${6 * s}px` }}>
            <div style={{ width: `${200 * s}px` }}>
              <span style={{ fontWeight: "bold" }}>CPF: </span>
              <span>{data.cpf}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: "bold" }}>Mother's Name: </span>
              <span>{data.nomeMae}</span>
            </div>
          </div>

          <div style={{ marginBottom: `${8 * s}px` }}>
            <span style={{ fontWeight: "bold" }}>Address: </span>
            <span>{data.endereco}</span>
          </div>

          <div style={{ borderTop: `${1 * s}px solid #000`, margin: `${8 * s}px 0` }}></div>

          <div style={{ fontSize: `${9 * s}px`, fontWeight: "bold" }}>
            ISSUING ADDRESS:{" "}
            <span style={{ fontWeight: "normal" }}>{enderecoEmitente}</span>
          </div>
        </div>

        {/* ===== CORPO DO TEXTO ===== */}
        <div
          style={{
            marginTop: `${30 * s}px`,
            fontSize: `${11 * s}px`,
            lineHeight: "1.6",
            textAlign: "justify",
          }}
        >
          <p style={{ marginBottom: `${15 * s}px`, textIndent: `${40 * s}px` }}>
            This is to certify that the above identified patient has been clinically evaluated at this medical facility.
          </p>

          <p style={{ fontWeight: "bold", marginBottom: `${15 * s}px`, fontSize: `${11 * s}px` }}>
            CLINICAL CONDITION:
          </p>

          <p style={{ marginBottom: `${15 * s}px`, textAlign: "justify" }}>
            {data.condicao}
          </p>

          <p style={{ marginBottom: `${6 * s}px` }}>
            Passport: <span style={{ fontWeight: "bold" }}>{data.passaporte}</span>
          </p>

          <p style={{ marginBottom: `${15 * s}px` }}>
            Vaccination contraindicated for:{" "}
            <span style={{ fontWeight: "bold" }}>{data.vacinacao}</span>
          </p>

          <p style={{ fontWeight: "bold", fontSize: `${10.5 * s}px` }}>
            ICD: {data.cid}
          </p>
        </div>

        {/* ===== RODAPÉ ===== */}
        <div style={{ borderTop: `${1.5 * s}px solid #000`, marginTop: `${60 * s}px` }}></div>

        <div
          style={{
            paddingTop: `${12 * s}px`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            fontSize: `${9 * s}px`,
            gap: `${10 * s}px`,
          }}
        >
          {/* SEÇÃO ESQUERDA: Data e Validação */}
          <div
            style={{
              flex: "0 0 auto",
              maxWidth: `${200 * s}px`,
              textAlign: "left",
              alignSelf: "flex-end",
            }}
          >
            {/* Assinatura cursiva ou foto */}
            <div style={{ marginBottom: `${8 * s}px`, minHeight: `${44 * s}px` }}>
              {fotoAssinatura ? (
                <img
                  src={fotoAssinatura}
                  alt="Assinatura"
                  style={{
                    maxWidth: `${180 * s}px`,
                    maxHeight: `${50 * s}px`,
                    objectFit: "contain",
                  }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span
                  className="rubrica-cursiva"
                  style={{ color: corAssinatura }}
                  dangerouslySetInnerHTML={{ __html: gerarRubrica(data.medico) }}
                />
              )}
            </div>

            <p style={{ fontWeight: "bold", marginBottom: `${6 * s}px`, fontSize: `${10 * s}px` }}>
              SALVADOR, {data.dataEmissao}
            </p>
            <p style={{ marginBottom: `${2 * s}px`, color: "#333", fontSize: `${8.5 * s}px` }}>
              Validate this document at:
            </p>
            <p
              style={{
                fontWeight: "bold",
                marginBottom: `${3 * s}px`,
                fontSize: `${8.5 * s}px`,
                fontStyle: "italic",
              }}
            >
              {APP_CONFIG.validationBaseUrl}
            </p>
            <p style={{ fontSize: `${8.5 * s}px` }}>
              Code: <span style={{ fontWeight: "bold" }}>{data.codigoQR}</span>
            </p>
          </div>

          {/* SEÇÃO DIREITA: QR Code + Dados do Médico */}
          <div
            style={{
              border: `${1.5 * s}px solid #000`,
              display: "flex",
              alignItems: "center",
              gap: `${12 * s}px`,
              padding: `${10 * s}px ${14 * s}px`,
            }}
          >
            <div style={{ flexShrink: 0, lineHeight: 0 }}>
              <QRCode
                value={qrValue}
                size={Math.round(95 * s)}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>

            <div style={{ textAlign: "right", fontSize: `${8.5 * s}px`, whiteSpace: "nowrap" }}>
              <p style={{ marginBottom: `${3 * s}px` }}>
                Document digitally signed pursuant to
              </p>
              <p style={{ marginBottom: `${3 * s}px` }}>
                Provisional Measure No. 2,200-2
              </p>
              <p style={{ fontWeight: "bold", marginBottom: `${3 * s}px`, fontSize: `${10 * s}px` }}>
                PHYSICIAN: {data.medico}
              </p>
              <p style={{ marginBottom: `${2 * s}px`, fontSize: `${9 * s}px` }}>
                {data.crm}
              </p>
              <p style={{ marginBottom: `${3 * s}px` }}>{data.especialidade}</p>
              <p>
                Signed on {data.dataAssinatura} {data.horaAssinatura}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
