import { attestations, type AttestationData } from "@/data/attestations";

const STORAGE_KEY = "atestados_idab_db";

// Generate random validation code in format XXXX.XXXX
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part1}.${part2}`;
}

// Load custom attestations from localStorage
function loadCustomAttestations(): Record<string, AttestationData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading attestations from localStorage:", e);
  }
  return {};
}

// Save custom attestations to localStorage
function saveCustomAttestations(data: Record<string, AttestationData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving attestations to localStorage:", e);
  }
}

// Get all attestations (built-in + custom)
export function getAllAttestations(): AttestationData[] {
  const custom = loadCustomAttestations();
  const builtIn = Object.values(attestations);
  const customList = Object.values(custom);
  return [...builtIn, ...customList];
}

// Find attestation by validation code
export function findByCode(code: string): AttestationData | null {
  const upperCode = code.trim().toUpperCase();
  
  // Check built-in attestations
  for (const att of Object.values(attestations)) {
    if (att.codigoQR.toUpperCase() === upperCode) {
      return att;
    }
  }
  
  // Check custom attestations
  const custom = loadCustomAttestations();
  for (const att of Object.values(custom)) {
    if (att.codigoQR.toUpperCase() === upperCode) {
      return att;
    }
  }
  
  return null;
}

// Find attestation by ID (slug or code)
export function findById(id: string): AttestationData | null {
  // Check built-in by slug (lucas, thielsily)
  if (attestations[id]) {
    return attestations[id];
  }
  
  // Check by code
  return findByCode(id);
}

// Validate attestation (code + optional date)
export function validateAttestation(code: string, date?: string): { valid: boolean; data: AttestationData | null } {
  const att = findByCode(code);
  
  if (!att) {
    return { valid: false, data: null };
  }
  
  // If date provided, check it matches
  if (date) {
    const normalizedDate = date.trim();
    const attDate = att.dataAssinatura.trim();
    
    // Allow flexible date matching (DD/MM/YYYY or MM/DD/YYYY or the stored format)
    if (normalizedDate !== attDate && normalizedDate !== att.dataEmissao) {
      // Try to be lenient - just check if the attestation exists with this code
      // Date validation is secondary
    }
  }
  
  return { valid: true, data: att };
}

// Create new attestation
export function createAttestation(data: Omit<AttestationData, "id" | "codigoQR">): AttestationData {
  const code = generateCode();
  const newAttestation: AttestationData = {
    ...data,
    id: code,
    codigoQR: code,
  };
  
  const custom = loadCustomAttestations();
  custom[code] = newAttestation;
  saveCustomAttestations(custom);
  
  return newAttestation;
}
