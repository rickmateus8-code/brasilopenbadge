/**
 * DocumentPages — Histórico UNINTER Elite 3.0 (Universal)
 * Otimizado com Estrutura Flexbox para Exportação PDF Impecável.
 */
import {
  COURSE_METADATA, getGradesForProfile,
  type GradeRow, type ProfileKey,
} from "@/lib/documentData_uninter";
import {
  UNINTER_LOGO_B64,
  UNINTER_ASSINATURA_B64,
  UNINTER_SELO_B64
} from "@/lib/uninterAssets";
import React, { useMemo } from "react";

interface Props {
  f: Record<string, string>;
  highlightModified?: boolean;
  profileKey?: ProfileKey;
  gradeRows?: GradeRow[];
}

// ── Estilos base ──────────────────────────────────────────────────────────────
const PAGE_STYLE: React.CSSProperties = {
  width: "207.53mm",
  minHeight: "293.47mm",
  background: "white",
  padding: "12mm 18mm 12mm 18mm", 
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: "10.5pt", 
  lineHeight: 1.25,
  color: "#000",
  position: "relative",
  boxSizing: "border-box",
  overflow: "visible",
};

const FIELDSET_STYLE: React.CSSProperties = {
  border: "1px solid #000",
  padding: "6px 10px",
  margin: "5px 0",
  position: "relative",
};

const LEGEND_STYLE: React.CSSProperties = {
  position: "absolute",
  top: -10,
  left: 10,
  background: "#fff",
  padding: "0 5px",
  fontWeight: "bold",
  fontSize: "9pt",
};

// ── Estilos da Grade (Flexbox para evitar quebras no PDF) ──────────────────────
const GRID_CONTAINER: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  marginTop: 4,
};

const GRID_HEADER: React.CSSProperties = {
  display: "flex",
  borderBottom: "1.2px solid #000",
  paddingBottom: 4,
  fontWeight: "bold",
  fontSize: "8.2pt",
  textAlign: "left",
};

const GRID_ROW: React.CSSProperties = {
  display: "flex",
  borderBottom: "0.5px solid #ccc",
  padding: "4px 0", // Espaçamento aumentado (+1%)
  minHeight: "14pt",
  fontSize: "8.2pt",
  alignItems: "flex-start",
  overflow: "visible",
};

