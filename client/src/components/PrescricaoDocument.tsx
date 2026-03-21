/**
 * PrescricaoDocument.tsx
 * Replicação 100% fiel ao PDF "Receituário Controle Especial" — dr.consulta
 * 2 páginas A4 idênticas (1ª via médico/paciente + 2ª via farmácia)
 */

import React from "react";

export interface Medicamento {
  uso_tipo: "interno" | "externo";
  nome: string;
  quantidade: string;
  posologia: string;
}

export interface PrescricaoData {
  // Tipo de receituário
  tipo_receituario: "simples" | "controle_especial" | "antimicrobiano";

  // Emitente
  logo_url?: string;
  nome_unidade: string;
  cnpj_emitente?: string;
  endereco_emitente?: string;
  telefone_emitente?: string;
  site_emitente?: string;

  // Paciente
  paciente_nome: string;
  paciente_endereco?: string;
  paciente_identidade?: string;
  paciente_cpf?: string;
  paciente_nascimento?: string;
  paciente_telefone?: string;
  paciente_cidade?: string;

  // Prescrição
  medicamentos: Medicamento[];

  // Médico
  medico_nome: string;
  medico_crm: string;
  medico_uf: string;
  medico_especialidade?: string;
  medico_assinatura_url?: string;

  // Emissão
  data_emissao: string;
  codigo_qr?: string;
  qr_code_url?: string;

  // Validade
  validade?: string;
}

// ─── Configuração por tipo de receituário ────────────────────────────────────
const TIPO_CONFIG = {
  simples: {
    titulo: "Receituário",
    tarja: null,
    via1: "Via Única",
    via2: "Retenção\nFacultativa",
  },
  controle_especial: {
    titulo: "Receituário  Controle  Especial",
    tarja: null,
    via1: "1/2ª Via",
    via2: "Retenção na\nFarmácia ou\nDrogaria",
  },
  antimicrobiano: {
    titulo: "Receituário  Antimicrobiano",
    tarja: null,
    via1: "1/2ª Via",
    via2: "Retenção na\nFarmácia",
  },
};

