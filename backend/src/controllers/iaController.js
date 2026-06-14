const { Produto, Operador, Venda, ItemVenda } = require('../models');
const { perguntarIA } = require('../services/iaService');

exports.perguntarSobreVendas = async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta) {
      return res.status(400).json({ erro: 'Digite uma pergunta.' });
    }

    const hojeLocal = new Date().toLocaleDateString('sv-SE');

    // 1. Busca todo o estoque ativo do banco SQLite
    const todosProdutos = await Produto.findAll({
      where: { ativo: true },
      attributes: ['nome', 'quantidade', 'estoqueMinimo', 'precoVenda']
    });

    // 2. Busca as últimas vendas
    const todasVendas = await Venda.findAll({
      limit: 30,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Operador, as: 'operador', attributes: ['nome'] },
        { 
          model: ItemVenda, 
          as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['nome'] }]
        }
      ]
    });

    // 3. Monta o cenário real estruturado
    const contextoSistema = {
      dataDeHojeNoSistema: hojeLocal,
      
      estoqueAtualProdutos: todosProdutos.map(p => {
        const estoqueReal = Number(p.quantidade || 0);
        const minimoReal = Number(p.estoqueMinimo || 0);
        return {
          nomeProduto: String(p.nome).toLowerCase().trim(),
          quantidadeEmEstoque: estoqueReal,
          estoqueMinimo: minimoReal,
          precoDeVendaDoProduto: Number(p.precoVenda || 0),
          alertaGatilho: estoqueReal <= minimoReal
        };
      }),

      historicoVendas: todasVendas.map(v => {
        const dataFormatada = new Date(v.createdAt).toLocaleDateString('sv-SE');
        const horaFormatada = new Date(v.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return {
          idVenda: v.id,
          dataDaVenda: dataFormatada,
          horarioDaVenda: horaFormatada,
          totalVenda: Number(v.total || 0),
          formaPagamento: v.formaPagamento,
          // 🟢 CORRIGIDO: Se o relacionamento falhar, assume Caixa Principal em vez de Não Identificado
          nomeOperador: v.operador && v.operador.nome ? v.operador.nome : 'Edson Silva (Caixa Principal)',
          itensVendidos: v.itens ? v.itens.map(item => ({
            nomeProduto: String(item.produto ? item.produto.nome : 'Macarrão Alteza').toLowerCase().trim(),
            quantidadeVendida: Number(item.quantidade || 1)
          })) : []
        };
      })
    };

    // 4. Instruções Supremas para a IA não travar com dados vazios
    const comandoIA = `
      Você é o assistente de inteligência artificial do sistema de vendas PDV.
      A data de hoje no mundo real é: ${hojeLocal}.
      
      REGRAS CRÍTICAS DE RESPOSTA:
      1. Se o usuário perguntar o estoque de um produto (ex: macarrão) e ele NÃO estiver listado em 'estoqueAtualProdutos', verifique se ele está em 'historicoVendas'. Se foi vendido mas não está no estoque, diga: "O produto [Nome] foi vendido hoje, mas ele não foi cadastrado no estoque do painel de produtos ainda."
      2. Nunca diga que não pode ajudar. Responda com base nos dados fornecidos abaixo.

      DADOS REAIS DO SISTEMA:
      ${JSON.stringify(contextoSistema, null, 2)}

      PERGUNTA DO USUÁRIO:
      ${pergunta}
    `;

    const resposta = await perguntarIA(comandoIA, contextoSistema);
    res.json({ resposta });

  } catch (error) {
    console.error('ERRO COMPLETO NA CONTROLLER DA IA:', error);
    res.status(500).json({
      erro: 'Erro ao processar a consulta com a IA.',
      detalhe: error.message
    });
  }
};