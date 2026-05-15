/**
 * DocumentPages — Histórico UNINTER Elite
 * Todas as classes CSS foram convertidas para estilos inline para garantir
 * que o layout funcione sem depender de CSS global no DocMaster.
 */
import {
  LOGO_URL, ASSINATURA_URL, SELO_URL,
  COURSE_METADATA, getGradesForProfile,
  type GradeRow, type ProfileKey,
} from "@/lib/documentData_uninter";
import React from "react";

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
  padding: "18mm 22mm 15mm 22mm",
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: "11pt",
  lineHeight: 1.35,
  color: "#000",
  position: "relative",
  boxSizing: "border-box",
  overflow: "visible",
};

const FIELDSET_STYLE: React.CSSProperties = {
  border: "1px solid #000",
  padding: "8px 10px",
  margin: "8px 0",
  position: "relative",
};

const LEGEND_STYLE: React.CSSProperties = {
  position: "absolute",
  top: -10,
  left: 10,
  background: "#fff",
  padding: "0 5px",
  fontWeight: "bold",
  fontSize: "10pt",
};

const TABLE_STYLE: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "8pt",
  marginTop: 4,
};

const TH_STYLE: React.CSSProperties = {
  textAlign: "left",
  fontWeight: "bold",
  borderBottom: "1px solid #000",
  padding: "2px 4px",
  fontSize: "8pt",
};

