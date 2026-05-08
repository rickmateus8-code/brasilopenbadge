import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface DiplomaUninterData {
  // Page 1
  nome_diplomado: string;
  nacionalidade: string;
  naturalidade_estado: string;
  data_nascimento: string;
  documento_numero: string;
  curso: string;
  data_conclusao: string;
  data_colacao: string;
  titulo_conferido: string;
  cidade_emissao: string;
  data_emissao: string;
  secretaria_nome: string;
  reitor_nome: string;
  codigo_validacao: string;
  url_validacao: string;

  // Page 2
  portaria_recredenciamento: string;
  dou_recredenciamento: string;
  retificacao_dou: string;
  portaria_reconhecimento: string;
  dou_reconhecimento: string;
  processo_numero: string;
  registro_numero: string;
  secretaria_registro_nome: string;
  portaria_registro: string;
  mantenedora_nome: string;
  mantenedora_cnpj: string;

  // Images
  assSecretariaImg?: string;
  assReitorImg?: string;
  assRegistroImg?: string;
}

interface DiplomaUninterDocumentProps {
  data: DiplomaUninterData;
}

const PAGE_WIDTH_PX = 1123; // A4 Landscape
const PAGE_HEIGHT_PX = 794;

const DiplomaUninterDocument = forwardRef<HTMLDivElement, DiplomaUninterDocumentProps>(
  ({ data }, ref) => {
    const textStyle: React.CSSProperties = {
      position: "absolute",
      color: "#000",
      fontFamily: "'Times New Roman', serif",
      zIndex: 10,
      textAlign: "center",
      width: "100%",
      lineHeight: "1.2",
    };

    const labelStyle: React.CSSProperties = {
      fontWeight: "bold",
    };

    return (
      <div ref={ref} id="uninter-diploma-document" style={{ width: PAGE_WIDTH_PX, display: "flex", flexDirection: "column", gap: 0, background: "#f3f4f6" }}>
        {/* PAGE 1: FRENTE */}
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            backgroundColor: "#ffffff",
            backgroundImage: "url('/assets/diploma_uninter_frente.jpg')",
            backgroundSize: "100% 100%",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          {/* Texto de abertura */}
          <div style={{ ...textStyle, top: "215px", fontSize: "14pt" }}>
            O Reitor do Centro Universitário Internacional UNINTER, no uso de suas atribuições e tendo em vista
          </div>

          <div style={{ ...textStyle, top: "245px", fontSize: "14pt" }}>
            a conclusão do Curso Superior de <span style={labelStyle}>{data.curso || "CURSO NÃO INFORMADO"}</span>,
          </div>

          <div style={{ ...textStyle, top: "275px", fontSize: "14pt" }}>
            em {data.data_conclusao || "—"} e a Colação de Grau em {data.data_colacao || "—"}, confere o título de
          </div>

          <div style={{ ...textStyle, top: "315px", fontSize: "20pt", fontWeight: "bold", textTransform: "uppercase" }}>
            {data.titulo_conferido || "GRADUADO"} a
          </div>

          {/* NOME DO DIPLOMADO */}
          <div style={{ ...textStyle, top: "385px", fontSize: "38pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
            {data.nome_diplomado || "NOME DO DIPLOMADO"}
          </div>

          {/* Dados pessoais */}
          <div style={{ ...textStyle, top: "485px", fontSize: "13pt" }}>
            de nacionalidade {data.nacionalidade || "BRASILEIRO(A)"}, natural do Estado de {data.naturalidade_estado || "—"}, nascido a {data.data_nascimento || "—"},
          </div>

          <div style={{ ...textStyle, top: "515px", fontSize: "13pt" }}>
            portador do documento nº {data.documento_numero || "—"},
          </div>

          <div style={{ ...textStyle, top: "545px", fontSize: "13pt" }}>
            e outorga-lhe o presente Diploma, a fim de que possa gozar de todos os direitos e prerrogativas legais.
          </div>

          {/* CIDADE E DATA */}
          <div style={{ ...textStyle, top: "605px", fontSize: "15pt", fontWeight: "bold" }}>
            {data.cidade_emissao || "Curitiba"}, {data.data_emissao || "—"}.
          </div>

          {/* ASSINATURAS FRENTE */}
          <div style={{ position: "absolute", bottom: "120px", left: "120px", textAlign: "center", width: "350px" }}>
             {data.assSecretariaImg && <img src={data.assSecretariaImg} style={{ height: "70px", position: "absolute", top: "-50px", left: "50%", transform: "translateX(-50%)", zIndex: 5 }} alt="Assinatura Secretária" />}
             <div style={{ borderTop: "1px solid #000", paddingTop: "8px", fontSize: "11pt", ...textStyle, position: "relative", width: "100%" }}>
               <strong>{data.secretaria_nome || "Simone Ramos de Oliveira"}</strong><br />
               <span style={{ fontSize: "9pt" }}>Secretária Geral de Gestão Acadêmica</span>
             </div>
          </div>

          <div style={{ position: "absolute", bottom: "120px", right: "120px", textAlign: "center", width: "350px" }}>
             {data.assReitorImg && <img src={data.assReitorImg} style={{ height: "70px", position: "absolute", top: "-50px", left: "50%", transform: "translateX(-50%)", zIndex: 5 }} alt="Assinatura Reitor" />}
             <div style={{ borderTop: "1px solid #000", paddingTop: "8px", fontSize: "11pt", ...textStyle, position: "relative", width: "100%" }}>
               <strong>{data.reitor_nome || "Benhur Etelberto Gaio"}</strong><br />
               <span style={{ fontSize: "9pt" }}>Reitor</span>
             </div>
          </div>

          {/* CÓDIGO VALIDAÇÃO FRENTE (OPCIONAL/DISCRETO) */}
          <div style={{ position: "absolute", bottom: "30px", right: "40px", textAlign: "right", fontSize: "7pt", color: "#666", opacity: 0.8 }}>
            Código de Validação: <span style={{ fontFamily: "monospace" }}>{data.codigo_validacao}</span>
          </div>
        </div>

        {/* PAGE 2: VERSO */}
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            backgroundColor: "#ffffff",
            backgroundImage: "url('/assets/diploma_uninter_verso.jpg')",
            backgroundSize: "100% 100%",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            marginTop: "20px", // Visual separation in preview
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          {/* BOX TOP LEFT: RECREDENCIAMENTO */}
          <div style={{ position: "absolute", top: "50px", left: "60px", width: "400px", fontSize: "9.5pt", textAlign: "left", lineHeight: "1.4", fontFamily: "'Times New Roman', serif" }}>
            <strong>Centro Universitário Internacional Uninter</strong><br />
            Recredenciado pela Portaria n.° {data.portaria_recredenciamento},<br />
            DOU n.° {data.dou_recredenciamento},<br />
            retificada no DOU de {data.retificacao_dou}.
          </div>

          {/* BOX MIDDLE LEFT: RECONHECIMENTO CURSO */}
          <div style={{ position: "absolute", top: "170px", left: "60px", width: "400px", fontSize: "9.5pt", textAlign: "left", lineHeight: "1.4", fontFamily: "'Times New Roman', serif" }}>
            <strong>Curso Superior de {data.curso}</strong><br />
            Reconhecido pela Portaria n.° {data.portaria_reconhecimento},<br />
            DOU {data.dou_reconhecimento}<br />
            Processo {data.processo_numero}.
          </div>

          {/* BOX BOTTOM LEFT: REGISTRO */}
          <div style={{ position: "absolute", top: "300px", left: "60px", width: "500px", fontSize: "10pt", textAlign: "left", lineHeight: "1.5", fontFamily: "'Times New Roman', serif" }}>
            Centro Universitário Internacional - Uninter<br />
            Divisão de Registro de Diplomas<br />
            <strong>Diploma Registrado sob o nº {data.registro_numero}</strong><br />
            Nos termos do art. 48, § 1º da Lei de 9.394, de 20/12/1996 e §2º do art. 99 do Decreto nº 9.235 de 15/12/2017.<br />
            <br />
            {data.cidade_emissao}, {data.data_emissao}<br />
            <div style={{ textAlign: "center", width: "280px", marginTop: "15px", position: "relative" }}>
               {data.assRegistroImg && <img src={data.assRegistroImg} style={{ height: "50px", position: "absolute", top: "-35px", left: "50%", transform: "translateX(-50%)" }} alt="Assinatura Registro" />}
               <div style={{ borderTop: "1px dotted #000", paddingTop: "5px" }}>
                 <strong>{data.secretaria_registro_nome}</strong><br />
                 Port. nº {data.portaria_registro}
               </div>
            </div>
          </div>

          {/* BOX LOWER LEFT: ASSINATURAS E MANTENEDORA */}
          <div style={{ position: "absolute", bottom: "180px", left: "60px", width: "450px", fontSize: "10pt", textAlign: "left", fontFamily: "'Times New Roman', serif" }}>
             <div style={{ marginBottom: "20px" }}>
               <strong>{data.secretaria_nome}</strong><br />
               Secretária Geral de Gestão Acadêmica
             </div>
             <div style={{ marginBottom: "20px" }}>
               <strong>{data.reitor_nome}</strong><br />
               Reitor
             </div>
             <div style={{ fontSize: "9pt", color: "#333" }}>
               Mantenedora: {data.mantenedora_nome}<br />
               CNPJ: {data.mantenedora_cnpj}
             </div>
          </div>

          {/* BOTTOM LEGAL TEXT */}
          <div style={{ position: "absolute", bottom: "60px", left: "60px", width: "500px", fontSize: "8.5pt", textAlign: "left", color: "#444" }}>
            Diploma Digital assinado nos termos da Portaria 554/2019/MEC.<br />
            A validação deste documento é dada por meio do endereço eletrônico:<br />
            <strong style={{ color: "#005CA9" }}>{data.url_validacao}</strong>
          </div>

          {/* QR CODE VERSO */}
          <div style={{ position: "absolute", bottom: "60px", right: "80px", textAlign: "center" }}>
            <div style={{ background: "#fff", padding: "10px", border: "1px solid #eee", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <QRCodeSVG value={data.url_validacao} size={140} />
            </div>
            <div style={{ textAlign: "center", marginTop: "15px" }}>
               <img src="/assets/uninter_logo_p_b.png" style={{ width: "120px", opacity: 0.9 }} alt="Uninter Logo" />
            </div>
          </div>

        </div>
      </div>
    );
  }
);

DiplomaUninterDocument.displayName = "DiplomaUninterDocument";
export default DiplomaUninterDocument;