// ─── Componente de uma via (página A4 completa) ───────────────────────────────
function ViaPage({ data, viaNum }: { data: PrescricaoData; viaNum: 1 | 2 }) {
  const cfg = TIPO_CONFIG[data.tipo_receituario] || TIPO_CONFIG.controle_especial;

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#000",
        padding: "28px 36px 24px 36px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        pageBreakAfter: "always",
      }}
    >
      {/* ── TÍTULO ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "Times New Roman, serif",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 1,
          marginBottom: 14,
          color: "#000",
        }}
      >
        {cfg.titulo}
      </div>

      {/* ── CABEÇALHO: Box Emitente (esq) + Coluna Via/Data (dir) ─────────── */}
      <div style={{ display: "flex", marginBottom: 10, alignItems: "stretch" }}>

        {/* Box Emitente — ~65% */}
        <div
          style={{
            flex: "0 0 65%",
            border: "1px solid #000",
            boxSizing: "border-box",
            padding: "0 0 10px 0",
          }}
        >
          {/* Label IDENTIFICAÇÃO DO EMITENTE */}
          <div
            style={{
              textAlign: "center",
              fontSize: 8.5,
              fontWeight: 400,
              color: "#000",
              padding: "5px 0 4px",
              letterSpacing: 0.3,
            }}
          >
            IDENTIFICAÇÃO DO EMITENTE
          </div>
          {/* Linha separadora */}
          <div style={{ borderBottom: "1px solid #000", marginBottom: 8 }} />

          {/* Conteúdo do emitente */}
          <div style={{ padding: "0 12px" }}>
            {/* Logo */}
            {data.logo_url ? (
              <div style={{ marginBottom: 6 }}>
                <img
                  src={data.logo_url}
                  alt="Logo"
                  style={{ maxHeight: 36, maxWidth: 180, objectFit: "contain" }}
                />
              </div>
            ) : (
              /* Logo dr.consulta padrão em texto — tamanho fiel ao original */
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 4,
                  lineHeight: 1,
                  letterSpacing: -0.3,
                }}
              >
                <span style={{ color: "#1565c0" }}>dr.</span>
                <span style={{ color: "#29b6f6" }}>consulta</span>
              </div>
            )}

            {/* Nome da unidade */}
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#000",
                marginBottom: 2,
                textTransform: "uppercase",
                letterSpacing: 0.2,
              }}
            >
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

            {/* Central de atendimento */}
            {data.telefone_emitente && (
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "#000",
                  textTransform: "uppercase",
                  marginBottom: 1,
                  letterSpacing: 0.2,
                }}
              >
                CENTRAL DE ATENDIMENTO: {data.telefone_emitente}
              </div>
            )}

            {/* Site */}
            {data.site_emitente && (
              <div style={{ fontSize: 9.5, color: "#000" }}>
                {data.site_emitente}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Via/Data — ~35%, sem borda */}
        <div
          style={{
            flex: "0 0 35%",
            boxSizing: "border-box",
            padding: "8px 12px 12px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignSelf: "stretch",
          }}
        >
          {/* Via — topo */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 8.5,
                marginBottom: 1,
                color: "#000",
              }}
            >
              {cfg.via1}
            </div>
            {/* Retenção — sublinhado SOMENTE na palavra Retenção, demais linhas normais */}
            <div style={{ fontSize: 8, lineHeight: 1.25, color: "#000" }}>
              {cfg.via2.split("\n").map((line, i) => {
                // Sublinha apenas a palavra/linha que começa com "Retenção"
                const isRetencao = line.trim().startsWith("Reten");
                return (
                  <div key={i} style={{ textDecoration: isRetencao ? "underline" : "none", marginBottom: 0 }}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data — base */}
          <div style={{ fontSize: 13, fontWeight: 400, color: "#000" }}>
            Data:{" "}
            {data.data_emissao
              ? (() => {
                  const p = data.data_emissao.split("/");
                  return p.length === 3
                    ? `${p[0]}/${p[1]}/${p[2]}`
                    : data.data_emissao;
                })()
              : "__/__/____"}
          </div>
        </div>
      </div>

      {/* ── BOX PACIENTE ───────────────────────────────────────────────────── */}
      <div
        style={{
          border: "1px solid #000",
          padding: "7px 12px",
          marginBottom: 14,
          lineHeight: 1.9,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 10.5, color: "#000" }}>
          <span style={{ fontWeight: 700 }}>Paciente:</span>
          {"   "}
          {data.paciente_nome || ""}
        </div>
        {data.paciente_endereco && (
          <div style={{ fontSize: 10.5, color: "#000" }}>
            <span style={{ fontWeight: 700 }}>Endereço:</span>
            {"   "}
            {data.paciente_endereco}
          </div>
        )}
      </div>

      {/* ── PRESCRIÇÃO ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        {(data.medicamentos || []).map((med, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                marginBottom: 2,
                color: "#000",
              }}
            >
              {idx + 1}) Uso {med.uso_tipo === "interno" ? "Interno" : "Externo"}
            </div>
            <div style={{ fontSize: 10, color: "#000", marginBottom: 1 }}>
              {med.nome}
            </div>
            <div style={{ fontSize: 10, color: "#000", marginBottom: 1 }}>
              Quantidade: {med.quantidade}
            </div>
            <div style={{ fontSize: 10, color: "#000" }}>
              Uso:{"  "}
              {med.posologia}
            </div>
          </div>
        ))}
      </div>

      {/* ── ÁREA CENTRAL (flex grow para empurrar rodapé para baixo) ─────── */}
      <div style={{ flex: 1 }} />

      {/* ── QR CODE + ASSINATURA ───────────────────────────────────────────── */}
      {/*
        Layout fiel à imagem:
        - QR Code grande (120×120) no canto SUPERIOR esquerdo
        - Assinatura itálica cinza claro à direita (nome, especialidade, CRM)
        - Linha de assinatura abaixo do texto itálico
        - Espaço vazio entre QR e boxes do rodapé
      */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        {/* QR Code — canto superior esquerdo
             - Antes da emissão (sem qr_code_url): placeholder borrado/desfocado
             - Após emissão: QR Code real nítido
        */}
        <div style={{ flexShrink: 0 }}>
          {data.qr_code_url ? (
            /* QR Code real — exibido após emissão */
            <img
              src={data.qr_code_url}
              alt="QR Code"
              style={{ width: 120, height: 120, display: "block" }}
            />
          ) : (
            /* Placeholder borrado — preview antes da emissão */
            <div
              style={{
                width: 120,
                height: 120,
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* Grade de quadrados simulando QR borrado */}
              <svg
                width={120}
                height={120}
                viewBox="0 0 120 120"
                style={{
                  display: "block",
                  filter: "blur(3px)",
                  opacity: 0.35,
                }}
              >
                {/* Padrão de quadrados aleatórios simulando QR */}
                {Array.from({ length: 12 }).map((_, row) =>
                  Array.from({ length: 12 }).map((_, col) => {
                    const filled = (row + col + row * col) % 3 !== 0;
                    return filled ? (
                      <rect
                        key={`${row}-${col}`}
                        x={col * 10}
                        y={row * 10}
                        width={9}
                        height={9}
                        fill="#000"
                      />
                    ) : null;
                  })
                )}
                {/* Marcadores de canto (finder patterns) */}
                <rect x={0} y={0} width={30} height={30} fill="none" stroke="#000" strokeWidth={3} />
                <rect x={5} y={5} width={20} height={20} fill="#000" />
                <rect x={90} y={0} width={30} height={30} fill="none" stroke="#000" strokeWidth={3} />
                <rect x={95} y={5} width={20} height={20} fill="#000" />
                <rect x={0} y={90} width={30} height={30} fill="none" stroke="#000" strokeWidth={3} />
                <rect x={5} y={95} width={20} height={20} fill="#000" />
              </svg>
              {/* Overlay com texto */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  color: "#555",
                  textAlign: "center",
                  lineHeight: 1.3,
                  background: "rgba(255,255,255,0.55)",
                }}
              >
                QR após<br />emissão
              </div>
            </div>
          )}
          {data.codigo_qr && (
            <div style={{ fontSize: 7, color: "#888", marginTop: 2, textAlign: "center", maxWidth: 120 }}>
              {data.codigo_qr}
            </div>
          )}
        </div>

        {/* Assinatura — canto superior direito, itálico cinza claro */}
        <div style={{ textAlign: "right", minWidth: 240 }}>
          {data.medico_assinatura_url && (
            <img
              src={data.medico_assinatura_url}
              alt="Assinatura"
              style={{ maxHeight: 44, maxWidth: 200, objectFit: "contain", marginBottom: 4, display: "block", marginLeft: "auto" }}
            />
          )}
          {/* Nome, especialidade e CRM — itálico, cinza claro, alinhado à direita */}
          <div
            style={{
              fontStyle: "italic",
              color: "#aaa",
              fontSize: 10.5,
              lineHeight: 1.55,
              marginBottom: 6,
            }}
          >
            <div style={{ fontSize: 10 }}>{data.medico_nome}</div>
            {data.medico_especialidade && (
              <div style={{ fontSize: 10 }}>{data.medico_especialidade}</div>
            )}
            <div style={{ fontSize: 10, fontWeight: 700 }}>
              CRM-{data.medico_uf}: {data.medico_crm}
            </div>
          </div>
          {/* Linha de assinatura */}
          <div style={{ borderTop: "1px solid #555", width: "100%", marginTop: 2 }} />
        </div>
      </div>

      {/* ── RODAPÉ: Box Comprador + Box Farmacêutico ───────────────────────── */}
      <div style={{ display: "flex", flexShrink: 0 }}>

        {/* Box Identificação do Comprador — 50% */}
        <div
          style={{
            flex: "0 0 50%",
            border: "1px solid #000",
            boxSizing: "border-box",
            padding: "0 0 8px 0",
          }}
        >
          {/* Label */}
          <div
            style={{
              textAlign: "center",
              fontSize: 8.5,
              fontWeight: 700,
              padding: "5px 0 4px",
              letterSpacing: 0.3,
            }}
          >
            IDENTIFICAÇÃO DO COMPRADOR
          </div>
          <div style={{ borderBottom: "1px solid #000", marginBottom: 6 }} />

          <div style={{ padding: "0 10px", fontSize: 10, lineHeight: 1.85 }}>
            <div>
              Nome completo:{" "}
              {data.paciente_nome || ""}
            </div>
            {data.paciente_identidade && (
              <div>Ident. {data.paciente_identidade}</div>
            )}
            {data.paciente_endereco && (
              <div>End. completo: {data.paciente_endereco}</div>
            )}
            {data.paciente_telefone && (
              <div>Telefone: {data.paciente_telefone}</div>
            )}
            {data.paciente_cidade && (
              <div>Cidade: {data.paciente_cidade}</div>
            )}
          </div>
        </div>

        {/* Box Assinatura do Farmacêutico — 50%, sem borda esquerda */}
        <div
          style={{
            flex: "0 0 50%",
            border: "1px solid #000",
            borderLeft: "none",
            boxSizing: "border-box",
            padding: "14px 16px 12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {/* 3 linhas de preenchimento manual */}
          <div style={{ borderTop: "1px solid #000", marginBottom: 24 }} />
          <div style={{ borderTop: "1px solid #000", marginBottom: 24 }} />
          <div style={{ borderTop: "1px solid #000", marginBottom: 10 }} />
          {/* Label Assinatura do Farmacêutico */}
          <div style={{ fontSize: 9, textAlign: "center", marginBottom: 8, color: "#000" }}>
            Assinatura do Farmacêutico
          </div>
          {/* Data */}
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

// ─── Componente principal — 2 páginas ────────────────────────────────────────
export default function PrescricaoDocument({ data }: { data: PrescricaoData }) {
  return (
    <div style={{ background: "#fff" }}>
      {/* 1ª Via */}
      <ViaPage data={data} viaNum={1} />
      {/* 2ª Via — idêntica */}
      <ViaPage data={data} viaNum={2} />
    </div>
  );
}