const TD_STYLE: React.CSSProperties = {
  padding: "2px 4px",
  borderBottom: "0.5px solid #ccc",
  verticalAlign: "top",
  fontSize: "8pt",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function V({ val, orig, highlight }: { val: string; orig: string; highlight?: boolean }) {
  const isModified = val !== orig;
  return (
    <span
      style={isModified && highlight
        ? { padding: "0 2px", borderBottom: "2px solid #e8a317", backgroundColor: "rgba(232,163,23,0.12)", borderRadius: 2 }
        : {}}
    >
      {val}
    </span>
  );
}

function GradeTable({ rows }: { rows: GradeRow[] }) {
  return (
    <table style={{ ...TABLE_STYLE, tableLayout: "fixed" }}>
      <thead>
        <tr style={{ height: "24pt" }}>
          <th style={{ ...TH_STYLE, width: "55px", verticalAlign: "bottom" }}>Ano/Mês*</th>
          <th style={{ ...TH_STYLE, verticalAlign: "bottom" }}>Disciplinas</th>
          <th style={{ ...TH_STYLE, width: "38px", textAlign: "center", verticalAlign: "bottom" }}>C.H.</th>
          <th style={{ ...TH_STYLE, width: "38px", textAlign: "center", verticalAlign: "bottom" }}>Média</th>
          <th style={{ ...TH_STYLE, width: "75px", textAlign: "center", verticalAlign: "bottom" }}>Resultado</th>
          <th style={{ ...TH_STYLE, width: "135px", textAlign: "center", verticalAlign: "bottom" }}>Docente</th>
          <th style={{ ...TH_STYLE, width: "85px", verticalAlign: "bottom" }}>Titulação</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ height: "15pt" }}>
            <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>{r.anoMes}</td>
            <td style={{ ...TD_STYLE, lineHeight: "1.1", wordBreak: "break-word", overflow: "hidden" }}>{r.disciplina}</td>
            <td style={{ ...TD_STYLE, textAlign: "center" }}>{r.ch}</td>
            <td style={{ ...TD_STYLE, textAlign: "center" }}>{r.media}</td>
            <td style={{ ...TD_STYLE, textAlign: "center" }}>{r.resultado}</td>
            <td style={{ ...TD_STYLE, textAlign: "center", fontSize: "7.5pt", whiteSpace: "nowrap", overflow: "hidden" }}>{r.docente}</td>
            <td style={{ ...TD_STYLE, fontSize: "7.5pt" }}>{r.titulacao}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function splitGradeRowsSmart(rows: GradeRow[]) {
  if (rows.length <= 22) {
    return { page5Rows: rows, page6Rows: [] as GradeRow[] };
  }
  const maxPage5 = 24;
  const minPage6 = 6;
  let page5Count = Math.min(maxPage5, rows.length - minPage6);
  if (page5Count < 15) page5Count = Math.min(15, rows.length);
  return {
    page5Rows: rows.slice(0, page5Count),
    page6Rows: rows.slice(page5Count),
  };
}

function parseHours(ch: string): number {
  const normalized = ch.replace(",", ".");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseMedia(media: string): number | null {
  const normalized = media.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

function computeGradeStats(rows: GradeRow[]) {
  let totalHours = 0;
  let weightedMediaSum = 0;
  let weightedHours = 0;
  for (const row of rows) {
    const hours = parseHours(row.ch);
    totalHours += hours;
    const media = parseMedia(row.media);
    if (media !== null && hours > 0) {
      weightedMediaSum += media * hours;
      weightedHours += hours;
    }
  }
  return {
    totalHours,
    weightedAverage: weightedHours > 0 ? weightedMediaSum / weightedHours : null,
  };
}

function resolveKey(profileKey?: ProfileKey): ProfileKey {
  return profileKey || "lindomar";
}

function getMeta(profileKey?: ProfileKey) {
  return COURSE_METADATA[resolveKey(profileKey)];
}

// ── Shared components ─────────────────────────────────────────────────────────
function DocFooter({ profileKey }: { profileKey?: ProfileKey }) {
  const meta = getMeta(profileKey);
  return (
    <>
      <div style={{ textAlign: "center", fontStyle: "italic", fontSize: "8.5pt", margin: "8px 0", lineHeight: 1.3 }}>
        O presente documento foi emitido digitalmente amparado pelo Ofício n.º 38/CES/CNE/MEC de 04/03/2011 e pelo Ofício n.º
        {" "}387/2016/CES/SAO/CNE/CNE-MEC.<br />
        A validação da veracidade é dada por meio do endereço eletrônico{" "}
        <span style={{ textDecoration: "none" }}>https://uninter-meudiploma.online</span>{" "}
        a partir dos dados contidos no rodapé deste documento.
      </div>
      <div style={{ textAlign: "center", fontSize: "8.5pt", margin: "6px 0", lineHeight: 1.3 }}>
        <b>{meta.unidadeLabel}</b> {meta.unidadeEndereco}<br />
        <b>Contatos:</b> 41 3593 2900 |{" "}
        <span style={{ textDecoration: "none" }}>secretariageral@uninter.com</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "6px 0" }}>
        <img src={SELO_URL} alt="Selo UNINTER" crossOrigin="anonymous" style={{ width: 80, height: "auto", display: "block" }} />
      </div>
      <div style={{ fontSize: "7pt", textAlign: "justify", marginTop: 4, lineHeight: 1.25, wordSpacing: "1px" }}>
        ESTE DOCUMENTO É EMITIDO EXCLUSIVAMENTE PELA SECRETARIA GERAL DE GESTÃO ACADÊMICA DO CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER.<br />
        Reproduções indevidas deste documento são consideradas crimes que se enquadram no Código Penal (Decreto Lei nº 2.848 de 07/12/1940) e sofrerão as penalidades previstas nos Art. 298, Art. 299, Art. 301, Art. 304 e Art 305 do Código Penal, passíveis de reclusão e multa.
      </div>
    </>
  );
}

function Signature({ showLine = true }: { showLine?: boolean }) {
  return (
    <div style={{ textAlign: "center", margin: "15px 0 10px 0" }}>
      {showLine && (
        <div style={{ borderTop: "1px solid #000", width: "100%", margin: "0 auto 12px auto" }} />
      )}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img src={ASSINATURA_URL} alt="Assinatura" crossOrigin="anonymous" style={{ width: 90, height: "auto", display: "block" }} />
      </div>
      <b style={{ fontSize: "10pt", letterSpacing: "0.3px", display: "block", marginTop: 2 }}>SIMONE RAMOS DE OLIVEIRA</b>
      <span style={{ fontSize: "9.5pt", display: "block", marginTop: 1 }}>Secretária Geral de Gestão Acadêmica</span>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
      <img src={LOGO_URL} alt="Logo UNINTER" crossOrigin="anonymous" style={{ width: 160, height: "auto", display: "block" }} />
    </div>
  );
}

// ── Fieldset helper ───────────────────────────────────────────────────────────
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
  const O = "LINDOMAR DE OLIVEIRA DUARTE";
  const meta = getMeta(profileKey);
  const dateStr = f.dateText || meta.dateText;
  const reconhecimento = f.reconhecimento || meta.reconhecimento;
  return (
    <div className="doc-page" id="doc-page-1" style={PAGE_STYLE}>
      <Logo />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13pt", lineHeight: 1.4, margin: "16px 0 14px 0" }}>
        INFORMATIVO SOBRE COLAÇÃO DE GRAU E EVENTO FESTIVO E<br />
        EMISSÃO DE DOCUMENTAÇÃO DE CONCLUSÃO DE CURSO
      </div>

      <p style={{ fontWeight: "bold", margin: "10px 0 4px 0", fontSize: "10pt" }}>COLAÇÃO DE GRAU:</p>
      <p style={{ textAlign: "justify", margin: "0 0 6px 0", lineHeight: 1.35, fontSize: "10pt" }}>
        Aos {f.colacao_grau} o <b>Centro Universitário Internacional UNINTER</b>, através da Secretaria Geral de Gestão Acadêmica, Simone Ramos de Oliveira, em nome do magnífico Reitor, Professor Dr. Benhur Etelberto Gaio, vem informar que o(a) aluno(a) <b><V val={f.nome} orig={O} highlight={hl} /></b>, CPF n.º <V val={f.cpf} orig="247.920.528-23" highlight={hl} />, matriculado(a) sob o registro acadêmico n.º <V val={f.matricula} orig="1022071" highlight={hl} />, Colou Grau no <b>{meta.cursoCompleto}</b>, nível de Graduação, por ter cumprido todas as exigências curriculares do curso.
      </p>

      <p style={{ fontWeight: "bold", margin: "10px 0 4px 0", fontSize: "10pt" }}>EVENTO FESTIVO DE COLAÇÃO DE GRAU:</p>
      <p style={{ textAlign: "justify", margin: "0 0 5px 0", lineHeight: 1.35, fontSize: "10pt" }}>
        O <b>Centro Universitário Internacional UNINTER</b> fornece gratuitamente a transmissão do cerimonial de Colação de Grau via vídeo, no mesmo formato das aulas, o qual é transmitido no Polo de Apoio de Presencial em datas específicas. O(a) aluno(a) que tenha interesse de participar deste evento de Colação de Grau deverá entrar em contato com o Polo de Apoio Presencial no qual está matriculado(a), e verificar as datas.
      </p>
      <p style={{ textAlign: "justify", margin: "5px 0 0 0", lineHeight: 1.35, fontSize: "10pt" }}>
        O <b>Centro Universitário Internacional UNINTER</b> não financia gastos decorrentes dos eventos de festividades de Formatura realizada no Polo de Apoio Presencial ou pela turma em locais particulares, como por exemplo: espaço físico locado, decoração, becas, capelos, canudos, convites, transportes, etc., cabendo os custos e a organização do evento aos contratantes dos serviços.
      </p>

      <p style={{ fontWeight: "bold", margin: "10px 0 4px 0", fontSize: "10pt" }}>DOCUMENTOS DE CONCLUSÃO:</p>
      <p style={{ textAlign: "justify", margin: "0 0 0 0", lineHeight: 1.35, fontSize: "10pt" }}>
        A Secretaria Geral de Gestão Acadêmica disponibiliza gratuitamente os seguintes documentos:<br />
        -1ª via do <b>CERTIFICADO DE CONCLUSÃO DE CURSO</b> e <b>HISTÓRICO ESCOLAR</b> emitidos digitalmente disponíveis para visualização e impressão via Portal do Aluno e em anexo a este documento.<br />
        -1ª via do <b>DIPLOMA</b>, o qual será emitido e enviado ao Polo de Apoio Presencial no qual está matriculado(a) no prazo de até 120 dias a contar da data da Colação de Grau. O processo de emissão do <b>DIPLOMA</b> pode ser acompanhado através do Portal do Aluno em <i>Serviços e Taxas</i>.
      </p>

      <p style={{ marginTop: 12, fontSize: "10pt" }}>{dateStr}</p>
      <Signature showLine={true} />
      <DocFooter profileKey={profileKey} />
    </div>
  );
}