const CELL_STYLE: React.CSSProperties = {
  padding: "0 4px",
  lineHeight: 1.4, // Aumentado para clareza e evitar ruptura
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function V({ val, orig, highlight }: { val: string; orig: string; highlight?: boolean }) {
  const isModified = val && val !== orig;
  return (
    <span
      style={isModified && highlight
        ? { padding: "0 2px", borderBottom: "2px solid #e8a317", backgroundColor: "rgba(232,163,23,0.12)", borderRadius: 2 }
        : {}}
    >
      {val || orig}
    </span>
  );
}

function GradeGrid({ rows }: { rows: GradeRow[] }) {
  return (
    <div style={GRID_CONTAINER}>
      {/* Header */}
      <div style={GRID_HEADER}>
        <div style={{ ...CELL_STYLE, width: "55px" }}>Ano/Mês*</div>
        <div style={{ ...CELL_STYLE, flex: 1 }}>Disciplinas</div>
        <div style={{ ...CELL_STYLE, width: "38px", textAlign: "center" }}>C.H.</div>
        <div style={{ ...CELL_STYLE, width: "38px", textAlign: "center" }}>Média</div>
        <div style={{ ...CELL_STYLE, width: "75px", textAlign: "center" }}>Resultado</div>
        <div style={{ ...CELL_STYLE, width: "125px", textAlign: "center" }}>Docente</div>
        <div style={{ ...CELL_STYLE, width: "85px" }}>Titulação</div>
      </div>

      {/* Body */}
      {rows.map((r, i) => (
        <div key={i} style={GRID_ROW}>
          <div style={{ ...CELL_STYLE, width: "55px", whiteSpace: "nowrap" }}>{r.anoMes}</div>
          <div style={{ ...CELL_STYLE, flex: 1, fontSize: "7.8pt", paddingRight: 8 }}>{r.disciplina}</div>
          <div style={{ ...CELL_STYLE, width: "38px", textAlign: "center" }}>{r.ch}</div>
          <div style={{ ...CELL_STYLE, width: "38px", textAlign: "center" }}>{r.media}</div>
          <div style={{ ...CELL_STYLE, width: "75px", textAlign: "center" }}>{r.resultado}</div>
          <div style={{ ...CELL_STYLE, width: "125px", textAlign: "center", fontSize: "6.8pt", wordBreak: "break-all", whiteSpace: "normal" }}>{r.docente}</div>
          <div style={{ ...CELL_STYLE, width: "85px", fontSize: "7pt", whiteSpace: "normal" }}>{r.titulacao}</div>
        </div>
      ))}
    </div>
  );
}

function resolveKey(profileKey?: ProfileKey): ProfileKey {
  return profileKey || "historia";
}

function getMeta(profileKey?: ProfileKey) {
  return COURSE_METADATA[resolveKey(profileKey)];
}

// ── Shared components ─────────────────────────────────────────────────────────
function DocFooter({ f, profileKey }: { f: any; profileKey?: ProfileKey }) {
  const meta = getMeta(profileKey);
  const emissaoHora = f.emissao_hora || "15:01:39";
  const dataEmissao = f.expedicao_diploma || "____/____/________";
  const validationCode = f.codigo_validacao || "____________________";
  const unidadeUF = f.unidade_uf || "PR";

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      <div style={{ textAlign: "center", fontStyle: "italic", fontSize: "8pt", margin: "4px 0", lineHeight: 1.2 }}>
        O presente documento foi emitido digitalmente amparado pelo Ofício n.º 38/CES/CNE/MEC de 04/03/2011 e pelo Ofício n.º
        {" "}387/2016/CES/SAO/CNE/CNE-MEC.<br />
        A validação da veracidade é dada por meio do endereço eletrônico{" "}
        <span style={{ textDecoration: "none" }}>https://uninter-meudiploma.online</span>{" "}
        a partir dos dados contidos no rodapé deste documento.
      </div>
      <div style={{ textAlign: "center", fontSize: "8pt", margin: "4px 0", lineHeight: 1.2 }}>
        <b>UNIDADE {unidadeUF}:</b> {f.endereco || meta.unidadeEndereco}<br />
        <b>Contatos:</b> 41 3593 2900 |{" "}
        <span style={{ textDecoration: "none" }}>secretariageral@uninter.com</span>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0" }}>
        <img src={UNINTER_SELO_B64} alt="Selo UNINTER" style={{ width: 70, height: "auto", display: "block" }} crossOrigin="anonymous" />
        <div style={{ fontSize: "6.5pt", textAlign: "center", color: "#666", marginTop: 2, fontStyle: "italic" }}>
          Uninter PAP - Polo de apoio presencial*<br />
          *Local credenciado no MEC para apoio ao candidato/aluno e para o desenvolvimento das atividades pedagógicas e administrativas.
        </div>
      </div>

      <div style={{ fontSize: "6.5pt", textAlign: "justify", marginTop: 2, lineHeight: 1.15, wordSpacing: "0.5px" }}>
        ESTE DOCUMENTO É EMITIDO EXCLUSIVAMENTE PELA SECRETARIA GERAL DE GESTÃO ACADÊMICA DO CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER.<br />
        Reproduções indevidas são crimes (Decreto Lei nº 2.848/1940) sob Art. 298, 299, 301, 304 e 305 do CP, passíveis de reclusão e multa.
      </div>
      <div style={{ marginTop: 6, fontSize: "8pt", lineHeight: 1.2, textAlign: "justify" }}>
        Informamos que a validação da veracidade da emissão deste documento pode ser realizada através do site:<br />
        <a href="https://uninter-meudiploma.online" style={{ color: "#000", textDecoration: "none" }}>https://uninter-meudiploma.online</a><br />
        Documento emitido às {emissaoHora} do dia {dataEmissao}.<br />
        Código de Validação / Controle do documento: {validationCode}
      </div>
    </div>
  );
}

