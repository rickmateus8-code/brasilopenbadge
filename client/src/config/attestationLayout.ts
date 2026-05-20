/**
 * ATTESTATION LAYOUT CONFIGURATION
 * Single Source of Truth for visual parity across DocMaster and IDAB.
 */

export const ATTESTATION_LAYOUT = {
  // Default interactive stamp coordinates and styling
  stamp: {
    defaultX: 141,
    defaultY: -120,
    defaultScale: 1.2,
    defaultRotate: -3,
    realism: {
      previewOpacity: 0.94,
      exportOpacity: 0.88,
      exportMixBlendMode: "multiply" as const,
    }
  },

  // Export-specific compensatory adjustments for html2canvas/PDF
  export: {
    // Restaurado para o equilíbrio original perfeito (Sincronia DocMaster/IDAB)
    patientPadding: "14.25px 15px",
    
    // Address position: Sempre ABAIXO da moldura com distância limpa
    addressMarginTop: 15, 
    addressMarginBottom: 15, 
  },

  // Global document dimensions (A4 @ 96dpi)
  dimensions: {
    width: 794,
    height: 1123,
    paddingH: 56,
    paddingV: 60
  }
};
