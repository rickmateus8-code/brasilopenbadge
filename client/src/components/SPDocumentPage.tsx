/**
 * SPDocumentPage — Réplica visual do Histórico Escolar SP
 * v8 — Refinos com base no HTML/PDF de referência
 * - perfil base atualizado para SP/Cacapava
 * - tabela do aluno ajustada para o enquadramento da referência
 * - barras em branco com altura compatível às demais linhas
 * - correção dos valores originais usados no highlight
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  SP_GRADES_DEFAULT,
  SP_SECURITY_CODE_MODEL,
  buildSPCertificateSchoolName,
  buildSPFullSchoolName,
  formatSPSecurityCode,
  getSPGovernmentLabel,
  getSPStateLayout,
  normalizeStateUf,
  normalizeUppercase,
  type SPGradeRow,
} from "@/lib/historicoSPData";
import { BRASAO_SP_B64, SIG_GERENTE_B64, SIG_DIRETOR_B64 } from "@/lib/spAssets";

interface Props {
  f: Record<string, string>;
  highlightModified?: boolean;
  grades?: SPGradeRow[];
  brasaoUrl?: string;
  assinaturaGerenteUrl?: string;
  assinaturaDiretorUrl?: string;
  pageId?: string;
  disableAutoFit?: boolean;
}

/* Highlight helper */
function V({ val, orig, hl }: { val: string; orig?: string; hl?: boolean }) {
  const mod = orig !== undefined && val !== orig;
  return (
    <span style={mod && hl ? { borderBottom: "2px solid #2d8c4e", backgroundColor: "rgba(45,140,78,0.08)", padding: "0 1px" } : {}}>
      {val}
    </span>
  );
}

