import { forwardRef } from "react";

import { forwardRef } from "react";
import Barcode from "react-barcode";

interface LayoutElement {
  fieldId?: string; // ID do campo no formulário (se dinâmico)
  content?: string; // Texto estático (se não for dinâmico)
  type?: "text" | "image" | "barcode" | "static";
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  fontSize?: string;
  fontWeight?: number | string;
  color?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  width?: number | string;
  height?: number | string;
  zIndex?: number;
  transform?: string;
  transformOrigin?: string;
  letterSpacing?: string;
  opacity?: number;
  src?: string; // Para tipo 'image'
  fontStyle?: "normal" | "italic";
  borderBottom?: string;
  paddingBottom?: number | string;
  paddingRight?: number | string;
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
  fields_definition: any[];
  layout_definition: LayoutElement[];
  name?: string;
  price: number;
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

        {/* Camada 2: Elementos Dinâmicos e Estáticos */}
        {template.layout_definition.map((el, idx) => {
          const type = el.type || "text";
          const value = el.fieldId ? (data[el.fieldId] || "") : (el.content || "");
          
          const commonStyle: React.CSSProperties = {
            position: "absolute",
            top: el.top,
            bottom: el.bottom,
            left: el.left,
            right: el.right,
            zIndex: el.zIndex || 10,
            transform: el.transform,
            transformOrigin: el.transformOrigin,
            opacity: el.opacity,
          };

          if (type === "image") {
            const imgSrc = el.fieldId ? data[el.fieldId] : el.src;
            if (!imgSrc) return null;
            return (
              <div key={`${idx}`} style={commonStyle}>
                <img 
                  src={imgSrc} 
                  style={{ width: el.width, height: el.height, display: "block" }} 
                  alt="Asset" 
                />
              </div>
            );
          }

          if (type === "barcode") {
            if (!value) return null;
            return (
              <div key={`${idx}`} style={commonStyle}>
                <Barcode
                  value={String(value)}
                  width={Number(el.width) || 1.4}
                  height={Number(el.height) || 40}
                  displayValue={false}
                  margin={0}
                  background="transparent"
                />
              </div>
            );
          }

          return (
            <div
              key={`${idx}`}
              style={{
                ...commonStyle,
                fontSize: el.fontSize || "12pt",
                fontWeight: el.fontWeight || 400,
                color: el.color || "#000000",
                fontFamily: el.fontFamily || "Arial, sans-serif",
                textAlign: el.textAlign || "left",
                width: el.width || "auto",
                whiteSpace: "nowrap",
                letterSpacing: el.letterSpacing,
                fontStyle: el.fontStyle,
                borderBottom: el.borderBottom,
                paddingBottom: el.paddingBottom,
                paddingRight: el.paddingRight
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
