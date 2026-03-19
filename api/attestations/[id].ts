import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAttestationById, updateAttestation, deleteAttestation, mapToFrontend } from "../_db";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const idStr = Array.isArray(id) ? id[0] : id;

    if (!idStr) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    if (req.method === "GET") {
      const attestation = getAttestationById(idStr);
      if (!attestation) {
        return res.status(404).json({ success: false, error: "Attestation not found" });
      }
      return res.json({ success: true, data: mapToFrontend(attestation) });
    }

    if (req.method === "PUT") {
      const updated = updateAttestation(idStr, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: "Attestation not found" });
      }
      return res.json({
        success: true,
        message: "Attestation updated successfully",
        data: mapToFrontend(updated),
      });
    }

    if (req.method === "DELETE") {
      const deleted = deleteAttestation(idStr);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Attestation not found" });
      }
      return res.json({ success: true, message: "Attestation deleted successfully" });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
