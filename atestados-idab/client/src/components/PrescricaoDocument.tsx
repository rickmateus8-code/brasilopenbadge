/**
 * PrescricaoDocument.tsx
 * Replicação 100% fiel ao PDF "Receituário Controle Especial" — dr.consulta
 * 2 páginas A4 idênticas (1ª via médico/paciente + 2ª via farmácia)
 *
 * Assinatura: Dr. ou Dra. (detecta gênero pelo prefixo do nome ou rt_nome)
 * Emitente: CENTRALIZADO conforme PDF original
 * Textos em negrito: Data, CENTRAL DE ATENDIMENTO, UNIDADE, Quantidade
 * QR Code: 10% maior (132px), espaçamento +10% antes de Comprador
 * Quantidade: por extenso (01 (um) caixa, 02 (duas) caixas)
 */

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { getQRCodeReceita } from "@/config.qrcode";

export interface PrescricaoItem {
  numero: number;
  uso_interno: boolean;
  medicamento: string;
  quantidade: string;
  modo_uso: string;
}

export interface Medicamento {
  uso_tipo: "interno" | "externo";
  nome: string;
  quantidade: string;
  posologia: string;
}

export interface PrescricaoData {
  tipo_receituario: "simples" | "controle_especial" | "antimicrobiano";
  logo_url?: string;
  nome_unidade: string;
  cnpj_emitente?: string;
  endereco_emitente?: string;
  telefone_emitente?: string;
  site_emitente?: string;
  paciente_nome: string;
  paciente_endereco?: string;
  paciente_identidade?: string;
  paciente_cpf?: string;
  paciente_nascimento?: string;
  paciente_telefone?: string;
  paciente_cidade?: string;
  medicamentos: Medicamento[];
  medico_nome: string;
  medico_crm: string;
  medico_uf: string;
  medico_especialidade?: string;
  medico_assinatura_url?: string;
  signature_color?: string;
  data_emissao: string;
  codigo_qr?: string;
  qr_code_url?: string;
  validade?: string;
}

// ─── Config por tipo ─────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  simples: { titulo: "Receituário", via1: "Via Única", via2: "Retenção\nFacultativa" },
  controle_especial: { titulo: "Receituário  Controle  Especial", via1: "1/2ª Via", via2: "Retenção na\nFarmácia ou\nDrogaria" },
  antimicrobiano: { titulo: "Receituário  Antimicrobiano", via1: "1/2ª Via", via2: "Retenção na\nFarmácia" },
};

// ─── Detectar Dr. ou Dra. ────────────────────────────────────────────────────
function getPrefixo(nome: string): string {
  const n = nome.trim().toUpperCase();
  if (n.startsWith("DRA.") || n.startsWith("DRA ")) return "Dra.";
  if (n.startsWith("DR.") || n.startsWith("DR ")) return "Dr.";
  const primeiro = n.replace(/^(DR\.?|DRA\.?)\s*/i, "").split(/\s+/)[0];
  const femininos = ["MARIA","ANA","JULIA","JULIANA","FERNANDA","AMANDA","PATRICIA","CAMILA","GABRIELA","MARIANA","DANIELA","CAROLINA","ISABELA","IZABELLA","LETICIA","SABRINA","TATIANA","VANESSA","LARISSA","JESSICA","MICHELE","MICHELLE","GRASIELE","LILLIAN","LIVIA","MILENA","JANAINA","ALESSANDRA","MARCIA","BEATRIZ","BIANCA","BRUNA","CARLA","CLAUDIA","CRISTINA","DEBORA","ELAINE","FABIANA","FLAVIA","HELENA","INGRID","JOANA","KARINA","LAURA","LUCIANA","MONICA","NATALIA","PAULA","PRISCILA","RAFAELA","RENATA","ROBERTA","SANDRA","SILVANA","SIMONE","SONIA","SUZANA","TANIA","THAIS","VIVIANE"];
  if (femininos.includes(primeiro)) return "Dra.";
  if (primeiro.endsWith("A") && !["LUCA","COSTA","BORBA","SOUZA","SILVA","ROSA","MOURA","VIEIRA","PEREIRA","OLIVEIRA","FERREIRA","ALMEIDA","ARAUJO","BARBOSA","BATISTA","FONSECA","FREITAS","LIMA","MOTA","NUNES","PINTO","RIBEIRA","ROCHA","TEIXEIRA"].includes(primeiro)) return "Dra.";
  return "Dr.";
}

