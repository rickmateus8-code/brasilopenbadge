import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllAttestations, createAttestation, mapToFrontend } from "./_db";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const data = getAllAttestations();
      return res.json({ success: true, data: data.map(mapToFrontend), count: data.length });
    }

    if (req.method === "POST") {
      const body = req.body;

      const requiredFields = [
        "paciente", "sexo", "nascimento", "cpf", "nome_mae", "endereco",
        "condicao", "vacinacao", "cid", "medico", "crm", "especialidade",
        "data_assinatura", "hora_assinatura", "data_emissao",
      ];

      const missingFields = requiredFields.filter((field) => !body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const newAttestation = createAttestation({
        paciente: body.paciente,
        sexo: body.sexo,
        nascimento: body.nascimento,
        cpf: body.cpf,
        nome_mae: body.nome_mae,
        endereco: body.endereco,
        passaporte: body.passaporte || null,
        condicao: body.condicao,
        vacinacao: body.vacinacao,
        cid: body.cid,
        medico: body.medico,
        crm: body.crm,
        especialidade: body.especialidade,
        data_assinatura: body.data_assinatura,
        hora_assinatura: body.hora_assinatura,
        data_emissao: body.data_emissao,
        logo_url: body.logo_url || null,
        endereco_emitente: body.endereco_emitente || "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
        instituicao: body.instituicao || "IDAB - SALVADOR/BAHIA",
      });

      return res.status(201).json({
        success: true,
        message: "Attestation created successfully",
        data: mapToFrontend(newAttestation),
      });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
