import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAttestationByCode, validateAttestation, mapToFrontend } from "../_db";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { code } = req.query;
    const codeStr = Array.isArray(code) ? code[0] : code;
    const date = req.query.date as string | undefined;

    if (!codeStr) {
      return res.status(400).json({ success: false, error: "Code is required" });
    }

    // If date provided, do full validation
    if (date) {
      const result = validateAttestation(codeStr, date);
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
    const attestation = getAttestationByCode(codeStr.trim().toUpperCase());
    if (!attestation) {
      return res.json({
        success: false,
        valid: false,
        message: "Attestation not found",
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: "Attestation found",
      data: mapToFrontend(attestation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