function Signature({ f, showLine = true }: { f: any; showLine?: boolean }) {
  const secretaria = "SIMONE RAMOS DE OLIVEIRA"; 
  return (
    <div style={{ textAlign: "center", margin: "10px 0 5px 0" }}>
      {showLine && (
        <div style={{ borderTop: "1px solid #000", width: "100%", margin: "0 auto 8px auto" }} />
      )}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img src={UNINTER_ASSINATURA_B64} alt="Assinatura" style={{ width: 85, height: "auto", display: "block" }} crossOrigin="anonymous" />
      </div>
      <b style={{ fontSize: "9.5pt", letterSpacing: "0.2px", display: "block", marginTop: 1 }}>{secretaria}</b>
      <span style={{ fontSize: "9pt", display: "block" }}>Secretária Geral de Gestão Acadêmica</span>
      <span style={{ fontSize: "8.5pt", display: "block", marginTop: 1, color: "#444" }}>PORT. Nº 169/2021</span>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
      <img src={UNINTER_LOGO_B64} alt="Logo UNINTER" style={{ width: 140, height: "auto", display: "block" }} crossOrigin="anonymous" />
    </div>
  );
}

function Fieldset({ legend, children, style }: { legend: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...FIELDSET_STYLE, ...style }}>
      <span style={LEGEND_STYLE}>{legend}</span>
      {children}
    </div>
  );
}

// ==================== PAGE 1 ====================
export function Page1({ f, highlightModified, profileKey }: Props) {
  const hl = highlightModified;
  const meta = getMeta(profileKey);
  const dateStr = f.dateText || meta.dateText;
  const reitor = "BENHUR ETELBERTO GAIO"; 
  const secretaria = "SIMONE RAMOS DE OLIVEIRA"; 
  
  return (
    <div className="doc-page" id="doc-page-1" style={PAGE_STYLE}>
      <Logo />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12pt", lineHeight: 1.4, margin: "12px 0 12px 0" }}>
        INFORMATIVO SOBRE COLAÇÃO DE GRAU E EVENTO FESTIVO E<br />
        EMISSÃO DE DOCUMENTAÇÃO DE CONCLUSÃO DE CURSO
      </div>

      <p style={{ fontWeight: "bold", margin: "8px 0 3px 0", fontSize: "9.5pt" }}>COLAÇÃO DE GRAU:</p>
      <p style={{ textAlign: "justify", margin: "0 0 5px 0", lineHeight: 1.3, fontSize: "9.5pt" }}>
        Em {f.colacao_grau} o <b>Centro Universitário Internacional UNINTER</b>, através da Secretaria Geral de Gestão Acadêmica, {secretaria}, em nome do magnífico Reitor, Professor Dr. {reitor}, vem informar que o(a) aluno(a) <b><V val={f.nome} orig="" highlight={hl} /></b>, CPF n.º <V val={f.cpf} orig="" highlight={hl} />, matriculado(a) sob o registro acadêmico n.º <V val={f.matricula} orig="" highlight={hl} />, Colou Grau no <b><V val={f.curso || meta.cursoCompleto} orig="" highlight={hl} /></b>, nível de Graduação, por ter cumprido todas as exigências curriculares do curso.
      </p>

      <p style={{ fontWeight: "bold", margin: "8px 0 3px 0", fontSize: "9.5pt" }}>EVENTO FESTIVO DE COLAÇÃO DE GRAU:</p>
      <p style={{ textAlign: "justify", margin: "0 0 4px 0", lineHeight: 1.3, fontSize: "9.5pt" }}>
        O <b>Centro Universitário Internacional UNINTER</b> fornece gratuitamente a transmissão do cerimonial de Colação de Grau via vídeo, no mesmo formato das aulas, o qual é transmitido no Polo de Apoio de Presencial em datas específicas.
      </p>
      <p style={{ textAlign: "justify", margin: "4px 0 0 0", lineHeight: 1.3, fontSize: "9.5pt" }}>
        O <b>Centro Universitário Internacional UNINTER</b> não financia gastos decorrentes dos eventos de festividades de Formatura realizada no Polo de Apoio Presencial ou pela turma em locais particulares, como por exemplo: espaço físico locado, decoração, becas, capelos, canudos, convites, transportes, etc., cabendo os custos e a organização do evento aos contratantes dos serviços.
      </p>

      <p style={{ fontWeight: "bold", margin: "8px 0 3px 0", fontSize: "9.5pt" }}>DOCUMENTOS DE CONCLUSÃO:</p>
      <p style={{ textAlign: "justify", margin: "0 0 0 0", lineHeight: 1.3, fontSize: "9.5pt" }}>
        A Secretaria Geral de Gestão Acadêmica disponibiliza gratuitamente os seguintes documentos:<br />
        -1ª via do <b>CERTIFICADO DE CONCLUSÃO DE CURSO</b> e <b>HISTÓRICO ESCOLAR</b> emitidos digitalmente.<br />
        -1ª via do <b>DIPLOMA</b>, o qual será enviado ao Polo de Apoio Presencial no prazo de até 120 dias a contar da data da Colação de Grau.
      </p>

      <p style={{ marginTop: 10, fontSize: "9.5pt" }}>{dateStr}</p>
      <Signature f={f} showLine={true} />
      <DocFooter f={f} profileKey={profileKey} />
    </div>
  );
}