// ==================== PAGE 2 ====================
export function Page2({ f, highlightModified, profileKey }: Props) {
  const hl = highlightModified;
  const meta = getMeta(profileKey);
  const dateStr = f.dateText || meta.dateText;
  const reconhecimento = f.reconhecimento || meta.reconhecimento;
  return (
    <div className="doc-page" id="doc-page-2" style={PAGE_STYLE}>
      <Logo />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13pt", margin: "20px 0 18px 0", textDecoration: "underline" }}>
        CERTIFICADO DE CONCLUSÃO DE CURSO
      </div>

      <p style={{ textAlign: "justify", marginTop: 10, lineHeight: 1.4, fontSize: "10pt" }}>
        Certificamos que <b><V val={f.nome} orig="LINDOMAR DE OLIVEIRA DUARTE" highlight={hl} /></b>, CPF n.º <V val={f.cpf} orig="247.920.528-23" highlight={hl} />, matriculado(a) sob o registro acadêmico n.º <V val={f.matricula} orig="1022071" highlight={hl} />, concluiu o <b>{meta.cursoCompleto}</b>, nível de Graduação, com carga horária total de <V val={`${f.carga_horaria}h`} orig="2870h" highlight={hl} />, ministrado pelo <b>CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER</b>, mantido pela <b>UNINTER EDUCACIONAL S.A.</b>, credenciado pela Portaria n.º 688 de 25/05/2012, publicada no D.O.U. n.º 102 de 28/05/2012, seção 1, p.23, recredenciado pela Portaria n.º 1.219 de 28/11/2019, publicada no D.O.U. n.º 208, seção 1, p.24. <V val={reconhecimento} orig={meta.reconhecimento} highlight={hl} />, tendo colado grau em <V val={f.colacao_grau} orig="08/07/2019" highlight={hl} />.
      </p>

      <p style={{ marginTop: 20, fontSize: "10pt" }}>{dateStr}</p>
      <Signature showLine={true} />
      <DocFooter profileKey={profileKey} />
    </div>
  );
}

