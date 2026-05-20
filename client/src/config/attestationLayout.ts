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
      exportOpacity: 0.82, // Opacidade mais baixa para PDF simular tinta
      exportMixBlendMode: "normal" as const, // html2canvas ignora multiply
    }
  },

  // Export-specific compensatory adjustments for html2canvas/PDF
  export: {
    // Restaurado para o equilíbrio original perfeito (Sincronia DocMaster/IDAB)
    patientPadding: "14.25px 15px",
    
    // Address position: Agora usamos um SPACER físico para garantir a descida
    addressSpacerHeight: 48, // Equivalente a ~4 linhas para garantir descida total
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