export function SPPage1({
  f,
  highlightModified,
  grades = SP_GRADES_DEFAULT,
  brasaoUrl,
  assinaturaGerenteUrl,
  assinaturaDiretorUrl,
  pageId = "doc-page-sp-1",
  disableAutoFit = false,
}: Props) {
  const hl = highlightModified;
  const b = "0.7px solid #000";
  const bT = "1.2px solid #000";
  const ff = "Arial, Helvetica, sans-serif";
  const grayFill = "#E5E5E5";
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  // --- LOGICA DINÂMICA ---
  const hasInstitutionState = Boolean(f.estado_instituicao || f.uf_documento);
  const tipoEscola = f.tipo_escola || "";
  const escolaBase = f.nome_escola || "";
  const escola = f.nome_escola_full || (escolaBase ? buildSPFullSchoolName(escolaBase, tipoEscola || "ESCOLA ESTADUAL") : "");
  const municipio = f.municipio_escola || "";
  const birthUf = f.estado_nascimento ? normalizeStateUf(f.estado_nascimento) : "";
  const institutionStateInput = f.estado_instituicao || f.uf_documento || "";
  const stateLayout = hasInstitutionState
    ? getSPStateLayout(institutionStateInput)
    : { uf: "", name: "", brasaoUrl: undefined, governmentPrefix: "DE" as const };
  const documentUf = normalizeUppercase(f.uf_documento || stateLayout.uf || "");
  const governoEstado = normalizeUppercase(f.governo_estado || stateLayout.name || "");
  const governmentHeader = hasInstitutionState ? getSPGovernmentLabel(documentUf, governoEstado) : "";
  const secretaria = normalizeUppercase(f.secretaria_estado || "");
  const aluno = normalizeUppercase(f.nome_aluno || "");
  const logoSrc = brasaoUrl || stateLayout.brasaoUrl || BRASAO_SP_B64;
  const sigGerente = assinaturaGerenteUrl || SIG_GERENTE_B64;
  const sigDiretor = assinaturaDiretorUrl || SIG_DIRETOR_B64;

  const codigoSeguranca = f.codigo_seguranca ? formatSPSecurityCode(f.codigo_seguranca, documentUf || "SP") : "";
  const registroGdae = f.registro_gdae ? formatSPSecurityCode(f.registro_gdae, documentUf || "SP") : codigoSeguranca;
  const escolaCertificado = f.nome_escola_certificado || buildSPCertificateSchoolName(escola);
  const localData = f.local_data || (f.local_emissao && f.data_emissao ? `${f.local_emissao}, ${f.data_emissao}` : "");
  const schoolHeaderFontSize =
    escola.length > 54 ? "9.1pt" : escola.length > 44 ? "9.8pt" : "10.9pt";
  const certificateFontSize =
    aluno.length + escolaCertificado.length > 92 ? "9.2pt" : "9.7pt";

  /* Vertical text style */
  const vt = (fs = "7pt", bold = true): CSSProperties => ({
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    fontSize: fs,
    fontWeight: bold ? "bold" : "normal",
    whiteSpace: "nowrap",
    letterSpacing: "0.3px",
    lineHeight: 1.1,
    textAlign: "center",
    fontFamily: ff,
  });

  /* Cell style helpers */
  const cellS = (extra: CSSProperties = {}): CSSProperties => ({
    border: b, fontFamily: ff, padding: "0 2px", ...extra,
  });
  const centerS = (extra: CSSProperties = {}): CSSProperties => ({
    ...cellS(extra), textAlign: "center",
  });

  useLayoutEffect(() => {
    if (disableAutoFit) return;

    const page = pageRef.current;
    const content = contentRef.current;
    if (!page || !content) return;

    let frameA = 0;
    let frameB = 0;

    const measure = () => {
      const pageStyles = window.getComputedStyle(page);
      const paddingTop = parseFloat(pageStyles.paddingTop || "0") || 0;
      const paddingBottom = parseFloat(pageStyles.paddingBottom || "0") || 0;
      const availableHeight = page.clientHeight - paddingTop - paddingBottom;
      const currentScale = fitScale || 1;
      const contentRect = content.getBoundingClientRect();

      let naturalHeight = content.scrollHeight;
      const descendants = content.querySelectorAll<HTMLElement>("*");

      descendants.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const renderedBottom = rect.bottom - contentRect.top;
        if (renderedBottom > 0) {
          naturalHeight = Math.max(naturalHeight, renderedBottom / currentScale);
        }
      });

      if (!availableHeight || !naturalHeight) {
        setFitScale(1);
        return;
      }

      const overflowScale = naturalHeight > availableHeight
        ? Math.min(1, (availableHeight - 1) / naturalHeight)
        : 1;
      const fillRatio = naturalHeight / availableHeight;

      // Evita "ping-pong" visual entre 1 e um scale levemente menor,
      // que causava o efeito de piscar quando o conteúdo ficava no limite.
      // Só relaxa de volta para 1 quando existe folga real de altura.
      let nextScale = fitScale;
      if (naturalHeight > availableHeight) {
        nextScale = overflowScale;
      } else if (fitScale < 0.999 && fillRatio < 0.97) {
        nextScale = overflowScale;
      } else if (fitScale >= 0.999) {
        nextScale = 1;
      }

      setFitScale((current) => (Math.abs(current - nextScale) > 0.002 ? nextScale : current));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameA);
      cancelAnimationFrame(frameB);
      frameA = requestAnimationFrame(() => {
        frameB = requestAnimationFrame(measure);
      });
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleMeasure)
      : null;

    resizeObserver?.observe(page);
    resizeObserver?.observe(content);

    const imageLoadListeners = Array.from(content.querySelectorAll("img")).map((img) => {
      img.addEventListener("load", scheduleMeasure);
      img.addEventListener("error", scheduleMeasure);
      return img;
    });

    scheduleMeasure();

    return () => {
      cancelAnimationFrame(frameA);
      cancelAnimationFrame(frameB);
      resizeObserver?.disconnect();
      imageLoadListeners.forEach((img) => {
        img.removeEventListener("load", scheduleMeasure);
        img.removeEventListener("error", scheduleMeasure);
      });
    };
  }, [f, grades, brasaoUrl, assinaturaGerenteUrl, assinaturaDiretorUrl, fitScale, disableAutoFit]);

  /* Build grade rows with blank separators */
  const areas = [
    { label: "Linguagens\nCódigos e\nsuas\nTecnologias", rows: [0, 1, 2] },
    { label: "Ciências da\nNatureza,\nMatemática e\nsuas\nTecnologias", rows: [3, 4, 5, 6] },
    { label: "Ciências\nHumanas e\nsuas\nTecnologias", rows: [7, 8, 9, 10] },
  ];
  const blankRowBefore = new Set([3, 7]);

  const gradeRows: React.ReactNode[] = [];
  grades.forEach((g, i) => {
    if (blankRowBefore.has(i)) {
      gradeRows.push(
        <tr key={`blank-${i}`}>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
          <td style={{ height: "18px", padding: 0, border: b }}></td>
        </tr>
      );
    }
    const area = areas.find((a) => a.rows.includes(i));
    const isFirstInArea = area && area.rows[0] === i;
    gradeRows.push(
      <tr key={i}>
        {isFirstInArea && (
          <td rowSpan={area!.rows.length} style={centerS({ padding: "1px 1px", fontSize: "8.7pt", verticalAlign: "middle", lineHeight: 1.15 })}>
            {area!.label.split("\n").map((line, li) => <span key={li}>{line}{li < area!.label.split("\n").length - 1 && <br />}</span>)}
          </td>
        )}
        <td style={cellS({ padding: "0.5px 3px", fontSize: "10pt" })}>{g.disciplina}</td>
        <td style={centerS({ fontSize: "10pt" })}></td>
        <td style={centerS({ fontSize: "10pt" })}>{g.nota1}</td>
        <td style={centerS({ fontSize: "10pt" })}>{g.nota2}</td>
        <td style={centerS({ fontSize: "10pt" })}>{g.nota3}</td>
        <td style={centerS({ fontSize: "10pt" })}>{g.ch}</td>
      </tr>
    );
  });

  return (
    <div
      className="doc-page-sp"
      id={pageId}
      ref={pageRef}
      style={{
        width: "210mm", height: "297mm", minHeight: "297mm", maxHeight: "297mm",
        overflow: "hidden", background: "white", fontFamily: ff, fontSize: "10pt",
        lineHeight: 1.2, color: "#000", boxSizing: "border-box", position: "relative",
        padding: "9.9mm 12.7mm 12mm 14.5mm",
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: disableAutoFit ? "100%" : fitScale < 1 ? `${100 / fitScale}%` : "100%",
          transform: disableAutoFit ? "none" : `scale(${fitScale})`,
          transformOrigin: "top left",
        }}
      >
      {/* CABEÇALHO (com brasão + linhas, conforme referência) */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: bT, tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "20.8%" }} /><col style={{ width: "79.2%" }} /></colgroup>
        <tbody>
          <tr>
          <td rowSpan={7} style={{ borderRight: b, padding: "4px", verticalAlign: "middle", textAlign: "center" }}>
              {/* Brasão aumentado em 10%: 118px → 130px */}
              <img src={logoSrc} alt="" style={{ width: "130px", height: "auto", display: "block", margin: "0 auto" }} crossOrigin="anonymous" />
            </td>
            <td style={{ borderBottom: b, padding: "1px 8px", fontSize: "14pt", fontWeight: "bold", lineHeight: 1.15 }}>
              <V val={governmentHeader} orig="GOVERNO DO ESTADO DE SÃO PAULO" hl={hl} />
            </td>
          </tr>
          <tr>
            <td style={{ borderBottom: b, padding: "1px 8px", fontSize: "10.6pt", fontWeight: "bold", lineHeight: 1.2 }}>
              <V val={secretaria} orig="SECRETARIA DE ESTADO DA EDUCAÇÃO" hl={hl} />
            </td>
          </tr>
          <tr>
            <td style={{ borderBottom: b, padding: "1px 8px", fontSize: schoolHeaderFontSize, fontWeight: "bold", lineHeight: 1.15 }}>
              <V val={escola} orig="ESCOLA ESTADUAL E. E. Mª APDA. FRANÇA B. ARAUJO PROFª" hl={hl} />
            </td>
          </tr>
          <tr>
            <td style={{ borderBottom: b, padding: "1px 8px", fontSize: "9pt", lineHeight: 1.2 }}>
              Ato Legal de Criação: <V val={f.ato_legal} orig="906748" hl={hl} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: 0, borderBottom: b }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "86%" }} /><col style={{ width: "14%" }} /></colgroup>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 8px", fontSize: "8.8pt", lineHeight: 1.2 }}>
                      Endereço: <V val={f.endereco_escola} orig="Av. Honorio Ferreira Pedrosa" hl={hl} />
                    </td>
                    <td style={{ padding: "1px 6px", fontSize: "8.8pt", lineHeight: 1.2, borderLeft: b, textAlign: "left", whiteSpace: "nowrap" }}>
                      nº <V val={f.numero_escola} orig="611" hl={hl} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ padding: 0, borderBottom: b }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "27%" }} /><col style={{ width: "48%" }} /><col style={{ width: "25%" }} /></colgroup>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 8px", fontSize: "8.8pt", lineHeight: 1.2 }}>
                      Bairro: <V val={f.bairro} orig="Pq Nova Cacapava" hl={hl} />
                    </td>
                    <td style={{ padding: "1px 8px", fontSize: "8.8pt", lineHeight: 1.2, borderLeft: b }}>
                      Município: <V val={municipio} orig="Cacapava" hl={hl} />
                    </td>
                    <td style={{ padding: "1px 6px", fontSize: "8.8pt", lineHeight: 1.2, borderLeft: b }}>
                      CEP: <V val={f.cep_escola} orig="06411-160" hl={hl} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "26%" }} /><col style={{ width: "74%" }} /></colgroup>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 8px", fontSize: "8.8pt", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                      Tel. <V val={f.telefone_escola} orig="(12) 36521267" hl={hl} />
                    </td>
                    <td style={{ padding: "1px 8px", fontSize: "8.8pt", lineHeight: 1.2, borderLeft: b }}>
                      Endereço eletrônico: <V val={f.email_escola} orig="E906748A@EDUCACAO.SP.GOV.BR" hl={hl} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* TÍTULO */}
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12pt", padding: "4px 0", background: "#e2e2e2", borderLeft: bT, borderRight: bT, borderBottom: bT, letterSpacing: "0.3px" }}>
        HISTÓRICO ESCOLAR – ENSINO MÉDIO
      </div>

      {/* DADOS DO ALUNO */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderLeft: bT, borderRight: bT, borderBottom: bT, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "20.0%" }} />
          <col style={{ width: "40.0%" }} />
          <col style={{ width: "18.0%" }} />
          <col style={{ width: "22.0%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={2} style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>Nome do Aluno</b>: <V val={aluno} orig="GIOVANE SILVA DOS SANTOS" hl={hl} /></td>
            <td style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>R.G. :</b> <V val={f.rg} orig="555285753" hl={hl} /></td>
            <td style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>RA:</b> <V val={f.ra} orig="26205579-0" hl={hl} /></td>
          </tr>
          <tr>
            <td rowSpan={2} style={cellS({ padding: "2px 4px", fontSize: "10pt", fontWeight: "bold", verticalAlign: "middle", textAlign: "center" })}>Nascimento</td>
            <td style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>Município:</b> <V val={f.municipio_nascimento || municipio} orig="Cacapava" hl={hl} /></td>
            <td style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>Estado:</b> <V val={birthUf} orig="SP" hl={hl} /></td>
            <td style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>País:</b> <V val={f.pais} orig="BRASIL" hl={hl} /></td>
          </tr>
          <tr>
            <td colSpan={3} style={cellS({ padding: "1px 4px", fontSize: "10pt" })}><b>Data:</b> <V val={f.data_nascimento} orig="01/12/1999" hl={hl} /></td>
          </tr>
        </tbody>
      </table>

      <div style={{ height: "5mm" }} />

      {/* TABELA DE NOTAS */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: bT, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "4.3%" }} /><col style={{ width: "5.0%" }} /><col style={{ width: "10.9%" }} /><col style={{ width: "43.0%" }} />
          <col style={{ width: "7.2%" }} /><col style={{ width: "7.2%" }} /><col style={{ width: "7.2%" }} /><col style={{ width: "7.3%" }} /><col style={{ width: "7.9%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td rowSpan={100} style={{ borderRight: b, verticalAlign: "middle", textAlign: "center", padding: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}><div style={vt("9.8pt", true)}>Fundamento Legal: Lei Federal 9394/96</div></div>
            </td>
            {/* BASE NACIONAL COMUM +25% → 12.5pt */}
            <td rowSpan={17} style={{ borderRight: b, borderBottom: b, verticalAlign: "middle", textAlign: "center", padding: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}><div style={vt("12.5pt", true)}>BASE NACIONAL COMUM</div></div>
            </td>
            <td rowSpan={2} style={centerS({ padding: "2px 1px", fontSize: "6.5pt", fontWeight: "bold", lineHeight: 1.2, verticalAlign: "middle" })}>ÁREAS DE<br />CONHECIMENTO</td>
            <td rowSpan={2} style={centerS({ padding: "2px 2px", fontSize: "10pt", fontWeight: "bold", verticalAlign: "middle" })}>COMPONENTES CURRICULARES</td>
            <td style={centerS({ padding: "1px 0", fontSize: "8.5pt", borderBottom: b })}>Ano</td>
            <td style={centerS({ padding: "1px 0", fontSize: "8pt", borderBottom: b })}><V val={f.ano_1a_serie} orig="2017" hl={hl} /></td>
            <td style={centerS({ padding: "1px 0", fontSize: "8pt", borderBottom: b })}><V val={f.ano_2a_serie} orig="2018" hl={hl} /></td>
            <td style={centerS({ padding: "1px 0", fontSize: "8pt", borderBottom: b })}><V val={f.ano_3a_serie} orig="2019" hl={hl} /></td>
            <td rowSpan={2} style={centerS({ padding: "1px 0", fontSize: "6.5pt", fontWeight: "bold", lineHeight: 1.2, verticalAlign: "middle" })}>CARGA<br />HORÁRIA</td>
          </tr>
          <tr>
            <td style={centerS({ padding: "1px 0", fontSize: "8.5pt" })}>Série</td>
            <td style={centerS({ padding: "1px 0", fontSize: "9pt", fontWeight: "bold" })}>1ª</td>
            <td style={centerS({ padding: "1px 0", fontSize: "9pt", fontWeight: "bold" })}>2ª</td>
            <td style={centerS({ padding: "1px 0", fontSize: "9pt", fontWeight: "bold" })}>3ª</td>
          </tr>
          {gradeRows}
          <tr>
            <td colSpan={2} style={cellS({ padding: "0.5px 3px", fontSize: "8pt" })}>Total de aulas anuais da Base Nacional Comum</td>
            <td style={cellS({ padding: "0.5px 0" })}></td><td style={cellS({ padding: "0.5px 0" })}></td><td style={cellS({ padding: "0.5px 0" })}></td><td style={cellS({ padding: "0.5px 0" })}></td><td style={cellS({ padding: "0.5px 0" })}></td>
          </tr>
          <tr>
            <td colSpan={2} style={cellS({ padding: "0.5px 3px", fontSize: "8pt", fontWeight: "bold", background: grayFill })}>TOTAL DA CARGA HORÁRIA DA BASE NACIONAL COMUM</td>
            <td style={cellS({ padding: "0.5px 0", background: grayFill })}></td>
            <td style={centerS({ fontSize: "10pt", fontWeight: "bold", background: grayFill })}>960</td><td style={centerS({ fontSize: "10pt", fontWeight: "bold", background: grayFill })}>960</td><td style={centerS({ fontSize: "10pt", fontWeight: "bold", background: grayFill })}>960</td><td style={centerS({ fontSize: "10pt", fontWeight: "bold", background: grayFill })}>2880</td>
          </tr>
          {/* PARTE DIVERSIFICADA +25% → 10pt */}
          <tr>
            <td rowSpan={5} style={{ borderRight: b, borderBottom: b, verticalAlign: "middle", textAlign: "center", padding: 0, position: "relative", background: grayFill, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: grayFill }}><div style={vt("7.1pt", true)}><span>PARTE</span><br /><span>DIVERSIFICADA</span></div></div>
            </td>
            <td colSpan={2} style={cellS({ padding: "2px 3px", fontSize: "9pt", background: grayFill })}>Língua Estrangeira Moderna</td>
            <td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td>
          </tr>
          <tr>
            <td colSpan={2} style={cellS({ padding: "2px 3px", fontSize: "9pt", background: grayFill })}>Disciplina de Apoio Curricular: <V val={f.disciplina_apoio_1} orig="Língua Portuguesa e Literatura" hl={hl} /></td>
            <td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td>
          </tr>
          <tr>
            <td colSpan={2} style={cellS({ padding: "2px 3px", fontSize: "9pt", background: grayFill })}>Disciplina de Apoio Curricular: <V val={f.disciplina_apoio_2 || ""} orig="" hl={hl} /></td>
            <td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td><td style={cellS({ padding: "2px 0" })}></td>
          </tr>
          <tr><td colSpan={7} style={{ height: "12px", padding: 0, border: b, borderLeft: "none", background: "#fff" }}></td></tr>
          {/* Linha vazia dentro do rowspan de PARTE DIVERSIFICADA */}
          <tr><td colSpan={7} style={{ height: "12px", padding: 0, border: b, borderLeft: "none", background: "#fff" }}></td></tr>
          {/* Fora do rowspan — colSpan=8 inclui a coluna anteriormente ocupada por PARTE DIVERSIFICADA */}
          <tr><td colSpan={8} style={cellS({ padding: "3px 3px", fontSize: "8pt", fontWeight: "bold", background: grayFill })}>TOTAL DE AULAS ANUAIS DA PARTE DIVERSIFICADA</td></tr>
          <tr><td colSpan={8} style={cellS({ padding: "3px 3px", fontSize: "8pt", fontWeight: "bold", background: grayFill })}>TOTAL DA CARGA HORÁRIA DA PARTE DIVERSIFICADA</td></tr>
          {/* Linha vazia antes do total anual */}
          <tr><td colSpan={8} style={{ height: "12px", padding: 0, border: b, background: "#fff" }}></td></tr>
          <tr><td colSpan={8} style={cellS({ padding: "3px 3px", fontSize: "8pt", fontWeight: "bold", borderBottom: bT, background: grayFill })}>TOTAL DE CARGA HORÁRIA ANUAL DO CURSO</td></tr>
          {/* ESTUDOS REALIZADOS +25% → 10pt */}
          <tr>
            <td rowSpan={2} style={{ borderRight: b, borderBottom: bT, verticalAlign: "middle", textAlign: "center", padding: 0, position: "relative", background: grayFill, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: grayFill }}><div style={vt("7.1pt", true)}><span>ESTUDOS</span><br /><span>REALIZADOS</span></div></div>
            </td>
            <td colSpan={7} style={{ border: b, padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "13.8%" }} /><col style={{ width: "8.4%" }} /><col style={{ width: "6.4%" }} /><col style={{ width: "46.8%" }} /><col style={{ width: "15.9%" }} /><col style={{ width: "8.7%" }} /></colgroup>
                <tbody>
                  <tr>
                    <td style={cellS({ padding: "1px 2px", fontSize: "7pt", borderLeft: "none", borderTop: "none", borderBottom: "none" })}></td>
                    <td style={centerS({ fontWeight: "bold", fontSize: "8.4pt", borderTop: "none", borderBottom: "none", background: grayFill })}>Série</td>
                    <td style={centerS({ fontWeight: "bold", fontSize: "8.4pt", borderTop: "none", borderBottom: "none", background: grayFill })}>Ano</td>
                    <td style={centerS({ fontWeight: "bold", fontSize: "8.4pt", borderTop: "none", borderBottom: "none", background: grayFill })}>Estabelecimento de Ensino</td>
                    <td style={centerS({ fontWeight: "bold", fontSize: "8.4pt", borderTop: "none", borderBottom: "none", background: grayFill })}>Município</td>
                    <td style={centerS({ fontWeight: "bold", fontSize: "8.4pt", borderTop: "none", borderRight: "none", borderBottom: "none", background: grayFill })}>UF</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={7} style={{ borderBottom: bT, padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "13.8%" }} /><col style={{ width: "8.4%" }} /><col style={{ width: "6.4%" }} /><col style={{ width: "46.8%" }} /><col style={{ width: "15.9%" }} /><col style={{ width: "8.7%" }} /></colgroup>
                <tbody>
                  {/* Ensino Fundamental */}
                  <tr>
                    <td style={{ border: b, borderLeft: "none", borderTop: "none", textAlign: "center", verticalAlign: "middle", fontSize: "7.4pt", lineHeight: 1.3, padding: "2px 2px" }}>
                      Ensino<br />Fundamental
                    </td>
                    <td style={centerS({ fontSize: "8.4pt", borderTop: "none" })}>{f.ano_fund_serie || "8ª Série"}</td>
                    <td style={centerS({ fontSize: "8.4pt", borderTop: "none" })}>{f.ano_fund || "2016"}</td>
                    <td style={centerS({ fontSize: "8.4pt", padding: "1px 3px", borderTop: "none" })}><V val={escola} orig="ESCOLA ESTADUAL E. E. Mª APDA. FRANÇA B. ARAUJO PROFª" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", borderTop: "none" })}><V val={municipio} orig="Cacapava" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", borderTop: "none", borderRight: "none" })}><V val={documentUf} orig="SP" hl={hl} /></td>
                  </tr>
                  {/* Ensino Médio — 3 linhas com rowspan */}
                  <tr>
                    <td rowSpan={3} style={{ border: b, borderLeft: "none", borderBottom: "none", textAlign: "center", verticalAlign: "middle", fontSize: "7.4pt", lineHeight: 1.3, padding: "2px 2px" }}>
                      Ensino<br />Médio
                    </td>
                    <td style={centerS({ fontSize: "8.4pt" })}>1ª Série</td>
                    <td style={centerS({ fontSize: "8.4pt" })}><V val={f.ano_1a_serie} orig="2017" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", padding: "1px 3px" })}><V val={escola} orig="ESCOLA ESTADUAL E. E. Mª APDA. FRANÇA B. ARAUJO PROFª" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt" })}><V val={municipio} orig="Cacapava" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", borderRight: "none" })}><V val={documentUf} orig="SP" hl={hl} /></td>
                  </tr>
                  <tr>
                    <td style={centerS({ fontSize: "8.4pt" })}>2ª Série</td>
                    <td style={centerS({ fontSize: "8.4pt" })}><V val={f.ano_2a_serie} orig="2018" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", padding: "1px 3px" })}><V val={escola} orig="ESCOLA ESTADUAL E. E. Mª APDA. FRANÇA B. ARAUJO PROFª" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt" })}><V val={municipio} orig="Cacapava" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", borderRight: "none" })}><V val={documentUf} orig="SP" hl={hl} /></td>
                  </tr>
                  <tr>
                    <td style={centerS({ fontSize: "8.4pt", borderBottom: "none" })}>3ª Série</td>
                    <td style={centerS({ fontSize: "8.4pt", borderBottom: "none" })}><V val={f.ano_3a_serie} orig="2019" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", padding: "1px 3px", borderBottom: "none" })}><V val={escola} orig="ESCOLA ESTADUAL E. E. Mª APDA. FRANÇA B. ARAUJO PROFª" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", borderBottom: "none" })}><V val={municipio} orig="Cacapava" hl={hl} /></td>
                    <td style={centerS({ fontSize: "8.4pt", borderRight: "none", borderBottom: "none" })}><V val={documentUf} orig="SP" hl={hl} /></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ESCALA / OBSERVAÇÕES */}
      <div style={{ borderLeft: bT, borderRight: bT, borderBottom: b, padding: "1px 4px", fontSize: "8pt", lineHeight: 1.2 }}>
        <b>Escala de Avaliação:</b> &quot;<i>A partir de 2007 - Escala numérica de notas de 0 (zero) a 10 (dez) com patamar indicativo de desempenho escolar satisfatório, a nota igual ou superior a 05 (cinco) nos termos da Resolução SE - 61, de 24/9/2007.</i>&quot;
      </div>
      <div style={{ borderLeft: bT, borderRight: bT, borderBottom: b, padding: "2px 4px 4px 4px", fontSize: "8pt", lineHeight: 1.25 }}>
        <b>OBSERVAÇÕES:</b>
        <div style={{ marginLeft: "18px", marginTop: "2px" }}>
          <span style={{ marginRight: "6px" }}>&#8226;</span><b>CÓDIGO DE SEGURANÇA: <V val={codigoSeguranca} orig="SP41214853-0SP" hl={hl} /></b>
        </div>
      </div>

      {/* CERTIFICADO */}
      <div style={{ borderLeft: bT, borderRight: bT, borderBottom: bT }}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11pt", letterSpacing: "1.3px", padding: "3px 0 2px 0", borderBottom: b, borderTop: bT, background: "#e2e2e2" }}>CERTIFICADO</div>
        <div style={{ padding: "3px 6px", fontSize: certificateFontSize, lineHeight: 1.24 }}>
          O Diretor(a) da <b><V val={escolaCertificado} orig="E. E. Mª APDA. FRANÇA B. ARAUJO PROFª" hl={hl} /></b>, CERTIFICA, nos termos do Inciso VII, Artigo 24 da Lei Federal 9394/96, que <b><V val={aluno} orig="GIOVANE SILVA DOS SANTOS" hl={hl} /></b>, <b>R.G. : <V val={f.rg} orig="555285753" hl={hl} /></b>, concluiu o Ensino Médio nesta instituição no ano de <V val={f.ano_conclusao} orig="2019" hl={hl} />.
        </div>
        <div style={{ borderTop: b, padding: "2px 6px 3px 6px", fontSize: "9.2pt", lineHeight: 1.15 }}><b>Número de registro da publicação</b> no Sistema GDAE (Resolução SE108/02): <b><V val={registroGdae} orig="SP41214853-0SP" hl={hl} /></b></div>
      </div>

      {/* ASSINATURAS */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", borderLeft: bT, borderRight: bT, borderBottom: bT }}>
        <colgroup><col style={{ width: "34.5%" }} /><col style={{ width: "31.3%" }} /><col style={{ width: "34.2%" }} /></colgroup>
        <tbody>
          <tr>
            <td style={{ borderRight: b, borderTop: b, padding: "2px 4px", textAlign: "center", fontSize: "7.1pt", verticalAlign: "bottom", position: "relative", height: "60px" }}>
              <div style={{ position: "absolute", top: "-1px", left: "11%", width: "78%", height: "44px", zIndex: 1 }}><img src={sigGerente} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.85 }} crossOrigin="anonymous" /></div>
              <div style={{ position: "absolute", bottom: "3px", left: 0, right: 0, zIndex: 2 }}>
                <div>Nome: <V val={f.gerente_nome} orig="MARISTELA GALVANI MACHADO" hl={hl} /></div>
                <div>R.G. : <V val={f.gerente_rg} orig="23.425.125-45" hl={hl} /></div>
                <div style={{ fontWeight: "bold" }}>Gerente de Organização Escolar</div>
              </div>
            </td>
            <td style={{ borderRight: b, borderTop: b, padding: "2px 4px", textAlign: "center", fontSize: "7.1pt", verticalAlign: "bottom", position: "relative", height: "60px" }}>
              <div style={{ position: "absolute", bottom: "3px", left: 0, right: 0 }}>
                <div style={{ marginBottom: "5px", textDecoration: "underline" }}><V val={localData} orig="CACAPAVA - SP, 04/12/2019" hl={hl} /></div>
                <div style={{ fontWeight: "bold" }}>LOCAL/DATA</div>
              </div>
            </td>
            {/* Assinatura do Diretor (Angela Pereira) +15%: 67px→77px, 96%→110% */}
            <td style={{ borderTop: b, padding: "2px 4px", textAlign: "center", fontSize: "7.1pt", verticalAlign: "bottom", position: "relative", height: "60px" }}>
              <div style={{ position: "absolute", top: "-8px", left: "-4%", width: "108%", height: "68px", zIndex: 1 }}><img src={sigDiretor} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.85 }} crossOrigin="anonymous" /></div>
              <div style={{ position: "absolute", bottom: "3px", left: 0, right: 0, zIndex: 2 }}>
                <div>Nome: <V val={f.diretor_nome} orig="ANGELA PEREIRA DOS SANTOS" hl={hl} /></div>
                <div>R.G. : <V val={f.diretor_rg} orig="13.068.721-63" hl={hl} /></div>
                <div style={{ fontWeight: "bold" }}>Diretor de Escola</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
