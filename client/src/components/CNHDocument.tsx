import { QRCodeSVG } from "qrcode.react";

export interface CNHDocumentProps {
  nome: string;
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  ufRG: string;
  sexo: string;
  nacionalidade: string;
  dataNascimento: string;
  localNascimento: string;
  ufNascimento: string;
  nomePai: string;
  nomeMae: string;
  categoria: string;
  tipo: string;
  registro: string;
  espelho: string;
  validade: string;
  validadeCNH2?: string;
  dataEmissao: string;
  primeiraHabilitacao: string;
  localEmissao: string;
  ufEmissao: string;
  assDigital1: string;
  assDigital2: string;
  senhaApp: string;
  observacoes: string;
  fotoUrl: string;
  assinaturaUrl: string;
  codigoQR?: string;
  blurred?: boolean;
}

/* Formata DD/MM/YYYY a partir de YYYY-MM-DD */
function fmtDate(d: string) {
  if (!d) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, dd] = d.slice(0, 10).split("-");
    return `${dd}/${m}/${y}`;
  }
  return d;
}

/* Gera código MRZ fictício */
function buildMRZ(nome: string, registro: string, espelho: string, dataNasc: string, sexo: string, validade: string) {
  const pad = (s: string, n: number) => (s + "<".repeat(n)).slice(0, n);
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "<");
  const nameParts = nome.split(" ");
  const surname = clean(nameParts[0] || "");
  const given = clean(nameParts.slice(1).join("<") || "");
  const line3 = `${surname}<${given}`;
  const regClean = (registro || "0000000000").replace(/\D/g, "");
  const espClean = (espelho || "0000000000").replace(/\D/g, "");

  const l1 = `I<BRA${pad(espClean, 10)}<${pad(regClean, 9)}${"<".repeat(4)}`;
  const dob = dataNasc ? dataNasc.replace(/\D/g, "").slice(4, 8) + dataNasc.replace(/\D/g, "").slice(2, 4) + dataNasc.replace(/\D/g, "").slice(0, 2) : "0000000";
  const sx = sexo === "Feminino" ? "F" : "M";
  const val = validade ? validade.replace(/\D/g, "").slice(4, 8) + validade.replace(/\D/g, "").slice(2, 4) + validade.replace(/\D/g, "").slice(0, 2) : "0000000";
  const l2 = `${pad(dob.slice(0, 6), 6)}${sx}${pad(val.slice(0, 7), 7)}BRA${"<".repeat(14)}`;
  const l3 = pad(line3, 30);
  return { l1, l2, l3 };
}

