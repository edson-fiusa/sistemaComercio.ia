const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function perguntarIA(pergunta, dadosVendas) {
  const resposta = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "Você é um assistente de relatórios de vendas de um sistema PDV. Responda em português do Brasil, com clareza e valores em reais."
      },
      {
        role: "user",
        content: `
Dados das vendas:
${JSON.stringify(dadosVendas)}

Pergunta:
${pergunta}
`
      }
    ]
  });

  return resposta.choices[0].message.content;
}

module.exports = { perguntarIA };