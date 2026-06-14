const OpenAI = require("openai");
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("\n❌ ERRO CRÍTICO: A variável GROQ_API_KEY não foi encontrada no arquivo .env!");
}

const client = new OpenAI({
  apiKey: apiKey || "CHAVE_NAO_CONFIGURADA",
  baseURL: "https://api.groq.com/openai/v1"
});

async function perguntarIA(pergunta, dadosContexto) {
  if (!apiKey || apiKey === "CHAVE_NAO_CONFIGURADA") {
    return "Erro no sistema: A chave de API do Groq não está configurada no arquivo .env.";
  }

  // Criamos uma mensagem limpa e direta, sem acumular históricos viciados anteriores
  const resposta = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1, // 🟢 Força a IA a ser fria e exata com os dados, sem inventar ou usar memória antiga
    messages: [
      {
        role: "system",
        content: `Você é o assistente de inteligência artificial oficial do sistema de PDV e estoque.
        Instrução estrita de resposta: Responda SEMPRE em português do Brasil, de forma curta, clara e direta ao ponto.
        
        Sua única fonte de verdade são os dados fornecidos no bloco 'DADOS ATUAIS DO SISTEMA'. Se o produto ou a informação não estiver listada lá, diga explicitamente que não encontrou no estoque atual.`
      },
      {
        role: "user",
        content: `
DADOS ATUAIS DO SISTEMA (ESTOQUE REAL E VENDAS):
${JSON.stringify(dadosContexto, null, 2)}

Pergunta do Usuário:
${pergunta}
`
      }
    ]
  });

  return resposta.choices[0].message.content;
}

module.exports = { perguntarIA };