// ==================== PAGE 3 ====================
export function Page3({ f, highlightModified, profileKey }: Props) {
  const hl = highlightModified;
  const meta = getMeta(profileKey);
  const ingressoMesAno = f.ingresso_mes_ano || meta.ingressoMesAno;
  const ingressoAno = f.ingresso_ano || meta.ingressoAno;
  const processoEmec = f.processo_emec || "201605151";
  const reconhecimento = f.reconhecimento || meta.reconhecimento;
  return (
    <div className="doc-page" id="doc-page-3" style={{ ...PAGE_STYLE, fontSize: "9pt" }}>
      <Logo />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13pt", margin: "10px 0 10px 0" }}>
        HISTÓRICO ESCOLAR
      </div>

      <Fieldset legend="IDENTIFICAÇÃO DO ALUNO">
        <p style={{ margin: "2px 0" }}><b>Nome:</b> <V val={f.nome} orig="LINDOMAR DE OLIVEIRA DUARTE" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>CPF:</b> <V val={f.cpf} orig="247.920.528-23" highlight={hl} /> &nbsp;&nbsp; <b>RG:</b> <V val={f.rg} orig="27.204.902-5" highlight={hl} /> - <V val={f.rg_orgao} orig="SSP/SP" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>Data de Nascimento/UF:</b> <V val={f.data_nascimento} orig="12/09/1976" highlight={hl} /> / <V val={f.uf_nascimento} orig="PR" highlight={hl} /> &nbsp;&nbsp; <b>Nacionalidade:</b> <V val={f.nacionalidade} orig="BRASILEIRA" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>Matrícula:</b> <V val={f.matricula} orig="1022071" highlight={hl} /> &nbsp;&nbsp; <b>Situação de Matrícula:</b> <V val={f.situacao_matricula} orig="FORMADO" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="IDENTIFICAÇÃO DA INSTITUIÇÃO">
        <p style={{ margin: "2px 0" }}><b>Instituição:</b> CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER | POLO TIRADENTES (CENTRO) - PR</p>
        <p style={{ margin: "2px 0" }}><b>Ato Autorizativo de Credenciamento e Recredenciamento:</b> Portaria n.º 688 de 25/05/2012 publicada no D.O.U. n.º 102 de 28/05/2012, seção 1, p.23. Recredenciado pela Portaria n.º 1.219 de 28/11/2019 publicada no D.O.U. n.º 208, seção 1, p.24</p>
        <p style={{ margin: "2px 0" }}><b>Endereço:</b> <V val={f.endereco} orig="Rua do Rosário, 147 | Centro - Curitiba/PR | CEP 80020-110" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="IDENTIFICAÇÃO DO CURSO">
        <p style={{ margin: "2px 0" }}><b>Curso:</b> {meta.cursoCompleto}</p>
        <p style={{ margin: "2px 0" }}><b>Ato Autorizativo de Reconhecimento:</b> <V val={reconhecimento} orig={meta.reconhecimento} highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>Número do Processo e-MEC*:</b> <V val={processoEmec} orig="201605151" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="FORMA DE INGRESSO">
        <p style={{ margin: "2px 0" }}><b>Processo Seletivo:</b> VESTIBULAR</p>
        <p style={{ margin: "2px 0" }}><b>Mês / Ano de Realização:</b> <V val={ingressoMesAno} orig={meta.ingressoMesAno} highlight={hl} /> &nbsp;&nbsp; <b>Ano de Ingresso:</b> <V val={ingressoAno} orig={meta.ingressoAno} highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="DADOS DE CONCLUSÃO">
        <p style={{ margin: "2px 0" }}><b>Conclusão do Curso:</b> <V val={f.conclusao_curso} orig="08/07/2019" highlight={hl} /> &nbsp;&nbsp; <b>Colação de Grau:</b> <V val={f.colacao_grau} orig="08/07/2019" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>Expedição do Diploma:</b> <V val={f.expedicao_diploma} orig="08/07/2019" highlight={hl} /> &nbsp;&nbsp; <b>Expedição do Histórico de Conclusão:</b> <V val={f.expedicao_historico} orig="08/07/2019" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="CRITÉRIOS DE AVALIAÇÃO">
        <p style={{ margin: "1px 0" }}>O resultado do processo de avaliação adotado é expresso sob forma de notas (de 0.0 a 10.0), a saber:</p>
        <p style={{ margin: "1px 0" }}>APR.MÉDIA: para resultado de notas de 7.0 (sete) a 10.0 (dez) na primeira fase de avaliação.</p>
        <p style={{ margin: "1px 0" }}>APR.EXAME: para resultado de notas de 5.0 (cinco) a 10.0 (dez) na segunda fase de avaliação.</p>
        <p style={{ margin: "1px 0" }}>APR.RECUP: para resultado de notas de 5.0 (cinco) a 10.0 (dez) na terceira fase de avaliação.</p>
        <p style={{ margin: "1px 0" }}>REP.MÉDIA: para resultado de notas de 0.0 (zero) a 2.9 (dois e nove décimos) na primeira fase de avaliação.</p>
        <p style={{ margin: "1px 0" }}>REP.EXAME: para resultado de notas de 0.0 (zero) a 4.9 (quatro e nove décimos) na segunda fase de avaliação.</p>
        <p style={{ margin: "1px 0" }}>REP.RECUP: para resultado de notas de 0.0 (zero) a 4.9 (quatro e nove décimos) na terceira fase de avaliação.</p>
        <p style={{ margin: "1px 0" }}>CONCLUÍDA: cumprimento de carga horária através de atividades pedagógicas.</p>
        <p style={{ margin: "1px 0" }}>Estágio Supervisionado: aprovado para nota final igual ou superior a 5.0 (cinco).</p>
      </Fieldset>

      <Fieldset legend="ENADE">
        <p style={{ margin: "2px 0" }}>O Exame Nacional de Desempenho dos Estudantes é componente obrigatório dos cursos de graduação, conforme Lei nº 10.861, de 14 de abril de 2004, Art. 5º § 5º.</p>
        <p style={{ margin: "2px 0" }}><b>Situação do ENADE:</b> Estudante REGULAR</p>
      </Fieldset>

      <Fieldset legend="OBSERVAÇÕES COMPLEMENTARES">
        <p style={{ margin: "1px 0" }}>* Informação válida para cursos em processo de reconhecimento ou renovação de reconhecimento de acordo com o Art. 17 IX da Portaria n.º 1.095/2018.</p>
        <p style={{ margin: "1px 0" }}>Histórico Escolar emitido digitalmente amparado pelo Ofício n.º 38/CES/CNE/MEC de 04/03/2011 e pelo Ofício n.º 387/2016/CES/SAO/CNE/CNE-MEC.</p>
        <p style={{ margin: "1px 0" }}>A validação da veracidade é dada por meio do endereço eletrônico <span style={{ textDecoration: "none" }}>https://uninter-meudiploma.online</span> a partir dos dados contidos no rodapé deste documento.</p>
      </Fieldset>
    </div>
  );
}

