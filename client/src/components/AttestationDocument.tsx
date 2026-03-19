import { AttestationData } from "@/data/attestations";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { forwardRef } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

interface AttestationDocumentProps {
  data: AttestationData;
  logoUrl?: string;
}

const AttestationDocument = forwardRef<HTMLDivElement, AttestationDocumentProps>(
  ({ data, logoUrl }, ref) => {
    const qrValue = `https://validaratestado.digital/v/${data.codigoQR}`;
    const sexoFormatado = data.sexo === "MALE" ? "MALE" : "FEMALE";
    const effectiveLogoUrl = logoUrl || LOGO_URL;

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

        {/* ===== HEADER - Logo left + Info centered ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${20 * s}px`,
            marginBottom: `${25 * s}px`,
          }}
        >
          {/* Logo */}
          <div style={{ width: `${120 * s}px`, flexShrink: 0 }}>
            <img
              src={effectiveLogoUrl}
              alt="IDAB Logo"
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Institution Info - Centered */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: `${14 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
              IDAB - SALVADOR/BAHIA
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

        {/* ===== TITLE ===== */}
        <div
          style={{
            textAlign: "center",
            margin: `${15 * s}px 0`,
            borderTop: `${2 * s}px solid #000`,
            borderBottom: `${2 * s}px solid #000`,
            padding: `${8 * s}px 0`,
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
              <span>{sexoFormatado}</span>
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
            ISSUING ADDRESS: <span style={{ fontWeight: "normal" }}>AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000</span>
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
            The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.
          </p>

          {/* Passport */}
          <p style={{ marginBottom: `${6 * s}px` }}>
            Passport: <span style={{ fontWeight: "bold" }}>{data.passaporte}</span>
          </p>

          {/* Vaccination Contraindication */}
          <p style={{ marginBottom: `${4 * s}px` }}>
            Vaccination contraindicated for:
          </p>
          <p style={{ fontWeight: "bold", marginBottom: `${15 * s}px` }}>
            YELLOW FEVER
          </p>

          {/* ICD */}
          <p style={{ fontWeight: "bold", fontSize: `${10.5 * s}px` }}>
            ICD: T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)
          </p>
        </div>

        {/* ===== FOOTER - 3 COLUMNS ===== */}
        <div
          style={{
            borderTop: `${1.5 * s}px solid #000`,
            marginTop: `${60 * s}px`,
            paddingTop: `${15 * s}px`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            fontSize: `${9 * s}px`,
            gap: `${15 * s}px`,
          }}
        >
          {/* Left Column: Date and Validation */}
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontWeight: "bold", marginBottom: `${6 * s}px`, fontSize: `${10 * s}px` }}>
              SALVADOR, MARCH 16, 2026
            </p>
            <p style={{ marginBottom: `${2 * s}px`, color: "#333" }}>
              Validate this document at:
            </p>
            <p style={{ fontWeight: "bold", marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px` }}>
              https://validaratestado.digital
            </p>
            <p style={{ fontSize: `${8.5 * s}px` }}>
              Code: <span style={{ fontWeight: "bold" }}>{data.codigoQR}</span>
            </p>
          </div>

          {/* Center Column: QR Code */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: `${3 * s}px`,
                border: `${1.5 * s}px solid #000`,
                backgroundColor: "#fff",
              }}
            >
              <QRCode
                value={qrValue}
                size={Math.round(95 * s)}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          {/* Right Column: Physician */}
          <div style={{ flex: 1, textAlign: "right" }}>
            <p style={{ marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px` }}>
              Document digitally signed pursuant to Provisional Measure No. 2,200-2
            </p>
            <p style={{ fontWeight: "bold", marginBottom: `${3 * s}px`, fontSize: `${10 * s}px` }}>
              PHYSICIAN: {data.medico}
            </p>
            <p style={{ marginBottom: `${2 * s}px`, fontSize: `${9 * s}px` }}>
              {data.crm}
            </p>
            <p style={{ marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px` }}>
              ALLERGY AND IMMUNOLOGY
            </p>
            <p style={{ fontSize: `${8.5 * s}px` }}>
              Signed on {data.dataAssinatura} {data.horaAssinatura}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
