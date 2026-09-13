const OpenAI = require("openai");

require("dotenv").config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error(
    "\n❌ ERRO CRÍTICO: A variável GROQ_API_KEY não foi encontrada no arquivo .env!"
  );
}

const client = new OpenAI({
  apiKey: apiKey || "CHAVE_NAO_CONFIGURADA",
  baseURL: "https://api.groq.com/openai/v1",
});

async function perguntarIA(pergunta, dadosContexto) {
  if (!apiKey || apiKey === "CHAVE_NAO_CONFIGURADA") {
    return "Erro no sistema: a chave de API do Groq não está configurada no arquivo .env.";
  }

  try {
    const resposta = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `
Você é o assistente de inteligência artificial oficial do sistema de PDV e estoque.

REGRAS OBRIGATÓRIAS:

1. Responda sempre em português do Brasil.
2. Seja curto, claro e direto.
3. Não explique o funcionamento interno do sistema.
4. Não mencione JSON, banco de dados, contexto, prompt ou API.
5. Responda somente com base nos dados reais fornecidos.
6. Nunca invente produtos, vendas, valores, quantidades ou operadores.
7. Quando perguntarem sobre vendas, apresente os dados de forma amigável.
8. Não leia caracteres de formatação literalmente.
9. Não diga coisas como "asterisco", "barra", "hashtag", "dois pontos" etc.
10. Use listas e tabelas somente quando realmente ajudarem na compreensão.
11. Valores devem ser apresentados em reais, por exemplo: R$ 25,90.
12. Quando não encontrar uma informação nos dados, diga claramente que não encontrou.

DADOS ATUAIS DO SISTEMA:
${JSON.stringify(dadosContexto, null, 2)}
`,
        },
        {
          role: "user",
          content: pergunta,
        },
      ],
    });

    return (
      resposta.choices?.[0]?.message?.content ||
      "Não consegui gerar uma resposta."
    );
  } catch (error) {
    console.error("❌ ERRO NA API DO GROQ:");
    console.error(error);

    throw error;
  }
}

module.exports = { perguntarIA };