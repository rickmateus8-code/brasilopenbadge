import { 
  Page1, Page2, Page3, Page4, Page5, Page6 
} from "./DocumentPages";
import { type GradeRow, type ProfileKey } from "@/lib/documentData_uninter";
import React from "react";

interface Props {
  data: any;
  gradeRows?: GradeRow[];
  profileKey?: ProfileKey;
  highlightModified?: boolean;
}

const HistoricoUNINTERDocument = React.forwardRef<HTMLDivElement, Props>(
  ({ data, gradeRows, profileKey, highlightModified }, ref) => {
    // Se vierem dados brutos do banco (data.data), tenta extrair as notas
    const rows = gradeRows || data.gradeRows || [];
    const props = { 
      f: data, 
      highlightModified, 
      profileKey: profileKey || data.profileKey,
      gradeRows: rows
    };

    return (
      <div 
        ref={ref}
        style={{ 
          background: "white", 
          color: "#000", 
          display: "flex", 
          flexDirection: "column", 
          gap: 0,
          width: "794px",
          margin: "0 auto"
        }}
      >
        <Page1 {...props} />
        <Page2 {...props} />
        <Page3 {...props} />
        <Page4 />
        <Page5 {...props} />
        <Page6 {...props} />
      </div>
    );
  }
);

HistoricoUNINTERDocument.displayName = "HistoricoUNINTERDocument";

export default HistoricoUNINTERDocument;
