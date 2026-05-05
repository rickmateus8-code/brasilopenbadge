import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const { query, type } = JSON.parse(event.body || '{}');
  
  // 1. Consulta ao Datajud (Proxy)
  // Nota: A lógica real depende do tribunal e do tipo de busca (processo, OAB, etc.)
  const datajudResults = await fetchFromDatajud(query, type);

  // 2. Processamento via IA (Resumo)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Resuma o seguinte caso jurídico de forma clara e profissional para um advogado:\n\n${JSON.stringify(datajudResults)}`;
  const summary = await model.generateContent(prompt);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      data: {
        raw: datajudResults,
        summary: summary.response.text()
      }
    })
  };
};

async function fetchFromDatajud(query: string, type: string) {
  // Implementação da chamada para os múltiplos endpoints Datajud baseada em tipo (OAB/CPF/CNPJ/Processo)
  return { results: "Consulta simulada..." };
}
