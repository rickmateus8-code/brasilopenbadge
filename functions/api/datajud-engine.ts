import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { query, type, format = "01" } = JSON.parse(event.body || '{}');
    
    // Consulta simulada para atender os formatos solicitados
    // Em produção, isso bateria em https://api-publica.datajud.cnj.jus.br/...
    const mockData = {
      numeroProcesso: query.includes('.') ? query : "0000855-49.2023.8.26.0300",
      tribunal: "Tribunal de Justiça do Estado de São Paulo",
      classe: "Requisição de Pequeno Valor",
      assunto: "Benefícios em Espécie",
      valor: "R$ 0,00",
      dataInicio: "26/06/2025 10:08:26",
      dataUltimoMovimento: "30/04/2026 21:12:13",
      orgaoJulgador: "2 VARA JUDICIAL DA COMARCA DE JARDINOPOLIS",
      ultimaMovimentacao: {
        data: "30/04/2026 21:12:13",
        descricao: "Certidão de Publicação Expedida"
      },
      poloAtivo: {
        nome: "LUIS OTAVIO DOS SANTOS",
        doc: "13860043838",
        idade: "54 anos",
        telefones: ["(16) 98187-9885"],
        advogado: "CAIQUE VINICIUS CASTRO SOUZA",
        advogadoCpf: "39014767846"
      },
      poloPassivo: {
        nome: "INSS - INSTITUTO NACIONAL DO SEGURO SOCIAL",
        doc: "29979036000140",
        advogado: "PAULA YURI UEMURA",
        advogadoCpf: "31540494870"
      }
    };

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    let prompt = "";
    if (format === "01") {
      prompt = `Formate os seguintes dados jurídicos EXATAMENTE neste modelo:
      PROCESSO: [numero]
      LINK: docmaster.store/validacao/peticao/[id]
      TRIBUNAL: [tribunal]
      CLASSE: [classe]
      ... (todos os campos conforme solicitado pelo usuário no Formato 01)
      
      DADOS: ${JSON.stringify(mockData)}`;
    } else {
      prompt = `Formate os seguintes dados jurídicos EXATAMENTE no Formato 02 (Visual/Emoji):
      Requerente (Polo Ativo):
      👤 Nome: ...
      ...
      DADOS: ${JSON.stringify(mockData)}`;
    }

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          raw: mockData,
          summary: summary,
          validationLink: `https://docmaster.store/validacao/peticao/${mockData.numeroProcesso}`
        }
      })
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
