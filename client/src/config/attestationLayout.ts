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
    // Force absolute vertical centering for patient info frame
    patientPadding: "2px 15px 26px 15px",
    
    // Address position: Sincronizado com o sucesso do Validador IDAB
    // Ajustado: Descido 2 linhas (~24px) a pedido do usuário (-42 + 24 = -18)
    addressMarginTop: -18, 
    addressMarginBottom: 38, // Ajustado para manter o equilíbrio vertical
  },

  // Global document dimensions (A4 @ 96dpi)
  dimensions: {
    width: 794,
    height: 1123,
    paddingH: 56,
    paddingV: 60
  }
};