export default function CNHDocument(props: CNHDocumentProps) {
  const {
    nome, cpf, rg, orgaoEmissor, ufRG, sexo, nacionalidade,
    dataNascimento, localNascimento, ufNascimento, nomePai, nomeMae,
    categoria, tipo, registro, espelho, validade, validadeCNH2,
    dataEmissao, primeiraHabilitacao, localEmissao, ufEmissao,
    assDigital1, assDigital2, senhaApp, observacoes,
    fotoUrl, assinaturaUrl, codigoQR, blurred,
  } = props;

  const qrUrl = codigoQR ? `https://docmaster.store/v/${codigoQR}` : "";
  const mrz = buildMRZ(nome, registro, espelho, dataNascimento, sexo, validade);
  const catHab = categoria?.replace(/[^A-E]/g, "").split("").join("") || "";

  const fieldStyle: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 9,
    fontWeight: 700,
    color: "#1a1a1a",
    lineHeight: "1.2",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 6.5,
    color: "#555",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    marginBottom: 1,
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  return (
    <div
      style={{
        width: 595,
        minHeight: 842,
        background: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ===== HEADER VERDE ESCURO ===== */}
      <div
        style={{
          background: "linear-gradient(135deg, #1b3a2a 0%, #234d35 100%)",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Brasão simplificado */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #c4a747, #dbc06e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900, color: "#1b3a2a",
            border: "2px solid #e8d48b",
          }}>
            BR
          </div>
          <div>
            <p style={{ color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 1, margin: 0 }}>
              REPÚBLICA FEDERATIVA DO BRASIL
            </p>
            <p style={{ color: "#b8d4c5", fontSize: 7, margin: 0, letterSpacing: 0.5 }}>
              MINISTÉRIO DA INFRAESTRUTURA
            </p>
            <p style={{ color: "#b8d4c5", fontSize: 7, margin: 0, letterSpacing: 0.5 }}>
              SECRETARIA NACIONAL DE TRÂNSITO - SENATRAN
            </p>
          </div>
        </div>
        <div style={{
          background: "#fff", borderRadius: 4, padding: "3px 10px",
        }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#1351b4", letterSpacing: 1 }}>gov</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#1351b4" }}>.br</span>
        </div>
      </div>

      {/* ===== CORPO PRINCIPAL ===== */}
      <div style={{ padding: "12px 20px" }}>
        {/* Card principal com borda */}
        <div style={{
          border: "1.5px solid #333",
          borderRadius: 4,
          padding: 12,
          position: "relative",
        }}>
          {/* Sub-header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 10, paddingBottom: 8,
            borderBottom: "1px solid #ccc",
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 7, fontWeight: 700, color: "#333", margin: 0, letterSpacing: 0.5 }}>
                REPÚBLICA FEDERATIVA DO BRASIL
              </p>
              <p style={{ fontSize: 6, color: "#666", margin: 0 }}>
                MINISTÉRIO DA INFRAESTRUTURA
              </p>
              <p style={{ fontSize: 6, color: "#666", margin: 0 }}>
                SECRETARIA NACIONAL
              </p>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#1351b4", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 9, fontWeight: 900,
            }}>
              BR
            </div>
          </div>

          <p style={{
            fontSize: 7, fontWeight: 700, color: "#333",
            textAlign: "center", margin: "0 0 8px",
            letterSpacing: 0.5,
          }}>
            CARTEIRA NACIONAL DE HABILITAÇÃO / DRIVER LICENSE / PERMISO DE CONDUCCIÓN
          </p>

          {/* Layout principal: dados + foto à esquerda, QR à direita */}
          <div style={{ display: "flex", gap: 12 }}>
            {/* Coluna esquerda: campos + foto */}
            <div style={{ flex: 1 }}>
              {/* Nome e Habilitação */}
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <p style={labelStyle}>2 e 3 NOME E SOBRENOME</p>
                  <p style={fieldStyle}>{nome || "—"}</p>
                </div>
                <div style={{ width: 80 }}>
                  <p style={labelStyle}>7 HABILITAÇÃO</p>
                  <p style={fieldStyle}>{fmtDate(primeiraHabilitacao) || "—"}</p>
                </div>
              </div>

              {/* Data nasc, local, UF */}
              <div style={{ marginBottom: 4 }}>
                <p style={labelStyle}>3 DATA, LOCAL E UF DE NASCIMENTO</p>
                <p style={fieldStyle}>
                  {fmtDate(dataNascimento)} {localNascimento ? `${localNascimento}/${ufNascimento}` : ""}
                </p>
              </div>

              {/* Validade, ACC, Categoria */}
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <p style={labelStyle}>4a VALIDADE</p>
                  <p style={fieldStyle}>{fmtDate(validade) || "—"}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={labelStyle}>4b VALIDADE</p>
                  <p style={fieldStyle}>{fmtDate(validadeCNH2 || "") || "—"}</p>
                </div>
                <div style={{ width: 30 }}>
                  <p style={labelStyle}>ACC</p>
                  <p style={fieldStyle}></p>
                </div>
                <div style={{
                  width: 40, height: 30,
                  border: "2px solid #333",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900,
                }}>
                  {categoria || "B"}
                </div>
              </div>

              {/* RG, CPF, Registro, Cat.Hab */}
              <div style={{ marginBottom: 4 }}>
                <p style={labelStyle}>4c DOC. IDENTIDADE / ÓRG. EMISSOR / UF</p>
                <p style={fieldStyle}>{rg} {orgaoEmissor}/{ufRG}</p>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <p style={labelStyle}>4d CPF</p>
                  <p style={fieldStyle}>{cpf || "—"}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={labelStyle}>5 Nº REGISTRO</p>
                  <p style={fieldStyle}>{espelho || "—"}</p>
                </div>
                <div style={{ width: 40 }}>
                  <p style={labelStyle}>4 CAT.HAB</p>
                  <p style={fieldStyle}>{catHab || "—"}</p>
                </div>
              </div>

              {/* Nacionalidade */}
              <div style={{ marginBottom: 4 }}>
                <p style={labelStyle}>8 NACIONALIDADE</p>
                <p style={fieldStyle}>{nacionalidade || "BRASILEIRO(A)"}</p>
              </div>

              {/* Filiação */}
              <div style={{ marginBottom: 4 }}>
                <p style={labelStyle}>FILIAÇÃO</p>
                <p style={fieldStyle}>{nomePai || "—"}</p>
                <p style={fieldStyle}>{nomeMae || "—"}</p>
              </div>

              {/* Foto e Assinatura lado a lado */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {/* Foto */}
                <div style={{
                  width: 90, height: 120,
                  border: "1px solid #ccc",
                  background: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 8, color: "#aaa" }}>FOTO 3x4</span>
                  )}
                </div>
                {/* Assinatura */}
                <div style={{ flex: 1 }}>
                  <p style={labelStyle}>9 ASSINATURA DO PORTADOR</p>
                  <div style={{
                    height: 50, border: "1px solid #ccc",
                    background: "#fafafa",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {assinaturaUrl ? (
                      <img src={assinaturaUrl} alt="Assinatura" style={{ maxHeight: 45, maxWidth: "95%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 8, color: "#aaa" }}>ASSINATURA</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita: QR Code */}
            <div style={{ width: 160, textAlign: "center" }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: "#333", marginBottom: 6 }}>QR-CODE</p>
              <div style={{
                position: "relative",
                display: "inline-block",
              }}>
                {codigoQR ? (
                  <QRCodeSVG value={qrUrl} size={140} level="M" />
                ) : (
                  <div style={{
                    width: 140, height: 140,
                    border: "2px dashed #ccc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#bbb", fontSize: 10,
                  }}>
                    QR CODE
                  </div>
                )}
                {/* Filtro borrado anti-fraude */}
                {blurred && (
                  <div style={{
                    position: "absolute", inset: 0,
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    background: "rgba(255,255,255,0.3)",
                    borderRadius: 4,
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABELA DE CATEGORIAS ===== */}
        <div style={{
          border: "1.5px solid #333",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          padding: 8,
          marginTop: -1,
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 7 }}>
            <thead>
              <tr>
                {["", "1B", "12", "9", "10", "11", "12"].map((h, i) => (
                  <th key={i} style={{
                    border: "1px solid #ccc", padding: "2px 4px",
                    background: "#f0f0f0", fontWeight: 700, textAlign: "center",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["A", "A1", "B", "B1", "C", "D", "E"].map(cat => (
                <tr key={cat}>
                  <td style={{ border: "1px solid #ccc", padding: "2px 4px", fontWeight: 700, textAlign: "center" }}>{cat}</td>
                  {[...Array(6)].map((_, i) => (
                    <td key={i} style={{
                      border: "1px solid #ccc", padding: "2px 4px",
                      textAlign: "center", color: "#888",
                    }}>
                      {categoria?.includes(cat.replace("1", "")) ? "***" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== OBSERVAÇÕES E ASSINATURA DIGITAL ===== */}
        <div style={{
          border: "1.5px solid #333",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          padding: 10,
          marginTop: -1,
          display: "flex",
          gap: 20,
        }}>
          {/* Lado esquerdo: Observações */}
          <div style={{ flex: 1 }}>
            <p style={labelStyle}>14 OBSERVAÇÕES</p>
            <p style={{ ...fieldStyle, minHeight: 20 }}>{observacoes || "EAR"}</p>

            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 7, color: "#666", margin: 0 }}>ASSINADO DIGITALMENTE</p>
              <p style={{ fontSize: 7, color: "#333", fontWeight: 700, margin: 0 }}>DEPARTAMENTO ESTADUAL DE TRÂNSITO</p>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 20 }}>
              <div>
                <p style={labelStyle}>LOCAL</p>
                <p style={{ ...fieldStyle, fontSize: 8 }}>{localEmissao}{ufEmissao ? `, ${ufEmissao}` : ""}</p>
              </div>
              <div>
                <p style={{ ...fieldStyle, fontSize: 8 }}>{assDigital1 || ""}</p>
                <p style={{ ...fieldStyle, fontSize: 8 }}>{assDigital2 || ""}</p>
              </div>
            </div>

            <p style={{
              fontSize: 16, fontWeight: 900, color: "#333",
              marginTop: 8, letterSpacing: 2,
            }}>
              {ufEmissao ? getEstadoNome(ufEmissao) : ""}
            </p>
          </div>

          {/* Lado direito: Texto legal */}
          <div style={{ width: 200, fontSize: 7, color: "#555", lineHeight: 1.4 }}>
            <p style={{ margin: "0 0 6px" }}>
              Documento assinado com certificado digital em conformidade
              com a Medida Provisória nº 2200-2/2001. Sua validade poderá
              ser confirmada por meio do programa Assinador Serpro.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              As orientações para instalar o Assinador Serpro e realizar a
              validação do documento digital estão disponíveis em:
              https://www.serpro.gov.br/assinador-digital.
            </p>
            <p style={{ fontWeight: 800, fontSize: 9, color: "#333", marginTop: 8 }}>
              SERPRO / SENATRAN
            </p>
          </div>
        </div>

        {/* ===== TEXTO LEGAL RODAPÉ ===== */}
        <div style={{ marginTop: 12, fontSize: 5.5, color: "#888", lineHeight: 1.5, padding: "0 4px" }}>
          <p style={{ margin: 0 }}>
            2 e 3: Nome e Sobrenome / Name and Surname / Nombre y Apellidos – Primeira Habilitação / First Driver License / Primera licencia de Conducir – 3: Data e
            Local de Nascimento / Date and Place of Birth (DD/MM/YYYY) / Fecha y lugar de Nacimiento – 4a: Banda de Direção Deste DETRAN/CIRETRAN / Fecha de Expiración – 7b:
            Data de Validade / Expiration Date (DD/MM/YYYY) / Válido Hasta – ACC – 9: Documento Identidade / Digit.emissão / Identity Document / Issuing authority – 5:
            Documento de Identificação – Autoridad Expedidora – 4d: CPF – 5: Número de registro da CNH – First License Number / Número de Permiso de Conducir – 5:
            Categoria de Veículos de Carteira de habilitação – Driver Permit Class / Categoría de Permiso de Conducir – Nacionalidade / Nationality / Nacionalidad –
            Filiação / Filiation / Filiación – 13: Observações / Observations / Observaciones / Local / Place / Lugar
          </p>
        </div>

        {/* ===== MRZ ===== */}
        <div style={{
          marginTop: 10, padding: 8,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 9, letterSpacing: 1.5, color: "#333",
          lineHeight: 1.6,
        }}>
          <p style={{ margin: 0 }}>{mrz.l1}</p>
          <p style={{ margin: 0 }}>{mrz.l2}</p>
          <p style={{ margin: 0 }}>{mrz.l3}</p>
        </div>
      </div>

      {/* ===== TEXTO LATERAL ESQUERDO (VERTICAL) ===== */}
      <div style={{
        position: "absolute",
        left: 2,
        top: 80,
        transform: "rotate(-90deg)",
        transformOrigin: "left top",
        fontSize: 7,
        fontWeight: 700,
        color: "#333",
        letterSpacing: 1,
        whiteSpace: "nowrap",
      }}>
        VÁLIDA EM TODO O TERRITÓRIO NACIONAL
      </div>

      <div style={{
        position: "absolute",
        left: 12,
        top: 80,
        transform: "rotate(-90deg)",
        transformOrigin: "left top",
        fontSize: 8,
        fontWeight: 700,
        color: "#333",
        letterSpacing: 1,
        whiteSpace: "nowrap",
        fontFamily: "'Courier New', Courier, monospace",
      }}>
        {registro || "0000000000"}
      </div>

      {/* Número registro lateral direita */}
      <div style={{
        position: "absolute",
        right: 2,
        bottom: 200,
        transform: "rotate(90deg)",
        transformOrigin: "right bottom",
        fontSize: 8,
        fontWeight: 700,
        color: "#333",
        letterSpacing: 1,
        whiteSpace: "nowrap",
        fontFamily: "'Courier New', Courier, monospace",
      }}>
        {registro || "0000000000"}
      </div>
    </div>
  );
}

function getEstadoNome(uf: string): string {
  const map: Record<string, string> = {
    AC: "ACRE", AL: "ALAGOAS", AP: "AMAPÁ", AM: "AMAZONAS",
    BA: "BAHIA", CE: "CEARÁ", DF: "DISTRITO FEDERAL", ES: "ESPÍRITO SANTO",
    GO: "GOIÁS", MA: "MARANHÃO", MT: "MATO GROSSO", MS: "MATO GROSSO DO SUL",
    MG: "MINAS GERAIS", PA: "PARÁ", PB: "PARAÍBA", PR: "PARANÁ",
    PE: "PERNAMBUCO", PI: "PIAUÍ", RJ: "RIO DE JANEIRO", RN: "RIO GRANDE DO NORTE",
    RS: "RIO GRANDE DO SUL", RO: "RONDÔNIA", RR: "RORAIMA", SC: "SANTA CATARINA",
    SP: "SÃO PAULO", SE: "SERGIPE", TO: "TOCANTINS",
  };
  return map[uf.toUpperCase()] || uf;
}
