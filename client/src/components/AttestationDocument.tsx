import { AttestationData } from "@/data/attestations";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";
import { APP_CONFIG } from "@/config";
import { getQRCodeValue } from "@/config.qrcode";

const DEFAULT_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
}

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl }, ref) => {
    // Usar domínio validaratestado.digital para QR Code
    const qrValue = getQRCodeValue(data.codigoQR);
    const sexLabel = data.sexo === "MALE" ? "MALE" : "FEMALE";
    const effectiveLogoUrl = logoUrl || (data as any).logoUrl || DEFAULT_LOGO_URL;
    const instituicao = (data as any).instituicao || "IDAB - SALVADOR/BAHIA";
    const enderecoEmitente = (data as any).enderecoEmitente || "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000";

    // Scale factor: 20% increase (25% - 5% reduction)
    const s = 1.1875;

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
            @media print {
              .attestation-print-container {
                padding: ${40 * s}px !important;
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
              }
              body { margin: 0 !important; padding: 0 !important; }
            }
          `}
        </style>

        {/* ===== HEADER - Logo left + Info CENTERED on page ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: `${25 * s}px`,
            position: "relative",
          }}
        >
          {/* Logo - increased 15% (from 120 to 138) */}
          <div style={{ width: `${138 * s}px`, flexShrink: 0 }}>
            <img
              src={effectiveLogoUrl}
              alt="Logo"
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Institution Info - CENTERED on the full page width */}
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
            <div style={{ fontSize: `${11 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
              DERMATOLOGY AND ALLERGY INSTITUTE
            </div>
            <div style={{ fontSize: `${10 * s}px`, fontWeight: "bold", marginBottom: `${1 * s}px` }}>
              CNPJ 15.180.631/0003-79
            </div>
            <div style={{ fontSize: `${9.5 * s}px`, marginBottom: `${1 * s}px` }}>
              AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA,
            </div>
            <div style={{ fontSize: `${9.5 * s}px` }}>
              SALVADOR - BA, 41825-000
            </div>
          </div>
        </div>

        {/* ===== TITLE - ONLY BOTTOM LINE ===== */}
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

        {/* ===== PATIENT DATA BOX ===== */}
        <div
          style={{
            border: `${2 * s}px solid #000`,
            padding: `${12 * s}px ${15 * s}px`,
            margin: `${15 * s}px 0`,
            fontSize: `${10 * s}px`,
          }}
        >
          {/* Line 1: Patient, Sex, Birth Date */}
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

          {/* Line 2: CPF, Mother's Name */}
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

          {/* Line 3: Address */}
          <div style={{ marginBottom: `${8 * s}px` }}>
            <span style={{ fontWeight: "bold" }}>Address: </span>
            <span>{data.endereco}</span>
          </div>

          {/* Separator */}
          <div style={{ borderTop: `${1 * s}px solid #000`, margin: `${8 * s}px 0` }}></div>

          {/* Issuing Address */}
          <div style={{ fontSize: `${9 * s}px`, fontWeight: "bold" }}>
            ISSUING ADDRESS:{" "}
            <span style={{ fontWeight: "normal" }}>{enderecoEmitente}</span>
          </div>
        </div>

        {/* ===== BODY TEXT - 100% ENGLISH ===== */}
        <div
          style={{
            marginTop: `${30 * s}px`,
            fontSize: `${11 * s}px`,
            lineHeight: "1.6",
            textAlign: "justify",
          }}
        >
          {/* Declaration */}
          <p style={{ marginBottom: `${15 * s}px`, textIndent: `${40 * s}px` }}>
            This is to certify that the above identified patient has been clinically evaluated at this medical facility.
          </p>

          {/* Clinical Condition Title */}
          <p style={{ fontWeight: "bold", marginBottom: `${15 * s}px`, fontSize: `${11 * s}px` }}>
            CLINICAL CONDITION:
          </p>

          {/* Condition Description */}
          <p style={{ marginBottom: `${15 * s}px`, textAlign: "justify" }}>
            {data.condicao}
          </p>

          {/* Passport */}
          <p style={{ marginBottom: `${6 * s}px` }}>
            Passport: <span style={{ fontWeight: "bold" }}>{data.passaporte}</span>
          </p>

          {/* Vaccination Contraindication - SAME LINE */}
          <p style={{ marginBottom: `${15 * s}px` }}>
            Vaccination contraindicated for:{" "}
            <span style={{ fontWeight: "bold" }}>{data.vacinacao}</span>
          </p>

          {/* ICD */}
          <p style={{ fontWeight: "bold", fontSize: `${10.5 * s}px` }}>
            ICD: {data.cid}
          </p>
        </div>

        {/* ===== FOOTER - Matching PDF original layout exactly ===== */}
        {/* Top line separator across full width */}
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
          {/* LEFT SECTION: Date and Validation Info (outside the box) */}
          <div style={{ flex: "0 0 auto", maxWidth: `${200 * s}px`, textAlign: "left", alignSelf: "flex-end" }}>
            <p style={{ fontWeight: "bold", marginBottom: `${6 * s}px`, fontSize: `${10 * s}px` }}>
              SALVADOR, {data.dataEmissao}
            </p>
            <p style={{ marginBottom: `${2 * s}px`, color: "#333", fontSize: `${8.5 * s}px` }}>
              Validate this document at:
            </p>
            <p style={{ fontWeight: "bold", marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px`, fontStyle: "italic" }}>
              {APP_CONFIG.validationBaseUrl}
            </p>
            <p style={{ fontSize: `${8.5 * s}px` }}>
              Code: <span style={{ fontWeight: "bold" }}>{data.codigoQR}</span>
            </p>
          </div>

          {/* RIGHT SECTION: Bordered box containing QR Code + Physician Info */}
          <div
            style={{
              border: `${1.5 * s}px solid #000`,
              display: "flex",
              alignItems: "center",
              gap: `${12 * s}px`,
              padding: `${10 * s}px ${14 * s}px`,
            }}
          >
            {/* QR Code inside the box */}
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

            {/* Physician Info inside the box */}
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
              <p style={{ marginBottom: `${3 * s}px` }}>
                {data.especialidade}
              </p>
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