// ==================== PAGE 2 ====================
export function Page2({ f, highlightModified, profileKey }: Props) {
  const hl = highlightModified;
  const meta = getMeta(profileKey);
  const dateStr = f.dateText || meta.dateText;
  
  return (
    <div className="doc-page" id="doc-page-2" style={PAGE_STYLE}>
      <Logo />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12pt", margin: "15px 0 15px 0", textDecoration: "underline" }}>
        CERTIFICADO DE CONCLUSÃO DE CURSO
      </div>

      <p style={{ textAlign: "justify", marginTop: 10, lineHeight: 1.35, fontSize: "10pt" }}>
        Certificamos que <b><V val={f.nome} orig="" highlight={hl} /></b>, CPF n.º <V val={f.cpf} orig="" highlight={hl} />, matriculado(a) sob o registro acadêmico n.º <V val={f.matricula} orig="" highlight={hl} />, concluiu o <b>CURSO SUPERIOR DE <V val={f.curso || meta.cursoCompleto} orig="" highlight={hl} /></b>, nível de Graduação, com carga horária total de <V val={`${f.carga_horaria}h`} orig="0h" highlight={hl} />, ministrado pelo <b>CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER</b>, mantido pela <b>UNINTER EDUCACIONAL S.A.</b>, credenciado pela Portaria n.º <V val={f.cred_portaria} orig="688" highlight={hl} /> de <V val={f.cred_portaria_dt} orig="25/05/2012" highlight={hl} />, publicada no D.O.U. n.º <V val={f.cred_dou} orig="102" highlight={hl} /> de <V val={f.cred_dou_dt} orig="28/05/2012" highlight={hl} />, seção 1, p.23, recredenciado pela Portaria n.º <V val={f.recred_portaria} orig="1.219" highlight={hl} /> de <V val={f.recred_portaria_dt} orig="28/11/2019" highlight={hl} />, publicada no D.O.U. n.º <V val={f.recred_dou} orig="208" highlight={hl} />, seção 1, p.24. Reconhecido pela Portaria n.º <V val={f.reconhecimento_portaria} orig="357" highlight={hl} />, de <V val={f.reconhecimento_portaria_dt} orig="24/05/2018" highlight={hl} />, DOU n.º <V val={f.reconhecimento_dou} orig="100" highlight={hl} />, Seção 1, pág. 16, de <V val={f.reconhecimento_dou_dt} orig="25/05/2018" highlight={hl} />, tendo colado grau em <V val={f.colacao_grau} orig="" highlight={hl} />.
      </p>

      <p style={{ marginTop: 15, fontSize: "10pt" }}>{dateStr}</p>
      <Signature f={f} showLine={true} />
      <DocFooter f={f} profileKey={profileKey} />
    </div>
  );
}

