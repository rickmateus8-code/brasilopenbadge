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
      fontFamily: "Times New Roman, serif",
      zIndex: 10,
      textAlign: "center",
      width: "100%",
    };

    const labelStyle: React.CSSProperties = {
      fontWeight: "bold",
    };

    return (
      <div ref={ref} id="uninter-diploma-document" style={{ width: PAGE_WIDTH_PX, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* PAGE 1: FRENTE */}
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            backgroundColor: "#ffffff",
            backgroundImage: "url('/assets/diploma_uninter_frente.jpg')",
            backgroundSize: "cover",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* O Reitor do Centro Universitário... */}
          <div style={{ ...textStyle, top: 210, fontSize: "14pt" }}>
            O Reitor do Centro Universitário Internacional UNINTER, no uso de suas atribuições e tendo em vista
          </div>

          <div style={{ ...textStyle, top: 240, fontSize: "14pt" }}>
            a conclusão do Curso Superior de <span style={labelStyle}>{data.curso || "ELETRICISTA PREDIAL"}</span>,
          </div>

          <div style={{ ...textStyle, top: 270, fontSize: "14pt" }}>
            em {data.data_conclusao || "15 de dezembro de 2010"} e a Colação de Grau em {data.data_colacao || "20 de dezembro de 2010"}, confere o título de
          </div>

          <div style={{ ...textStyle, top: 310, fontSize: "20pt", fontWeight: "bold", textTransform: "uppercase" }}>
            {data.titulo_conferido || "CURSO PROFISSIONALIZANTE"} a
          </div>

          {/* NOME DO DIPLOMADO */}
          <div style={{ ...textStyle, top: 380, fontSize: "36pt", fontWeight: "bold", textTransform: "uppercase" }}>
            {data.nome_diplomado || "DANIEL SANTOS MOREIRA"}
          </div>

          <div style={{ ...textStyle, top: 480, fontSize: "12pt" }}>
            de nacionalidade {data.nacionalidade || "BRASILEIRO(A)"}, natural do Estado de {data.naturalidade_estado || "SALVADOR-BA"}, nascido a {data.data_nascimento || "7 de junho de 1977"},
          </div>

          <div style={{ ...textStyle, top: 510, fontSize: "12pt" }}>
            portador do documento nº {data.documento_numero || "05.223.209-37"},
          </div>

          <div style={{ ...textStyle, top: 540, fontSize: "12pt" }}>
            e outorga-lhe o presente Diploma, a fim de que possa gozar de todos os direitos e prerrogativas legais.
          </div>

          {/* CIDADE E DATA */}
          <div style={{ ...textStyle, top: 590, fontSize: "14pt" }}>
            {data.cidade_emissao || "Curitiba"}, {data.data_emissao || "12 de janeiro de 2011"}.
          </div>

          {/* ASSINATURAS FRENTE */}
          <div style={{ position: "absolute", bottom: 100, left: 150, textAlign: "center", width: 300 }}>
             {data.assSecretariaImg && <img src={data.assSecretariaImg} style={{ height: 60, marginBottom: 5 }} alt="Assinatura Secretária" />}
             <div style={{ borderTop: "1px solid #000", paddingTop: 5, fontSize: "11pt" }}>
               {data.secretaria_nome || "Simone Ramos de Oliveira"}<br />
               <span style={{ fontSize: "9pt" }}>Secretária Geral de Gestão Acadêmica</span>
             </div>
          </div>

          <div style={{ position: "absolute", bottom: 100, right: 150, textAlign: "center", width: 300 }}>
             {data.assReitorImg && <img src={data.assReitorImg} style={{ height: 60, marginBottom: 5 }} alt="Assinatura Reitor" />}
             <div style={{ borderTop: "1px solid #000", paddingTop: 5, fontSize: "11pt" }}>
               {data.reitor_nome || "Benhur Etelberto Gaio"}<br />
               <span style={{ fontSize: "9pt" }}>Reitor</span>
             </div>
          </div>

          {/* CÓDIGO VALIDAÇÃO */}
          <div style={{ position: "absolute", bottom: 40, right: 40, textAlign: "right", fontSize: "8pt", color: "#333" }}>
            Código de Validação<br />
            <span style={{ fontFamily: "monospace", fontSize: "9pt" }}>{data.codigo_validacao || "57babfed8f82479b5a923b1a0ffbe665f51d04ed0f69a4471c28641b0c947156"}</span><br />
            {data.url_validacao || "https://uninter-meudiploma.online"}
          </div>
        </div>

        {/* PAGE 2: VERSO */}
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            backgroundColor: "#ffffff",
            backgroundImage: "url('/assets/diploma_uninter_verso.jpg')",
            backgroundSize: "cover",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* BOX TOP LEFT: RECREDENCIAMENTO */}
          <div style={{ position: "absolute", top: 40, left: 40, width: 350, fontSize: "9pt", textAlign: "left", lineHeight: "1.3" }}>
            <strong>Centro Universitário Internacional Uninter</strong><br />
            Recredenciado pela Portaria n.° {data.portaria_recredenciamento || "1.219, de 25/05/2012"},<br />
            DOU n.° {data.dou_recredenciamento || "244, Seção 1, pág. 125, de 20/12/2018"},<br />
            retificada no DOU de {data.retificacao_dou || "27/12/2018, n.° 248, Seção 1, pág. 85"}.
          </div>

          {/* BOX MIDDLE LEFT: RECONHECIMENTO CURSO */}
          <div style={{ position: "absolute", top: 150, left: 40, width: 350, fontSize: "9pt", textAlign: "left", lineHeight: "1.3" }}>
            <strong>Curso Superior de {data.curso || "ELETRICISTA PREDIAL"}</strong><br />
            Reconhecido pela Portaria n.° {data.portaria_reconhecimento || "913, de 20/12/2022"},<br />
            DOU {data.dou_reconhecimento || "245, Seção 1, pág. 35-40 n.°"}<br />
            Processo {data.processo_numero || "201827038"}.
          </div>

          {/* BOX BOTTOM LEFT: REGISTRO */}
          <div style={{ position: "absolute", top: 260, left: 40, width: 450, fontSize: "9pt", textAlign: "left", lineHeight: "1.4" }}>
            Centro Universitário Internacional - Uninter<br />
            Divisão de Registro de Diplomas<br />
            <strong>Diploma Registrado sob o nº {data.registro_numero || "4521|08|127|2466"}</strong><br />
            Nos termos do art. 48, § 1º da Lei de 9.394, de 20/12/1996 e §2º do art. 99 do Decreto nº 9.235 de 15/12/2017.<br />
            <br />
            {data.cidade_emissao || "Curitiba"}, {data.data_emissao || "5 de janeiro de 2011"}<br />
            <div style={{ textAlign: "center", width: 250, marginTop: 10 }}>
               {data.assRegistroImg && <img src={data.assRegistroImg} style={{ height: 40 }} alt="Assinatura Registro" />}
               <div style={{ borderTop: "1px dotted #000", paddingTop: 2 }}>
                 {data.secretaria_registro_nome || "EDILAINE ALVES BELCHIOR"}<br />
                 Port. nº {data.portaria_registro || "169/2021"}
               </div>
            </div>
          </div>

          {/* BOX LOWER LEFT: ASSINATURAS E MANTENEDORA */}
          <div style={{ position: "absolute", bottom: 200, left: 40, width: 400, fontSize: "9pt", textAlign: "left" }}>
             <div style={{ marginBottom: 15 }}>
               <strong>{data.secretaria_nome || "Simone Ramos de Oliveira"}</strong><br />
               Secretária Geral de Gestão Acadêmica
             </div>
             <div style={{ marginBottom: 15 }}>
               <strong>{data.reitor_nome || "Benhur Etelberto Gaio"}</strong><br />
               Reitor
             </div>
             <div>
               Mantenedora: {data.mantenedora_nome || "UNINTER EDUCACIONAL S/A"}<br />
               CNPJ: {data.mantenedora_cnpj || "02.261.854/0001-57"}
             </div>
          </div>

          {/* BOTTOM LEGAL TEXT */}
          <div style={{ position: "absolute", bottom: 60, left: 40, width: 400, fontSize: "8pt", textAlign: "left" }}>
            Diploma Digital assinado nos termos da Portaria 554/2019/MEC.<br />
            A validação deste documento é dada por meio do endereço eletrônico {data.url_validacao || "uninter-meudiploma.online"}
          </div>

          {/* QR CODE VERSO */}
          <div style={{ position: "absolute", bottom: 60, right: 60 }}>
            <QRCodeSVG value={data.url_validacao || "https://uninter-meudiploma.online"} size={120} />
            <div style={{ textAlign: "center", marginTop: 10 }}>
               <img src="/assets/uninter_logo_p_b.png" style={{ width: 100 }} alt="Uninter Logo" />
            </div>
          </div>

        </div>
      </div>
    );
  }
);

DiplomaUninterDocument.displayName = "DiplomaUninterDocument";
export default DiplomaUninterDocument;
