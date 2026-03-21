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
              /* Logo dr.consulta padrão em texto */
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  marginBottom: 5,
                  lineHeight: 1,
                  letterSpacing: -0.5,
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
            <div
              style={{
                fontSize: 8,
                lineHeight: 1.5,
                textDecoration: "underline",
                whiteSpace: "pre-line",
                color: "#000",
              }}
            >
              {cfg.via2}
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        {/* QR Code — canto inferior esquerdo */}
        <div>
          {data.qr_code_url ? (
            <img
              src={data.qr_code_url}
              alt="QR Code"
              style={{ width: 110, height: 110, display: "block" }}
            />
          ) : (
            <div
              style={{
                width: 110,
                height: 110,
                border: "1px dashed #999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                color: "#999",
              }}
            >
              QR Code
            </div>
          )}
          {data.codigo_qr && (
            <div
              style={{
                fontSize: 7.5,
                color: "#555",
                marginTop: 2,
                textAlign: "center",
                maxWidth: 110,
              }}
            >
              {data.codigo_qr}
            </div>
          )}
        </div>

        {/* Assinatura — canto inferior direito */}
        <div style={{ textAlign: "center", minWidth: 220 }}>
          {data.medico_assinatura_url && (
            <img
              src={data.medico_assinatura_url}
              alt="Assinatura"
              style={{
                maxHeight: 48,
                maxWidth: 200,
                objectFit: "contain",
                marginBottom: 2,
              }}
            />
          )}
          {/* Nome, especialidade e CRM em itálico azul */}
          <div
            style={{
              fontStyle: "italic",
              color: "#1a3a6b",
              fontSize: 11,
              lineHeight: 1.5,
              marginBottom: 4,
            }}
          >
            <div>{data.medico_nome}</div>
            {data.medico_especialidade && (
              <div>{data.medico_especialidade}</div>
            )}
            <div>
              CRM-{data.medico_uf}: {data.medico_crm}
            </div>
          </div>
          {/* Linha de assinatura */}
          <div
            style={{
              borderTop: "1px solid #000",
              width: 220,
              marginTop: 2,
            }}
          />
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

        {/* Box Assinatura do Farmacêutico — 50% */}
        <div
          style={{
            flex: "0 0 50%",
            border: "1px solid #000",
            borderLeft: "none",
            boxSizing: "border-box",
            padding: "12px 12px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ borderTop: "1px solid #000", marginBottom: 22 }} />
          <div style={{ borderTop: "1px solid #000", marginBottom: 22 }} />
          <div style={{ borderTop: "1px solid #000", marginBottom: 8 }} />
          <div
            style={{
              fontSize: 9.5,
              textAlign: "center",
              marginBottom: 6,
              color: "#000",
            }}
          >
            Assinatura do Farmacêutico
          </div>
          <div style={{ fontSize: 9.5, textAlign: "center", color: "#000" }}>
            Data _______ / _______ / _______
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