// ==================== PAGE 3 ====================
export function Page3({ f, highlightModified, profileKey }: Props) {
  const hl = highlightModified;
  const meta = getMeta(profileKey);

  const formatMesAno = (val: string) => {
    if (!val) return "NÃO INFORMADO";
    const parts = val.split("/");
    if (parts.length === 2) return val; 
    if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
    return val;
  };

  const formatAno = (val: string) => {
    if (!val) return "NÃO INFORMADO";
    const match = val.match(/\d{4}/);
    return match ? match[0] : val;
  };

  const ingressoMesAno = formatMesAno(f.ingresso_mes_ano || meta.ingressoMesAno);
  const ingressoAno = formatAno(f.ingresso_ano || meta.ingressoAno);
  const processoEmec = f.processo_emec || "201605151";
  const instituicaoPolo = f.instituicao_polo || "CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER | POLO CURITIBA (CENTRO) - PR";
  const enderecoPolo = f.endereco || "Rua do Rosário, 147 | Centro - Curitiba/PR | CEP 80020-110";
  
  return (
    <div className="doc-page" id="doc-page-3" style={{ ...PAGE_STYLE, fontSize: "8.5pt", padding: "10mm 18mm" }}>
      <Logo />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12pt", margin: "5px 0 8px 0" }}>
        HISTÓRICO ESCOLAR
      </div>

      <Fieldset legend="IDENTIFICAÇÃO DO ALUNO">
        <p style={{ margin: "1.5px 0" }}><b>Nome:</b> <V val={f.nome} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>CPF:</b> <V val={f.cpf} orig="" highlight={hl} /> &nbsp;&nbsp; <b>RG:</b> <V val={f.rg} orig="" highlight={hl} /> - <V val={f.rg_orgao} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Data de Nascimento/UF:</b> <V val={f.data_nascimento} orig="" highlight={hl} /> / <V val={f.uf_nascimento} orig="" highlight={hl} /> &nbsp;&nbsp; <b>Nacionalidade:</b> <V val={f.nacionalidade} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Matrícula:</b> <V val={f.matricula} orig="" highlight={hl} /> &nbsp;&nbsp; <b>Situação de Matrícula:</b> <V val={f.situacao_matricula} orig="FORMADO" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="IDENTIFICAÇÃO DA INSTITUIÇÃO">
        <p style={{ margin: "1.5px 0" }}><b>Instituição:</b> <V val={instituicaoPolo} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Ato Autorizativo de Credenciamento:</b> Portaria n.º <V val={f.cred_portaria} orig="688" highlight={hl} /> de <V val={f.cred_portaria_dt} orig="25/05/2012" highlight={hl} /> DOU de 28/05/2012. Recredenciamento: Portaria n.º <V val={f.recred_portaria} orig="1.219" highlight={hl} /> de <V val={f.recred_portaria_dt} orig="28/11/2019" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Endereço:</b> <V val={enderecoPolo} orig="" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="IDENTIFICAÇÃO DO CURSO">
        <p style={{ margin: "1.5px 0" }}><b>Curso:</b> <V val={f.curso || meta.cursoCompleto} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Ato Autorizativo de Reconhecimento:</b> Portaria n.º <V val={f.reconhecimento_portaria} orig="357" highlight={hl} />, de <V val={f.reconhecimento_portaria_dt} orig="24/05/2018" highlight={hl} />, DOU de 25/05/2018</p>
        <p style={{ margin: "1.5px 0" }}><b>Número do Processo e-MEC*:</b> <V val={processoEmec} orig="201605151" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="FORMA DE INGRESSO">
        <p style={{ margin: "1.5px 0" }}><b>Processo Seletivo:</b> <V val={f.processo_seletivo} orig="VESTIBULAR" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Mês / Ano de Realização:</b> <V val={ingressoMesAno} orig="NÃO INFORMADO" highlight={hl} /> &nbsp;&nbsp; <b>Ano de Ingresso:</b> <V val={ingressoAno} orig="NÃO INFORMADO" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="DADOS DE CONCLUSÃO">
        <p style={{ margin: "1.5px 0" }}><b>Conclusão do Curso:</b> <V val={f.conclusao_curso} orig="" highlight={hl} /> &nbsp;&nbsp; <b>Colação de Grau:</b> <V val={f.colacao_grau} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Expedição do Diploma:</b> <V val={f.expedicao_diploma} orig="" highlight={hl} /> &nbsp;&nbsp; <b>Expedição do Histórico:</b> <V val={f.expedicao_historico} orig="" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="CRITÉRIOS DE AVALIAÇÃO" style={{ fontSize: "7.5pt" }}>
        <p style={{ margin: "0.5px 0" }}>Resultado Notas (0.0 a 10.0): APR.MÉDIA (7.0-10.0), APR.EXAME (5.0-10.0), APR.RECUP (5.0-10.0).</p>
        <p style={{ margin: "0.5px 0" }}>REP.MÉDIA (0.0-2.9), REP.EXAME (0.0-4.9), REP.RECUP (0.0-4.9). CONCLUÍDA: Atividades Pedagógicas.</p>
      </Fieldset>

      <Fieldset legend="ENADE" style={{ fontSize: "7.5pt" }}>
        <p style={{ margin: "1.5px 0" }}>Situação: Estudante REGULAR (Conforme Lei nº 10.861/2004).</p>
      </Fieldset>

      <Fieldset legend="OBSERVAÇÕES COMPLEMENTARES" style={{ fontSize: "7pt" }}>
        <p style={{ margin: "0.5px 0" }}>* Informação válida para cursos em processo de reconhecimento Art. 17 IX Portaria 1.095/2018.</p>
        <p style={{ margin: "0.5px 0" }}>Histórico emitido digitalmente (Ofício 38/CES/CNE/MEC e 387/2016). Validação: https://uninter-meudiploma.online</p>
      </Fieldset>
    </div>
  );
}

