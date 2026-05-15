import UninterDocument from "./DocumentPages";
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
    const rows = gradeRows || data.gradeRows || (data.data && data.data.gradeRows) || [];
    
    return (
      <div 
        ref={ref}
        style={{ 
          background: "white", 
          color: "#000", 
          display: "flex", 
          flexDirection: "column", 
          gap: 0,
          width: "207.53mm",
          margin: "0 auto"
        }}
      >
        <UninterDocument
          f={data.data || data}
          gradeRows={rows}
          profileKey={profileKey || data.profileKey}
          highlightModified={highlightModified}
        />
      </div>
    );
  }
);

HistoricoUNINTERDocument.displayName = "HistoricoUNINTERDocument";

export default HistoricoUNINTERDocument;
