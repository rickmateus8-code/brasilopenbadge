import express, { Request, Response } from "express";
import { nanoid } from "nanoid";

export interface AttestationDataRequest {
  // Dados do Paciente
  paciente: string;
  paciente_en?: string;
  sexo: "MALE" | "FEMALE";
  nascimento: string;
  cpf: string;
  nomeMae: string;
  nomeMae_en?: string;
  endereco: string;
  endereco_en?: string;

  // Dados Médicos
  passaporte: string;
  condicao: string;
  condicao_en?: string;
  vacinacao: string;
  vacinacao_en?: string;
  cid: string;
  cid_en?: string;

  // Dados do Médico
  medico: string;
  crm: string;
  especialidade: string;
  especialidade_en?: string;

  // Data e Hora
  dataAssinatura: string;
  horaAssinatura: string;
}

export interface AttestationData extends AttestationDataRequest {
  id: string;
  codigoQR: string;
  dataEmissao: string;
  dataEmissao_en?: string;
  logoUrl?: string; // URL da logo personalizada
}

// In-memory storage (in production, use a database)
const attestations: Map<string, AttestationData> = new Map();

// Initialize with sample data
function initializeSampleData() {
  const lucas: AttestationData = {
    id: "P792.GL02",
    codigoQR: "P792.GL02",
    paciente: "LUCAS MESSIAS MARON",
    sexo: "MALE",
    nascimento: "07/10/1987",
    cpf: "033.548.725-43",
    nomeMae: "DIANE MESSIAS MARON",
    endereco: "RUA DE ITABORAHY, 749 AP 103, AMARALINA - SALVADOR - BA, 41900-000",
    passaporte: "GN4060607",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    dataAssinatura: "16/03/2026",
    horaAssinatura: "15:41",
    dataEmissao: "MARCH 16, 2026",
  };

  const thielsily: AttestationData = {
    id: "UMS4.9Z40",
    codigoQR: "UMS4.9Z40",
    paciente: "THIELSILY MONIQUE CÂNDIDA DA SILVA PEREIRA",
    sexo: "FEMALE",
    nascimento: "01/11/1994",
    cpf: "167.709.317-02",
    nomeMae: "CRISTIANA CANDIDA DA SILVA",
    endereco: "RUA CASTELO BRANCO, 290 - CENTRO, ITABORAI/RJ - 24800-089",
    passaporte: "FX255093",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    dataAssinatura: "16/03/2026",
    horaAssinatura: "14:53",
    dataEmissao: "MARCH 16, 2026",
  };

  attestations.set(lucas.codigoQR, lucas);
  attestations.set(thielsily.codigoQR, thielsily);
}

export function createApiRouter() {
  const router = express.Router();

  // Initialize sample data on first load
  if (attestations.size === 0) {
    initializeSampleData();
  }

  // ===== GET ENDPOINTS =====

  /**
   * GET /api/attestations
   * Retrieve all attestations
   */
  router.get("/attestations", (_req: Request, res: Response) => {
    try {
      const data = Array.from(attestations.values());
      res.json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/attestations/:id
   * Retrieve a specific attestation by ID or QR code
   */
  router.get("/attestations/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const attestation = attestations.get(id);

      if (!attestation) {
        return res.status(404).json({
          success: false,
          error: "Attestation not found",
        });
      }

      res.json({
        success: true,
        data: attestation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/validate/:code
   * Validate an attestation by QR code
   */
  router.get("/validate/:code", (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const attestation = attestations.get(code);

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
        message: "Attestation is valid and authentic",
        data: attestation,
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
   * Body: AttestationDataRequest
   */
  router.post("/attestations", (req: Request, res: Response) => {
    try {
      const data = req.body as AttestationDataRequest;

      // Validate required fields
      const requiredFields = [
        "paciente",
        "sexo",
        "nascimento",
        "cpf",
        "nomeMae",
        "endereco",
        "passaporte",
        "condicao",
        "vacinacao",
        "cid",
        "medico",
        "crm",
        "especialidade",
        "dataAssinatura",
        "horaAssinatura",
      ];

      const missingFields = requiredFields.filter((field) => !data[field as keyof AttestationDataRequest]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Generate unique ID and QR code
      const id = nanoid(10).toUpperCase();
      const codigoQR = id;

      const newAttestation: AttestationData = {
        ...data,
        id,
        codigoQR,
        dataEmissao: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).toUpperCase(),
      };

      attestations.set(codigoQR, newAttestation);

      res.status(201).json({
        success: true,
        message: "Attestation created successfully",
        data: newAttestation,
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
      const { id } = req.params;
      const attestation = attestations.get(id);

      if (!attestation) {
        return res.status(404).json({
          success: false,
          error: "Attestation not found",
        });
      }

      const updatedData = {
        ...attestation,
        ...req.body,
        id: attestation.id, // Prevent ID changes
        codigoQR: attestation.codigoQR, // Prevent QR code changes
      };

      attestations.set(id, updatedData);

      res.json({
        success: true,
        message: "Attestation updated successfully",
        data: updatedData,
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
      const { id } = req.params;
      const attestation = attestations.get(id);

      if (!attestation) {
        return res.status(404).json({
          success: false,
          error: "Attestation not found",
        });
      }

      attestations.delete(id);

      res.json({
        success: true,
        message: "Attestation deleted successfully",
        data: attestation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