function getNomeSemPrefixo(nome: string): string {
  return nome.trim().replace(/^(DRA?\.\s*|DRA?\s+)/i, "");
}

// ─── Número por extenso ─────────────────────────────────────────────────────
function numeroPorExtenso(n: number): string {
  const extenso: Record<number, string> = {
    1: "um", 2: "dois", 3: "três", 4: "quatro", 5: "cinco",
    6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez",
  };
  return extenso[n] || String(n);
}

function numeroPorExtensoFem(n: number): string {
  const extenso: Record<number, string> = {
    1: "uma", 2: "duas", 3: "três", 4: "quatro", 5: "cinco",
    6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez",
  };
  return extenso[n] || String(n);
}

/** Formata quantidade: "2" → "02 (duas) caixas" */
function formatarQuantidade(qtd: string): string {
  if (!qtd || !qtd.trim()) return "";
  // Se já está formatado (contém parênteses), retornar como está
  if (qtd.includes("(")) return qtd;
  // Tentar extrair número
  const match = qtd.match(/^(\d+)\s*(.*)/);
  if (!match) return qtd;
  const num = parseInt(match[1], 10);
  const resto = match[2].trim().toLowerCase();
  if (isNaN(num) || num <= 0) return qtd;
  // Determinar unidade
  let unidade = resto || "caixa";
  // Detectar se a unidade é feminina
  const femininas = ["caixa", "caixas", "cartela", "cartelas", "ampola", "ampolas", "bisnaga", "bisnagas", "seringa", "seringas", "unidade", "unidades"];
  const isFem = femininas.some(f => unidade.startsWith(f));
  const extenso = isFem ? numeroPorExtensoFem(num) : numeroPorExtenso(num);
  // Pluralizar unidade
  if (num > 1 && !unidade.endsWith("s")) {
    unidade = unidade + "s";
  }
  if (num === 1 && unidade.endsWith("s")) {
    unidade = unidade.slice(0, -1);
  }
  const numStr = String(num).padStart(2, "0");
  return `${numStr} (${extenso}) ${unidade}`;
}