// ==================== PAGE 4 ====================
export function Page4() {
  return (
    <div className="doc-page" id="doc-page-4" style={{ ...PAGE_STYLE, padding: 0, height: "293.47mm", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
        <img
          src={SELO_URL}
          alt="Selo UNINTER"
          crossOrigin="anonymous"
          style={{ width: "120mm", height: "auto", display: "block" }}
        />
      </div>
    </div>
  );
}

// ==================== PAGE 5 ====================
export function Page5({ f, highlightModified, profileKey, gradeRows }: Props) {
  const hl = highlightModified;
  const key = resolveKey(profileKey);
  const fallback = (() => {
    const { page5, page6 } = getGradesForProfile(key);
    return [...page5, ...page6];
  })();
  const rows = splitGradeRowsSmart(gradeRows && gradeRows.length > 0 ? gradeRows : fallback).page5Rows;
  return (
    <div className="doc-page" id="doc-page-5" style={{ ...PAGE_STYLE, fontSize: "8.5pt", paddingTop: "15mm" }}>
      <Fieldset legend="IDENTIFICAÇÃO DO ALUNO">
        <p style={{ margin: "2px 0" }}><b>Nome:</b> <V val={f.nome} orig="LINDOMAR DE OLIVEIRA DUARTE" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>CPF:</b> <V val={f.cpf} orig="247.920.528-23" highlight={hl} /> &nbsp;&nbsp; <b>RG:</b> <V val={f.rg} orig="27.204.902-5" highlight={hl} /> - <V val={f.rg_orgao} orig="SSP/SP" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>Data de Nascimento/UF:</b> <V val={f.data_nascimento} orig="12/09/1976" highlight={hl} /> / <V val={f.uf_nascimento} orig="PR" highlight={hl} /> &nbsp;&nbsp; <b>Nacionalidade:</b> <V val={f.nacionalidade} orig="BRASILEIRA" highlight={hl} /></p>
        <p style={{ margin: "2px 0" }}><b>Matrícula:</b> <V val={f.matricula} orig="1022071" highlight={hl} /> &nbsp;&nbsp; <b>Situação de Matrícula:</b> <V val={f.situacao_matricula} orig="FORMADO" highlight={hl} /></p>
      </Fieldset>

      <Fieldset legend="COMPONENTES CURRICULARES" style={{ paddingTop: 10, paddingBottom: 15 }}>
        <GradeTable rows={rows} />
      </Fieldset>
    </div>
  );
}

// ==================== PAGE 6 ====================
export function Page6({ f, highlightModified, profileKey, gradeRows }: Props) {
  const hl = highlightModified;
  const key = resolveKey(profileKey);
  const meta = getMeta(profileKey);
  const dateStr = f.dateText || meta.dateText;
  const defaultRows = (() => {
    const { page5, page6 } = getGradesForProfile(key);
    return [...page5, ...page6];
  })();
  const rows = gradeRows && gradeRows.length > 0 ? gradeRows : defaultRows;
  const { page6Rows } = splitGradeRowsSmart(rows);
  const stats = computeGradeStats(rows);
  const isEngenharia = key === "engenharia_controle_automacao";
  const cargaHorariaValor = isEngenharia ? `${stats.totalHours}h` : `${f.carga_horaria}h`;
  const mediaGeral = stats.weightedAverage !== null ? stats.weightedAverage.toFixed(2).replace(".", ",") : "-";
  return (
    <div className="doc-page" id="doc-page-6" style={{ ...PAGE_STYLE, fontSize: "8.5pt", paddingTop: "12mm" }}>
      <div style={{ ...FIELDSET_STYLE, borderTop: "none", paddingTop: 5, position: "relative", paddingBottom: 20 }}>
        <GradeTable rows={page6Rows} />
        <div style={{ marginTop: 15, fontSize: "9pt", lineHeight: 1.3 }}>
          <b>Carga Horária Cursada:</b> <V val={cargaHorariaValor} orig="2870h" highlight={hl} /> &nbsp;&nbsp;&nbsp;
          <b>Carga Horária Total do Curso:</b> <V val={cargaHorariaValor} orig="2870h" highlight={hl} />
          {isEngenharia && (
            <>
              <br />
              <b>Média Geral (ponderada pela C.H.):</b> {mediaGeral}
            </>
          )}
          <br />
          <i>*Ano e mês de início da oferta da disciplina.</i>
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: "10pt" }}>{dateStr}</p>
      <Signature showLine={false} />

      <div style={{ textAlign: "center", fontSize: "8.5pt", margin: "6px 0", lineHeight: 1.3 }}>
        <b>{meta.unidadeLabel}</b> {meta.unidadeEndereco}<br />
        <b>Contatos:</b> 41 3593 2900 |{" "}
        <span style={{ textDecoration: "none" }}>secretariageral@uninter.com</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "6px 0" }}>
        <img src={SELO_URL} alt="Selo UNINTER" crossOrigin="anonymous" style={{ width: 80, height: "auto", display: "block" }} />
      </div>

      <div style={{ fontSize: "7pt", textAlign: "justify", marginTop: 4, lineHeight: 1.25, wordSpacing: "1px" }}>
        ESTE DOCUMENTO É EMITIDO EXCLUSIVAMENTE PELA SECRETARIA GERAL DE GESTÃO ACADÊMICA DO CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER.<br />
        Reproduções indevidas deste documento são consideradas crimes que se enquadram no Código Penal (Decreto Lei nº 2.848 de 07/12/1940) e sofrerão as penalidades previstas nos Art. 298, Art. 299, Art. 301, Art. 304 e Art 305 do Código Penal, passíveis de reclusão e multa.
      </div>

      <div style={{ marginTop: 8, fontSize: "8.5pt", lineHeight: 1.3, textAlign: "justify", wordSpacing: "1px" }}>
        Informamos que a validação da veracidade da emissão deste documento pode ser realizada através do site:<br />
        <a href="https://uninter-meudiploma.online" style={{ color: "#000", textDecoration: "none" }}>https://uninter-meudiploma.online</a><br />
        Documento emitido às 15:01:39 do dia {f.expedicao_historico}.<br />
        Código de Validação / Controle do documento: {meta.codigoValidacao}
      </div>
    </div>
  );
}