// ==================== PAGE 4 ====================
export function Page4() {
  return (
    <div className="doc-page" id="doc-page-4" style={{ ...PAGE_STYLE, padding: 0, height: "293.47mm", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
        <img src={UNINTER_SELO_B64} alt="Selo UNINTER" style={{ width: "120mm", height: "auto", display: "block" }} crossOrigin="anonymous" />
      </div>
    </div>
  );
}

// ==================== GRADE PAGE (DYNAMIC) ====================
export function GradePage({ f, highlightModified, profileKey, rows, isLast }: Props & { rows: GradeRow[]; isLast: boolean }) {
  const hl = highlightModified;
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="doc-page grade-page" style={{ ...PAGE_STYLE, fontSize: "8.5pt", paddingTop: "15mm", position: "relative" }}>
      {/* Header Inteligente de Exportação */}
      <div style={{ 
        position: "absolute", 
        top: "8mm", 
        left: "15mm", 
        fontSize: "7pt", 
        color: "#666", 
        fontWeight: "bold",
        display: "flex",
        gap: "10px",
        zIndex: 10
      }}>
        <span>{today}</span>
        <span>Documentos Digitais</span>
      </div>

      <Fieldset legend="IDENTIFICAÇÃO DO ALUNO">
        <p style={{ margin: "1.5px 0" }}><b>Nome:</b> <V val={f.nome} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>CPF:</b> <V val={f.cpf} orig="" highlight={hl} /> &nbsp;&nbsp; <b>RG:</b> <V val={f.rg} orig="" highlight={hl} /> - <V val={f.rg_orgao} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Data de Nascimento/UF:</b> <V val={f.data_nascimento} orig="" highlight={hl} /> / <V val={f.uf_nascimento} orig="" highlight={hl} /> &nbsp;&nbsp; <b>Nacionalidade:</b> <V val={f.nacionalidade} orig="" highlight={hl} /></p>
        <p style={{ margin: "1.5px 0" }}><b>Matrícula:</b> <V val={f.matricula} orig="" highlight={hl} /> &nbsp;&nbsp; <b>Situação de Matrícula:</b> <V val={f.situacao_matricula} orig="FORMADO" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="COMPONENTES CURRICULARES" style={{ paddingTop: 8, paddingBottom: 10, flex: 1, minHeight: "180mm", overflow: "visible" }}>
        <GradeGrid rows={rows} />
        
        {isLast && (
           <div style={{ marginTop: 12, fontSize: "8.5pt", lineHeight: 1.4 }}>
              <b>Carga Horária Total do Curso:</b> <V val={`${f.carga_horaria}h`} orig="0h" highlight={hl} />
              <br />
              <i style={{ fontSize: "7.5pt" }}>*Ano e mês de início da oferta da disciplina.</i>
           </div>
        )}
      </Fieldset>

      {isLast && (
        <div style={{ marginTop: "auto", paddingBottom: "5mm" }}>
          <Signature f={f} showLine={false} />
          <DocFooter f={f} profileKey={profileKey} />
        </div>
      )}
    </div>
  );
}

// ==================== MAIN DOCUMENT (SMART PAGINATION) ====================
export default function UninterDocument({ f, highlightModified, profileKey, gradeRows }: Props) {
  const key = resolveKey(profileKey);
  const allRows = gradeRows && gradeRows.length > 0 ? gradeRows : [];
  const showPage4 = key !== "pedagogia";

  const chunks: GradeRow[][] = [];
  let remaining = [...allRows];
  
  // Recalibrado para evitar quebras desnecessárias e garantir encaixe perfeito
  const MAX_ROWS_LAST = 32; 
  const MAX_ROWS_INT = 60;

  if (remaining.length === 0) {
    chunks.push([{ anoMes: "", disciplina: "Nenhuma disciplina informada", ch: "", media: "", resultado: "", docente: "", titulacao: "" }]);
  } else {
    while (remaining.length > 0) {
      if (remaining.length <= MAX_ROWS_LAST) {
        chunks.push(remaining.splice(0, remaining.length));
      } else if (remaining.length <= MAX_ROWS_INT) {
         // Se couber em uma página cheia mas não sobrar quase nada para a próxima, não divide no meio
         chunks.push(remaining.splice(0, remaining.length));
      } else {
        chunks.push(remaining.splice(0, MAX_ROWS_INT));
      }
    }
  }

  return (
    <div id="uninter-document-root" style={{ display: "flex", flexDirection: "column", gap: 0, width: "207.53mm" }}>
      <Page1 f={f} highlightModified={highlightModified} profileKey={profileKey} />
      <Page2 f={f} highlightModified={highlightModified} profileKey={profileKey} />
      <Page3 f={f} highlightModified={highlightModified} profileKey={profileKey} />
      {showPage4 && <Page4 />}
      {chunks.map((chunk, idx) => (
        <GradePage
          key={idx}
          f={f}
          highlightModified={highlightModified}
          profileKey={profileKey}
          rows={chunk}
          isLast={idx === chunks.length - 1}
        />
      ))}
    </div>
  );
}