// ─── Via (página A4) ─────────────────────────────────────────────────────────
function ViaPage({ data, viaNum }: { data: PrescricaoData; viaNum: 1 | 2 }) {
  const cfg = TIPO_CONFIG[data.tipo_receituario] || TIPO_CONFIG.controle_especial;
  const prefixo = getPrefixo(data.medico_nome);
  const nomeDisplay = getNomeSemPrefixo(data.medico_nome);
  const sigColor = data.signature_color || "#0b109f";

  // Extrair número do CRM para exibição
  const crmParts = data.medico_crm.match(/(\d+)/);
  const crmNumero = crmParts ? crmParts[1] : data.medico_crm;

  return (
    <div style={{
      width: 794, minHeight: 1123, backgroundColor: "#fff",
      fontFamily: "Arial, Helvetica, sans-serif", color: "#000",
      padding: "28px 36px 24px 36px", boxSizing: "border-box",
      display: "flex", flexDirection: "column", pageBreakAfter: "always",
    }}>

      {/* ── TÍTULO ──────────────────────────────────────────────────────────── */}
      <div style={{
        textAlign: "center", fontFamily: "Times New Roman, serif",
        fontSize: 26, fontWeight: 700, letterSpacing: 1, marginBottom: 14, color: "#000",
      }}>
        {cfg.titulo}
      </div>

      {/* ── CABEÇALHO: Box Emitente (esq) + Via/Data (dir) ─────────────────── */}
      <div style={{ display: "flex", marginBottom: 10, alignItems: "stretch" }}>

        {/* Box Emitente — ~65% — TUDO CENTRALIZADO */}
        <div style={{
          flex: "0 0 65%", border: "1px solid #000", boxSizing: "border-box", padding: "0 0 10px 0",
        }}>
          {/* Label */}
          <div style={{
            textAlign: "center", fontSize: 8.5, fontWeight: 400, color: "#000",
            padding: "5px 0 4px", letterSpacing: 0.3,
          }}>
            IDENTIFICAÇÃO DO EMITENTE
          </div>
          <div style={{ borderBottom: "1px solid #000", marginBottom: 8 }} />

          {/* Conteúdo — CENTRALIZADO */}
          <div style={{ padding: "0 12px", textAlign: "center" }}>
            {/* Logo */}
            {data.logo_url ? (
              <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}>
                <img src={data.logo_url} alt="Logo" style={{ maxHeight: 36, maxWidth: 180, objectFit: "contain" }} />
              </div>
            ) : (
              <div style={{
                fontSize: 20, fontWeight: 700, marginBottom: 4, lineHeight: 1, letterSpacing: -0.3,
              }}>
                <span style={{ color: "#1565c0" }}>dr.</span>
                <span style={{ color: "#29b6f6" }}>consulta</span>
              </div>
            )}

            {/* Nome da unidade — NEGRITO */}
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 2,
              textTransform: "uppercase", letterSpacing: 0.2,
            }}>
              {data.nome_unidade || "NOME DA UNIDADE"}
            </div>

            {/* CNPJ */}
            {data.cnpj_emitente && (
              <div style={{ fontSize: 9.5, color: "#000", marginBottom: 1 }}>
                CNPJ {data.cnpj_emitente}
              </div>
            )}

            {/* Endereço */}
            {data.endereco_emitente && (
              <div style={{ fontSize: 9.5, color: "#000", marginBottom: 5 }}>
                {data.endereco_emitente}
              </div>
            )}

            {/* Central de atendimento — NEGRITO */}
            {data.telefone_emitente && (
              <div style={{
                fontSize: 9.5, fontWeight: 700, color: "#000",
                textTransform: "uppercase", marginBottom: 1, letterSpacing: 0.2,
              }}>
                CENTRAL DE ATENDIMENTO: {data.telefone_emitente}
              </div>
            )}

            {/* Site — NEGRITO */}
            {data.site_emitente && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#000" }}>
                {data.site_emitente}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Via/Data — ~35% */}
        <div style={{
          flex: "0 0 35%", boxSizing: "border-box", padding: "8px 12px 12px 20px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 8.5, marginBottom: 1, color: "#000" }}>
              {cfg.via1}
            </div>
            <div style={{ fontSize: 8, lineHeight: 1.25, color: "#000" }}>
              {cfg.via2.split("\n").map((line, i) => {
                const isRetencao = line.trim().toLowerCase().startsWith("reten");
                return (
                  <div key={i} style={{ textDecoration: isRetencao ? "underline" : "none" }}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Data — NEGRITO */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>
            Data:{" "}
            {data.data_emissao
              ? (() => { const p = data.data_emissao.split("/"); return p.length === 3 ? `${p[0]}/${p[1]}/${p[2]}` : data.data_emissao; })()
              : "__/__/____"}
          </div>
        </div>
      </div>

      {/* ── BOX PACIENTE ────────────────────────────────────────────────────── */}
      <div style={{
        border: "1px solid #000", padding: "7px 12px", marginBottom: 14,
        lineHeight: 1.9, flexShrink: 0,
      }}>
        <div style={{ fontSize: 10.5, color: "#000" }}>
          <span style={{ fontWeight: 700 }}>Paciente:</span>{"   "}{data.paciente_nome || ""}
        </div>
        {data.paciente_endereco && (
          <div style={{ fontSize: 10.5, color: "#000" }}>
            <span style={{ fontWeight: 700 }}>Endereço:</span>{"   "}{data.paciente_endereco}
          </div>
        )}
      </div>

      {/* ── PRESCRIÇÃO ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        {(data.medicamentos || []).map((med, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 2, color: "#000" }}>
              {idx + 1}) Uso {med.uso_tipo === "interno" ? "Interno" : "Externo"}
            </div>
            <div style={{ fontSize: 10, color: "#000", marginBottom: 1 }}>{med.nome}</div>
            {/* Quantidade — NEGRITO */}
            <div style={{ fontSize: 10, color: "#000", marginBottom: 1 }}>
              <span style={{ fontWeight: 700 }}>Quantidade:</span>{" "}{formatarQuantidade(med.quantidade)}
            </div>
            <div style={{ fontSize: 10, color: "#000" }}>Uso:{"  "}{med.posologia}</div>
          </div>
        ))}
      </div>

      {/* ── Spacer ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── QR CODE + ASSINATURA ────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        marginBottom: 28, flexShrink: 0,
      }}>
        {/* QR Code — 132px (10% maior) */}
        <div style={{ flexShrink: 0 }}>
          {data.codigo_qr ? (
            /* QR Code real após emissão */
            <div style={{ lineHeight: 0 }}>
              <QRCodeSVG
                value={getQRCodeReceita(data.codigo_qr)}
                size={132}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          ) : (
            /* QR Code borrado antes da emissão */
            <div style={{ width: 132, height: 132, position: "relative", overflow: "hidden", lineHeight: 0 }}>
              <div style={{ filter: "blur(4px)", opacity: 0.5, lineHeight: 0 }}>
                <QRCodeSVG
                  value="https://verificamed.digital"
                  size={132}
                  level="H"
                  includeMargin={false}
                  fgColor="#1a1a1a"
                  bgColor="#FFFFFF"
                />
              </div>
            </div>
          )}
          {data.codigo_qr && (
            <div style={{ fontSize: 7, color: "#444", marginTop: 2, textAlign: "center", maxWidth: 132, fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: 0.5 }}>
              {data.codigo_qr}
            </div>
          )}
        </div>

        {/* Assinatura — estilo manuscrito/cursivo fiel ao PDF original */}
        <div style={{ textAlign: "right", minWidth: 260 }}>
          {data.medico_assinatura_url && (
            <img src={data.medico_assinatura_url} alt="Assinatura"
              style={{ maxHeight: 50, maxWidth: 220, objectFit: "contain", marginBottom: 4, display: "block", marginLeft: "auto" }} />
          )}

          {/* Nome cursivo inclinado — fiel ao PDF original */}
          <div style={{
            fontFamily: "'Segoe Script', 'Brush Script MT', 'Dancing Script', cursive",
            fontStyle: "italic",
            color: sigColor,
            fontSize: 14,
            lineHeight: 1.3,
            marginBottom: 6,
            transform: "rotate(-3deg)",
            transformOrigin: "right center",
          }}>
            <div>{prefixo} {nomeDisplay}</div>
            {data.medico_especialidade && (
              <div style={{ fontSize: 12 }}>{data.medico_especialidade}</div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              CRM-{data.medico_uf}: {crmNumero}
            </div>
          </div>

          {/* Linha de assinatura */}
          <div style={{ borderTop: "1px solid #555", width: "100%", marginTop: 2 }} />
        </div>
      </div>

      {/* ── RODAPÉ: Comprador + Farmacêutico ────────────────────────────────── */}
      <div style={{ display: "flex", flexShrink: 0 }}>
        {/* Identificação do Comprador */}
        <div style={{
          flex: "0 0 50%", border: "1px solid #000", boxSizing: "border-box", padding: "0 0 8px 0",
        }}>
          <div style={{
            textAlign: "center", fontSize: 8.5, fontWeight: 700, padding: "5px 0 4px", letterSpacing: 0.3,
          }}>
            IDENTIFICAÇÃO DO COMPRADOR
          </div>
          <div style={{ borderBottom: "1px solid #000", marginBottom: 6 }} />
          <div style={{ padding: "0 10px", fontSize: 10, lineHeight: 1.85 }}>
            <div>Nome completo: {data.paciente_nome || ""}</div>
            {data.paciente_identidade && <div>Ident. {data.paciente_identidade}</div>}
            {data.paciente_endereco && <div>End. completo: {data.paciente_endereco}</div>}
            {data.paciente_telefone && <div>Telefone: {data.paciente_telefone}</div>}
            {data.paciente_cidade && <div>Cidade: {data.paciente_cidade}</div>}
          </div>
        </div>

        {/* Assinatura do Farmacêutico */}
        <div style={{
          flex: "0 0 50%", border: "1px solid #000", borderLeft: "none",
          boxSizing: "border-box", padding: "14px 16px 12px",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }}>
          <div style={{ borderTop: "1px solid #000", marginBottom: 24 }} />
          <div style={{ borderTop: "1px solid #000", marginBottom: 24 }} />
          <div style={{ borderTop: "1px solid #000", marginBottom: 10 }} />
          <div style={{ fontSize: 9, textAlign: "center", marginBottom: 8, color: "#000" }}>
            Assinatura do Farmacêutico
          </div>
          <div style={{ fontSize: 9.5, textAlign: "center", color: "#000", fontWeight: 400 }}>
            Data{" "}
            <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 28 }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
            {" "}/{" "}
            <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 28 }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
            {" "}/{" "}
            <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 28 }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal — 2 páginas (2 vias) ─────────────────────────────
export default function PrescricaoDocument({ data }: { data: PrescricaoData }) {
  return (
    <div style={{ background: "#fff" }}>
      <ViaPage data={data} viaNum={1} />
      <ViaPage data={data} viaNum={2} />
    </div>
  );
}
