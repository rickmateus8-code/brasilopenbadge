/**
 * fontLoader.ts — Utilitário para carregamento dinâmico de fontes Google Fonts.
 */

const loadedFonts = new Set<string>();

export function loadDynamicFont(fontFamily: string) {
  if (!fontFamily || loadedFonts.has(fontFamily)) return;

  // Se a fonte for uma das padrão do sistema, não carregar
  const systemFonts = ["Arial", "sans-serif", "serif", "monospace", "Times New Roman", "Helvetica", "Courier New"];
  if (systemFonts.some(f => fontFamily.includes(f))) return;

  try {
    const fontName = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
    if (loadedFonts.has(fontName)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, "+")}:wght@400;700&display=swap`;
    document.head.appendChild(link);
    
    loadedFonts.add(fontName);
    loadedFonts.add(fontFamily);
    console.log(`[Engine] Fonte carregada: ${fontName}`);
  } catch (err) {
    console.error(`[Engine] Erro ao carregar fonte ${fontFamily}:`, err);
  }
}
