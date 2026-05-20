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
    // Restaurado para o ajuste de elite que o usuário aprovou (Subida Máxima)
    patientPadding: "2px 15px 26px 15px",
    
    // Address position: Agora usamos um SPACER físico para garantir a descida
    // Ajustado para ficar 'colado' (distância de 2 agulhas ≈ 8px) conforme solicitado
    addressSpacerHeight: 8, 
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
