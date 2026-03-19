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
    const sexoFormatado = data.sexo === "MALE" ? "MASCULINO" : "FEMININO";
    const effectiveLogoUrl = logoUrl || LOGO_URL;

    // Escala: 25% aumento - 5% redução = 20% final (1.1875)
    const s = 1.1875;

    return (
      <div
        ref={ref}
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

        {/* ===== CABEÇALHO - Logo à esquerda + Info centralizada ===== */}
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
            />
          </div>

          {/* Informações da Instituição - Centralizado */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: `${14 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
              IDAB - SALVADOR/BAHIA
            </div>
            <div style={{ fontSize: `${11 * s}px`, fontWeight: "bold", marginBottom: `${2 * s}px` }}>
              INSTITUTO DE DERMATOLOGIA E ALERGIA
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

        {/* ===== TÍTULO ===== */}
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
            ATESTADO MÉDICO
          </h2>
        </div>

        {/* ===== CAIXA DE DADOS DO PACIENTE ===== */}
        <div
          style={{
            border: `${2 * s}px solid #000`,
            padding: `${12 * s}px ${15 * s}px`,
            margin: `${15 * s}px 0`,
            fontSize: `${10 * s}px`,
          }}
        >
          {/* Linha 1: Paciente, Sexo, Nascimento */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: `${6 * s}px` }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: "bold" }}>Paciente: </span>
              <span>{data.paciente}</span>
            </div>
            <div style={{ width: `${140 * s}px` }}>
              <span style={{ fontWeight: "bold" }}>Sexo: </span>
              <span>{sexoFormatado}</span>
            </div>
            <div style={{ width: `${140 * s}px` }}>
              <span style={{ fontWeight: "bold" }}>Nasc: </span>
              <span>{data.nascimento}</span>
            </div>
          </div>

          {/* Linha 2: CPF, Nome da Mãe */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: `${6 * s}px` }}>
            <div style={{ width: `${200 * s}px` }}>
              <span style={{ fontWeight: "bold" }}>CPF: </span>
              <span>{data.cpf}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: "bold" }}>Nome da Mãe: </span>
              <span>{data.nomeMae}</span>
            </div>
          </div>

          {/* Linha 3: Endereço */}
          <div style={{ marginBottom: `${8 * s}px` }}>
            <span style={{ fontWeight: "bold" }}>Endereço: </span>
            <span>{data.endereco}</span>
          </div>

          {/* Separador */}
          <div style={{ borderTop: `${1 * s}px solid #000`, margin: `${8 * s}px 0` }}></div>

          {/* Endereço Emitente */}
          <div style={{ fontSize: `${9 * s}px`, fontWeight: "bold" }}>
            ENDEREÇO EMITENTE: <span style={{ fontWeight: "normal" }}>AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000</span>
          </div>
        </div>

        {/* ===== CORPO DO TEXTO - BILÍNGUE PT-BR / EN ===== */}
        <div
          style={{
            marginTop: `${30 * s}px`,
            fontSize: `${11 * s}px`,
            lineHeight: "1.6",
            textAlign: "justify",
          }}
        >
          {/* Declaração PT-BR */}
          <p style={{ marginBottom: `${10 * s}px`, textIndent: `${40 * s}px` }}>
            Declaro, para os devidos fins, que o paciente acima identificado foi avaliado clinicamente nesta unidade de saúde.
          </p>

          {/* Declaração EN */}
          <p style={{ marginBottom: `${25 * s}px` }}>
            This is to certify that the above identified patient has been clinically evaluated at this medical facility.
          </p>

          {/* Condição Clínica - Título bilíngue */}
          <p style={{ fontWeight: "bold", marginBottom: `${15 * s}px`, fontSize: `${11 * s}px` }}>
            CONDIÇÃO CLÍNICA / CLINICAL CONDITION:
          </p>

          {/* Condição em PT-BR */}
          <p style={{ marginBottom: `${15 * s}px`, textAlign: "justify" }}>
            O paciente apresenta histórico de reação alérgica grave (anafilática) a proteínas do ovo, caracterizando condição de risco para administração de imunobiológicos que contenham esse componente.
          </p>

          {/* Passaporte */}
          <p style={{ marginBottom: `${4 * s}px` }}>
            Documento (Passaporte) / Passport: <span style={{ fontWeight: "bold" }}>{data.passaporte}</span>
          </p>

          {/* Contraindicação PT-BR */}
          <p style={{ marginBottom: `${2 * s}px` }}>
            Fica contraindicada a vacinação contra:
          </p>

          {/* Contraindicação EN + Vacina */}
          <p style={{ fontWeight: "bold", marginBottom: `${15 * s}px` }}>
            Vaccination contraindicated for: FEBRE AMARELA / YELLOW FEVER
          </p>

          {/* Condição em EN */}
          <p style={{ marginBottom: `${20 * s}px`, textAlign: "justify" }}>
            The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.
          </p>

          {/* CID bilíngue */}
          <p style={{ fontWeight: "bold", fontSize: `${10.5 * s}px` }}>
            CID: T78.0 REAÇÃO ANAFILÁTICA DEVIDO A ALIMENTO (OVO) / ANAPHYLACTIC REACTION DUE TO FOOD (EGG)
          </p>
        </div>

        {/* ===== RODAPÉ - 3 COLUNAS ===== */}
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
          {/* Coluna Esquerda: Data e Validação */}
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontWeight: "bold", marginBottom: `${6 * s}px`, fontSize: `${10 * s}px` }}>
              SALVADOR, 16 DE MARÇO DE 2026
            </p>
            <p style={{ marginBottom: `${2 * s}px`, color: "#333" }}>
              Valide este documento acessando o endereço:
            </p>
            <p style={{ fontWeight: "bold", marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px` }}>
              https://validaratestado.digital
            </p>
            <p style={{ fontSize: `${8.5 * s}px` }}>
              Código: <span style={{ fontWeight: "bold" }}>{data.codigoQR}</span>
            </p>
          </div>

          {/* Coluna Central: QR Code */}
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

          {/* Coluna Direita: Médico */}
          <div style={{ flex: 1, textAlign: "right" }}>
            <p style={{ marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px` }}>
              Documento assinado digitalmente conforme MP nº 2.200-2
            </p>
            <p style={{ fontWeight: "bold", marginBottom: `${3 * s}px`, fontSize: `${10 * s}px` }}>
              PHYSICIAN: DIMITRI GUSMAO FLORES
            </p>
            <p style={{ marginBottom: `${2 * s}px`, fontSize: `${9 * s}px` }}>
              CRM/BA 14180
            </p>
            <p style={{ marginBottom: `${3 * s}px`, fontSize: `${8.5 * s}px` }}>
              ALERGIA E IMUNOLOGIA / ALLERGY AND IMMUNOLOGY
            </p>
            <p style={{ fontSize: `${8.5 * s}px` }}>
              Assinado em {data.dataAssinatura} {data.horaAssinatura}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

AttestationDocument.displayName = "AttestationDocument";

export default AttestationDocument;
