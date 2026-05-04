import { forwardRef } from "react";

interface LayoutElement {
  fieldId: string;
  top: number | string;
  left: number | string;
  fontSize?: string;
  fontWeight?: number | string;
  color?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  width?: number | string;
  zIndex?: number;
}

interface UniversalTemplate {
  slug: string;
  base_config: {
    width: number;
    height: number;
    dpi: number;
    backgroundColor: string;
    watermarkUrl?: string;
  };
  layout_definition: LayoutElement[];
}

interface UniversalDocumentProps {
  template: UniversalTemplate;
  data: Record<string, any>;
}

const UniversalDocument = forwardRef<HTMLDivElement, UniversalDocumentProps>(
  ({ template, data }, ref) => {
    const { width, height, backgroundColor, watermarkUrl } = template.base_config;

    return (
      <div
        ref={ref}
        id="universal-document"
        style={{
          width: width,
          height: height,
          backgroundColor: backgroundColor || "#ffffff",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "0"
        }}
      >
        {/* Camada 1: Marca d'Água / Fundo */}
        {watermarkUrl && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            zIndex: 1,
            pointerEvents: "none",
            opacity: 0.15
          }}>
            <img src={watermarkUrl} style={{ width: "100%" }} alt="Background" />
          </div>
        )}

        {/* Camada 2: Elementos Dinâmicos */}
        {template.layout_definition.map((el, idx) => {
          const value = data[el.fieldId] || "";
          
          return (
            <div
              key={`${el.fieldId}-${idx}`}
              style={{
                position: "absolute",
                top: el.top,
                left: el.left,
                fontSize: el.fontSize || "12pt",
                fontWeight: el.fontWeight || 400,
                color: el.color || "#000000",
                fontFamily: el.fontFamily || "Arial, sans-serif",
                textAlign: el.textAlign || "left",
                width: el.width || "auto",
                zIndex: el.zIndex || 10,
                whiteSpace: "nowrap"
              }}
            >
              {value}
            </div>
          );
        })}

        {/* Camada 3: Marca d'água de Preview (Se não houver ID real) */}
        {(!data.id || data.id === "XXXX.XXXX") && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 54,
            fontWeight: 900,
            color: "rgba(220, 38, 38, 0.12)",
            zIndex: 99,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            border: "10px solid rgba(220, 38, 38, 0.12)",
            padding: "20px 40px",
            borderRadius: 20
          }}>
            DOCUMENTO INVÁLIDO - PRÉVIA
          </div>
        )}
      </div>
    );
  }
);

UniversalDocument.displayName = "UniversalDocument";

export default UniversalDocument;
export type { UniversalTemplate, LayoutElement };
