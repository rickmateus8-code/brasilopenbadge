import express, { Request, Response } from "express";
import {
  createAttestation,
  getAttestationById,
  getAttestationByCode,
  validateAttestation,
  getAllAttestations,
  updateAttestation,
  deleteAttestation,
  seedInitialData,
  type AttestationRecord,
} from "./database.js";

export function createApiRouter() {
  const router = express.Router();

  // Seed initial data on startup
  seedInitialData();

  // ===== GET ENDPOINTS =====

  /**
   * GET /api/attestations
   * Retrieve all attestations
   */
  router.get("/attestations", (_req: Request, res: Response) => {
    try {
      const data = getAllAttestations();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/attestations/:id
   * Retrieve a specific attestation by ID
   */
  router.get("/attestations/:id", (req: Request, res: Response) => {
    try {
      const attestation = getAttestationById(req.params.id);
      if (!attestation) {
        return res.status(404).json({ success: false, error: "Attestation not found" });
      }
      res.json({ success: true, data: attestation });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/validate/:code
   * Validate an attestation by code (optionally with date query param)
   */
  router.get("/validate/:code", (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const date = req.query.date as string | undefined;

      // If date provided, do full validation
      if (date) {
        const result = validateAttestation(code, date);
        if (result.valid && result.attestation) {
          return res.json({
            success: true,
            valid: true,
            message: "Attestation is valid and authentic",
            data: mapToFrontend(result.attestation),
          });
        }
        return res.json({
          success: false,
          valid: false,
          message: "Attestation not found or date does not match",
        });
      }

      // If no date, just look up by code
      const attestation = getAttestationByCode(code.trim().toUpperCase());
      if (!attestation) {
        return res.json({
          success: false,
          valid: false,
          message: "Attestation not found",
        });
      }

      res.json({
        success: true,
        valid: true,
        message: "Attestation found",
        data: mapToFrontend(attestation),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ===== POST ENDPOINTS =====

  /**
   * POST /api/attestations
   * Create a new attestation
   */
  router.post("/attestations", (req: Request, res: Response) => {
    try {
      const data = req.body;

      // Validate required fields
      const requiredFields = [
        "paciente", "sexo", "nascimento", "cpf", "nome_mae", "endereco",
        "condicao", "vacinacao", "cid", "medico", "crm", "especialidade",
        "data_assinatura", "hora_assinatura", "data_emissao",
      ];

      const missingFields = requiredFields.filter((field) => !data[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const newAttestation = createAttestation({
        paciente: data.paciente,
        sexo: data.sexo,
        nascimento: data.nascimento,
        cpf: data.cpf,
        nome_mae: data.nome_mae,
        endereco: data.endereco,
        passaporte: data.passaporte || null,
        condicao: data.condicao,
        vacinacao: data.vacinacao,
        cid: data.cid,
        medico: data.medico,
        crm: data.crm,
        especialidade: data.especialidade,
        data_assinatura: data.data_assinatura,
        hora_assinatura: data.hora_assinatura,
        data_emissao: data.data_emissao,
        logo_url: data.logo_url || null,
        endereco_emitente: data.endereco_emitente || "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
        instituicao: data.instituicao || "Clínica / Hospital",
      });

      res.status(201).json({
        success: true,
        message: "Attestation created successfully",
        data: mapToFrontend(newAttestation),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ===== PUT ENDPOINTS =====

  /**
   * PUT /api/attestations/:id
   * Update an existing attestation
   */
  router.put("/attestations/:id", (req: Request, res: Response) => {
    try {
      // Support both { data: { ... } } (from DocumentosSalvos) and flat { ... } (from AtestadoEditar)
      let payload = req.body;
      if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        // Merge: if there's a fillCpf flag at top level, preserve it
        const fillCpf = payload.fillCpf;
        payload = { ...payload.data };
        if (fillCpf) payload.fillCpf = fillCpf;
      }

      // Map frontend field names to database column names
      const fieldMap: Record<string, string> = {
        nome_paciente: 'paciente',
        nome_medico: 'medico',
        uf_crm: 'crm', // CRM already includes UF in some cases
        tipo_doc: 'tipo_doc',
        data_emissao: 'data_emissao',
        hora_emissao: 'hora_assinatura',
        dias_afastamento: 'afastamento',
        observacoes: 'texto_atestado',
        // Direct mappings (same name)
        cpf: 'cpf',
        paciente: 'paciente',
        sexo: 'sexo',
        nascimento: 'nascimento',
        nome_mae: 'nome_mae',
        endereco: 'endereco',
        cid: 'cid',
        medico: 'medico',
        crm: 'crm',
        especialidade: 'especialidade',
        data_assinatura: 'data_assinatura',
        hora_assinatura: 'hora_assinatura',
        texto_atestado: 'texto_atestado',
        afastamento: 'afastamento',
        instituicao: 'instituicao',
        unidade: 'unidade',
        endereco_emitente: 'endereco_emitente',
        cidade: 'cidade',
        modo_carimbo: 'modo_carimbo',
        logo_url: 'logo_url',
        logo_right: 'logo_right',
        signature_color: 'signature_color',
        signature_image: 'signature_image',
      };

      // Remap fields
      const dbPayload: Record<string, any> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (key === 'fillCpf') continue; // Skip meta flags
        const dbKey = fieldMap[key] || key;
        dbPayload[dbKey] = value;
      }

      const updated = updateAttestation(req.params.id, dbPayload);
      if (!updated) {
        return res.status(404).json({ success: false, error: "Attestation not found" });
      }
      res.json({
        success: true,
        message: "Attestation updated successfully",
        data: mapToFrontend(updated),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ===== DELETE ENDPOINTS =====

  /**
   * DELETE /api/attestations/:id
   * Delete an attestation
   */
  router.delete("/attestations/:id", (req: Request, res: Response) => {
    try {
      const deleted = deleteAttestation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Attestation not found" });
      }
      res.json({ success: true, message: "Attestation deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}

/**
 * Map database record to frontend-compatible format
 */
function mapToFrontend(record: AttestationRecord) {
  return {
    id: record.id,
    codigoQR: record.codigo_validacao,
    paciente: record.paciente,
    sexo: record.sexo,
    nascimento: record.nascimento,
    cpf: record.cpf,
    nomeMae: record.nome_mae,
    endereco: record.endereco,
    passaporte: record.passaporte || "",
    condicao: record.condicao,
    vacinacao: record.vacinacao,
    cid: record.cid,
    medico: record.medico,
    crm: record.crm,
    especialidade: record.especialidade,
    dataAssinatura: record.data_assinatura,
    horaAssinatura: record.hora_assinatura,
    dataEmissao: record.data_emissao,
    logoUrl: record.logo_url || undefined,
    enderecoEmitente: record.endereco_emitente,
    instituicao: record.instituicao,
  };
}
