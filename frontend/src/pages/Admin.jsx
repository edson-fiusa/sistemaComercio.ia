import { useEffect, useState } from 'react';
import { api, fmt, fmt3 } from '../services/api';
import AssistenteIA from './AssistenteIA';

const secoes = [
  ['cadastroProduto', 'fas fa-box', 'Cadastrar/Editar Produto'],
  ['gerenciarProdutos', 'fas fa-edit', 'Gerenciar Produtos'],
  ['produtosAvariados', 'fas fa-exclamation-triangle', 'Produtos Avariados'],
  ['avariaProduto', 'fas fa-exclamation-triangle', 'Registrar Avaria'],
  ['relatorioEstoque', 'fas fa-clipboard-list', 'Relatório Estoque'],
  ['relatorioCaixa', 'fas fa-chart-line', 'Relatório Caixa'],
  ['gerenciarOperadores', 'fas fa-users', 'Gerenciar Operadores']
];

export default function Admin({ onLogout, toast }) {
  const [secao, setSecao] = useState('cadastroProduto');
  const [produtos, setProdutos] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [avarias, setAvarias] = useState([]);
  
  // Estados gerenciadores dos produtos
  const [produto, setProduto] = useState({
    unidade: 'unidade',
    quantidade: 0,
    estoqueMinimo: 0
  });
  const [idEditandoProduto, setIdEditandoProduto] = useState(null);

  // Estados gerenciadores dos operadores
  const [operador, setOperador] = useState({});
  const [idEditandoOperador, setIdEditandoOperador] = useState(null);

  const [avaria, setAvaria] = useState({ motivo: 'vencido' });

  async function carregar() {
    const [p, o] = await Promise.all([
      api.get('/produtos'),
      api.get('/operadores')
    ]);

    setProdutos(p.data);
    setOperadores(o.data);

    if (secao === 'produtosAvariados') {
      const resp = await api.get('/avarias');
      setAvarias(resp.data);
    }
  }

  useEffect(() => {
    carregar().catch((e) =>
      toast(e.response?.data?.erro || e.message, 'error')
    );
  }, [secao]);

  // 🟢 SALVAR PRODUTO (CADASTRAR E ATUALIZAR)
  async function salvarProduto() {
    try {
      if (idEditandoProduto) {
        await api.put(`/produtos/${idEditandoProduto}`, produto);
        toast('Produto atualizado com sucesso!', 'success');
      } else {
        await api.post('/produtos', produto);
        toast('Produto cadastrado!', 'success');
      }

      setProduto({
        unidade: 'unidade',
        quantidade: 0,
        estoqueMinimo: 0
      });
      setIdEditandoProduto(null);
      carregar();
    } catch (e) {
      toast(e.response?.data?.erro || e.message, 'error');
    }
  }

  // 🟢 PREPARA O FORMULÁRIO PARA EDIÇÃO DO PRODUTO
  function prepararEdicaoProduto(p) {
    setIdEditandoProduto(p.id);
    setProduto({
      nome: p.nome,
      codigo: p.codigo,
      precoEntrada: p.precoEntrada,
      precoVenda: p.precoVenda,
      quantidade: p.quantidade,
      estoqueMinimo: p.estoqueMinimo,
      categoria: p.categoria,
      unidade: p.unidade || 'unidade'
    });
    setSecao('cadastroProduto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluirProduto(id) {
    if (!confirm('Deseja excluir este produto?')) return;

    await api.delete(`/produtos/${id}`);
    toast('Produto excluído!', 'success');
    carregar();
  }

  // 🟢 SALVAR OPERADOR (CADASTRAR E ATUALIZAR)
  async function salvarOperador() {
    if (operador.senha && operador.senha !== operador.confirmarSenha) {
      return toast('As senhas não conferem.', 'warning');
    }

    try {
      const dadosOperador = {
        nome: operador.nome ? String(operador.nome).trim() : '',
        login: operador.usuario ? String(operador.usuario).trim() : '',
        senha: operador.senha ? String(operador.senha) : '',
        perfil: 'caixa'
      };

      if (idEditandoOperador) {
        await api.put(`/operadores/${idEditandoOperador}`, dadosOperador);
        toast('Operador atualizado com sucesso!', 'success');
      } else {
        if (!dadosOperador.nome || !dadosOperador.login || !dadosOperador.senha) {
          return toast('Nome, Usuário e Senha são obrigatórios para um novo cadastro.', 'warning');
        }
        await api.post('/operadores', dadosOperador);
        toast('Operador cadastrado com sucesso!', 'success');
      }

      setOperador({});
      setIdEditandoOperador(null);
      carregar();
    } catch (e) {
      toast(e.response?.data?.erro || e.message, 'error');
    }
  }

  function prepararEdicaoOperador(op) {
    setIdEditandoOperador(op.id);
    setOperador({
      nome: op.nome,
      usuario: op.login || op.usuario || '',
      senha: '',
      confirmarSenha: ''
    });
  }

  async function excluirOperador(id) {
    if (!confirm('Tem certeza que deseja excluir este operador?')) return;
    try {
      await api.delete(`/operadores/${id}`);
      toast('Operador removido!', 'success');
      carregar();
    } catch (e) {
      toast(e.response?.data?.erro || e.message, 'error');
    }
  }

  async function registrarAvaria() {
    try {
      await api.post('/avarias', avaria);
      setAvaria({ motivo: 'vencido' });
      toast('Avaria registrada!', 'success');
      carregar();
    } catch (e) {
      toast(e.response?.data?.erro || e.message, 'error');
    }
  }

  const totalEstoque = produtos.reduce(
    (s, p) => s + Number(p.quantidade) * Number(p.precoEntrada),
    0
  );

  return (
    <section id="adminMode">
      <div className="flex justify-between items-center mb-20">
        <h2>Modo Administrador</h2>

        <button className="btn btn-voltar" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Sair
        </button>
      </div>

      <div className="menu">
        {secoes.map((s) => (
          <button
            key={s[0]}
            className={`menu-btn ${secao === s[0] ? 'active' : ''}`}
            onClick={() => setSecao(s[0])}
          >
            <i className={s[1]}></i>
            <span>{s[2]}</span>
          </button>
        ))}
      </div>

      {secao === 'cadastroProduto' && (
        <div className="form-container">
          <h2>
            <i className="fas fa-box"></i> {idEditandoProduto ? 'Editar Produto' : 'Cadastro de Produto'}
          </h2> 

          <div className="form-grid" style={{ backgroundColor: idEditandoProduto ? '#f0f7ff' : 'transparent', padding: idEditandoProduto ? '15px' : '0', borderRadius: '8px' }}>
            {[
              ['nome', 'Nome do Produto'],
              ['codigo', 'Código do Produto'],
              ['precoEntrada', 'Preço de Custo'],
              ['precoVenda', 'Preço de Venda'],
              ['quantidade', 'Quantidade'],
              ['estoqueMinimo', 'Estoque Mínimo'],
              ['categoria', 'Categoria']
            ].map(([k, l]) => (
              <div className="input-group" key={k}>
                <label>{l}:</label>
                <input
                  type={
                    k.includes('preco') ||
                    k.includes('quantidade') ||
                    k.includes('estoque')
                      ? 'number'
                      : 'text'
                  }
                  step="0.001"
                  value={produto[k] || ''}
                  onChange={(e) =>
                    setProduto({ ...produto, [k]: e.target.value })
                  }
                />
              </div>
            ))}

            <div className="input-group">
              <label>Unidade:</label>
              <select
                value={produto.unidade}
                onChange={(e) =>
                  setProduto({ ...produto, unidade: e.target.value })
                }
              >
                <option value="unidade">Unidade</option>
                <option value="quilo">Quilo (kg)</option>
                <option value="litro">Litro (L)</option>
                <option value="metro">Metro (m)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-10 mt-20">
            <button className="btn" onClick={salvarProduto}>
              <i className="fas fa-save"></i> {idEditandoProduto ? 'Atualizar Produto' : 'Cadastrar Produto'}
            </button>
            
            {idEditandoProduto && (
              <button className="btn btn-voltar" onClick={() => { setIdEditandoProduto(null); setProduto({ unidade: 'unidade', quantidade: 0, estoqueMinimo: 0 }); }}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {secao === 'gerenciarProdutos' && (
        <TabelaProdutos
          produtos={produtos}
          excluirProduto={excluirProduto}
          prepararEdicaoProduto={prepararEdicaoProduto}
        />
      )}

      {secao === 'relatorioEstoque' && (
        <div className="form-container">
          <h2>
            <i className="fas fa-clipboard-list"></i> Relatório de Estoque
          </h2>

          <TabelaEstoque produtos={produtos} />

          <h3 className="mt-20">
            Valor Total do Estoque: R$ {fmt(totalEstoque)}
          </h3>
        </div>
      )}

      {secao === 'gerenciarOperadores' && (
        <div className="form-container">
          <h2>
            <i className="fas fa-users"></i> {idEditandoOperador ? 'Editar Operador' : 'Gerenciar Operadores'}
          </h2>

          <div className="form-grid" style={{ backgroundColor: idEditandoOperador ? '#f0f7ff' : 'transparent', padding: idEditandoOperador ? '15px' : '0', borderRadius: '8px' }}>
            {[
              ['nome', 'Nome'],
              ['usuario', 'Usuário/Login'],
              ['senha', idEditandoOperador ? 'Nova Senha (Deixe em branco se não mudar)' : 'Senha'],
              ['confirmarSenha', 'Confirmar Senha']
            ].map(([k, l]) => (
              <div className="input-group" key={k}>
                <label>{l}:</label>
                <input
                  type={k.includes('senha') ? 'password' : 'text'}
                  value={operador[k] || ''}
                  onChange={(e) =>
                    setOperador({ ...operador, [k]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex gap-10 mt-20">
            <button className="btn" onClick={salvarOperador}>
              <i className={idEditandoOperador ? "fas fa-sync" : "fas fa-user-plus"}></i> {idEditandoOperador ? 'Atualizar Operador' : 'Cadastrar Operador'}
            </button>
            
            {idEditandoOperador && (
              <button className="btn btn-voltar" onClick={() => { setIdEditandoOperador(null); setOperador({}); }}>
                Cancelar
              </button>
            )}
          </div>

          <table className="mt-20">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Data Cadastro</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {operadores.map((o) => (
                <tr key={o.id}>
                  <td>{o.nome}</td>
                  <td>{o.login || o.usuario}</td>
                  <td>
                    {new Date(o.dataCadastro || o.createdAt).toLocaleDateString(
                      'pt-BR'
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-editar" 
                      onClick={() => prepararEdicaoOperador(o)}
                      style={{ padding: '5px 10px', marginRight: '8px', cursor: 'pointer', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', color: '#1e88e5' }}
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>

                    <button 
                      className="btn-vermelho" 
                      onClick={() => excluirOperador(o.id)}
                      style={{ padding: '5px 10px', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                    >
                      <i className="fas fa-trash"></i> Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {secao === 'avariaProduto' && (
        <div className="form-container">
          <h2>
            <i className="fas fa-exclamation-triangle"></i> Registrar Avaria/Perda
          </h2>

          <div className="form-grid">
            <div className="input-group">
              <label>Produto:</label>
              <select
                value={avaria.produtoId || ''}
                onChange={(e) =>
                  setAvaria({ ...avaria, produtoId: e.target.value })
                }
              >
                <option value="">Selecione</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nome} ({fmt3(p.quantidade)} {p.unidade})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Quantidade:</label>
              <input
                type="number"
                step="0.001"
                value={avaria.quantidade || ''}
                onChange={(e) =>
                  setAvaria({ ...avaria, quantidade: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <label>Motivo:</label>
              <select
                value={avaria.motivo}
                onChange={(e) =>
                  setAvaria({ ...avaria, motivo: e.target.value })
                }
              >
                <option value="vencido">Produto Vencido</option>
                <option value="danificado">Produto Danificado</option>
                <option value="quebra">Quebra/Acidente</option>
                <option value="roubo">Roubo/Furto</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="input-group">
              <label>Observação:</label>
              <textarea
                value={avaria.observacao || ''}
                onChange={(e) =>
                  setAvaria({ ...avaria, observacao: e.target.value })
                }
              />
            </div>
          </div>

          <button
            className="btn btn-vermelho mt-20"
            onClick={registrarAvaria}
          >
            Registrar Avaria
          </button>
        </div>
      )}

      {secao === 'produtosAvariados' && (
        <div className="form-container">
          <h2>
            <i className="fas fa-exclamation-triangle"></i> Histórico de Produtos Avariados
          </h2>

          <div className="produtos-avariados-lista" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {avarias.length === 0 ? (
              <p>Nenhuma avaria registrada até o momento.</p>
            ) : (
              avarias.map((a) => (
                <div 
                  className="produto-card" 
                  key={a.id} 
                  style={{ 
                    borderLeft: '5px solid #dc3545', 
                    backgroundColor: '#fff', 
                    padding: '15px', 
                    borderRadius: '6px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
                  }}
                >
                  <div className="flex justify-between items-center mb-10" style={{ borderBottom: '1px solid #f1f1f1', paddingBottom: '8px' }}>
                    <strong style={{ fontSize: '16px', color: '#333' }}>{a.produtoNome || 'Produto Não Identificado'}</strong>
                    
                    <span style={{ fontSize: '12px', color: '#777', backgroundColor: '#eee', padding: '3px 8px', borderRadius: '12px' }}>
                      <i className="far fa-calendar-alt"></i> {' '}
                      {new Date(a.data || a.createdAt || a.dataRegistro).toLocaleString('pt-BR', {
                        day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p style={{ margin: '5px 0', color: '#555' }}>
                    <strong>Qtd Avariada:</strong> {fmt3(a.quantidade)} | <strong>Motivo:</strong> <span style={{ textTransform: 'capitalize', color: '#dc3545', fontWeight: 'bold' }}>{a.motivo}</span>
                  </p>
                  
                  <p style={{ margin: '5px 0', color: '#555' }}>
                    <strong>Custo do Prejuízo:</strong> R$ {fmt(Number(a.quantidade) * Number(a.precoCusto || 0))}
                  </p>

                  <div className="mt-10" style={{ backgroundColor: '#fdf8e2', padding: '10px', borderRadius: '4px', border: '1px dashed #f5e79e' }}>
                    <strong style={{ color: '#856404', fontSize: '13px' }}>
                      <i className="far fa-comment-alt"></i> Observação:
                    </strong>
                    <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#665114', fontStyle: 'italic' }}>
                      {a.observacao || 'Nenhuma observação informada.'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {secao === 'relatorioCaixa' && <RelatorioCaixa />}

      <AssistenteIA />
    </section>
  );
}

function TabelaProdutos({ produtos, excluirProduto, prepararEdicaoProduto }) {
  return (
    <div className="form-container">
      <h2>
        <i className="fas fa-edit"></i> Gerenciar Produtos
      </h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Quantidade</th>
              <th>Preço Venda</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {produtos.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nome}</td>
                <td>
                  {fmt3(p.quantidade)} {p.unidade}
                </td>
                <td>R$ {fmt(p.precoVenda)}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn-editar" 
                    onClick={() => prepararEdicaoProduto(p)}
                    style={{ padding: '5px 10px', marginRight: '8px', cursor: 'pointer', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', color: '#1e88e5' }}
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>

                  <button
                    className="btn btn-vermelho"
                    onClick={() => excluirProduto(p.id)}
                    style={{ padding: '5px 10px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-trash"></i> Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabelaEstoque({ produtos }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Custo</th>
            <th>Venda</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td>{p.codigo}</td>
              <td>{p.nome}</td>
              <td>{p.categoria}</td>
              <td>{fmt3(p.quantidade)}</td>
              <td>{p.unidade}</td>
              <td>R$ {fmt(p.precoEntrada)}</td>
              <td>R$ {fmt(p.precoVenda)}</td>
              <td>
                R$ {fmt(Number(p.quantidade) * Number(p.precoEntrada))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatorioCaixa() {
  const [caixas, setCaixas] = useState([]);
  const [caixaDetalhado, setCaixaDetalhado] = useState(null); // Armazena o caixa clicado para exibir detalhes
  const [vendasCaixa, setVendasCaixa] = useState([]); // Armazena as vendas do caixa selecionado

  useEffect(() => {
    api.get('/caixas').then((r) => setCaixas(r.data));
  }, []);

  // 🟢 BUSCA OS DETALHES DE VENDAS DESSE CAIXA ESPECÍFICO
  async function abrirDetalhesCaixa(caixa) {
    try {
      setCaixaDetalhado(caixa);
      // Faz uma requisição buscando as vendas atreladas a esse caixaId
      const resp = await api.get(`/caixas/${caixa.id}/vendas`);
      setVendasCaixa(resp.data);
    } catch (e) {
      // Caso a rota acima ainda não esteja criada no backend, simulamos com os dados gerais do caixa
      setVendasCaixa([]);
    }
  }

  return (
    <div className="form-container">
      <h2>
        <i className="fas fa-chart-line"></i> Relatório de Caixa
      </h2>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
        <i className="fas fa-info-circle"></i> Clique em qualquer linha para ver o detalhamento completo das vendas.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data Abertura</th>
              <th>Operador</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {caixas.map((c) => (
              <tr 
                key={c.id} 
                onClick={() => abrirDetalhesCaixa(c)} 
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                className="linha-caixa-clicavel"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td>
                  {new Date(c.dataAbertura || c.createdAt).toLocaleString('pt-BR')}
                </td>
                <td>{c.operadorNome}</td>
                <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>R$ {fmt(c.total)}</td>
                <td>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: c.fechado ? '#e0e0e0' : '#e8f5e9',
                    color: c.fechado ? '#616161' : '#2e7d32',
                    fontWeight: 'bold'
                  }}>
                    {c.fechado ? 'Fechado' : 'Aberto'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🟢 MODAL FLUTUANTE DE DETALHAMENTO DE TUDO */}
      {caixaDetalhado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '25px', borderRadius: '8px',
            width: '100%', maxWIdth: '700px', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <div className="flex justify-between items-center mb-20" style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                <i className="fas fa-receipt"></i> Detalhes do Turno - Cód #{caixaDetalhado.id}
              </h3>
              <button 
                className="btn btn-vermelho" 
                onClick={() => setCaixaDetalhado(null)}
                style={{ padding: '5px 12px', borderRadius: '4px', fontSize: '14px' }}
              >
                Fechar X
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '6px' }}>
              <p style={{ margin: 0 }}><strong>Operador:</strong> {caixaDetalhado.operadorNome}</p>
              <p style={{ margin: 0 }}><strong>Status:</strong> {caixaDetalhado.fechado ? 'Fechado' : 'Aberto'}</p>
              <p style={{ margin: 0 }}><strong>Abertura:</strong> {new Date(caixaDetalhado.dataAbertura || caixaDetalhado.createdAt).toLocaleString('pt-BR')}</p>
              {caixaDetalhado.dataFechamento && (
                <p style={{ margin: 0 }}><strong>Fechamento:</strong> {new Date(caixaDetalhado.dataFechamento).toLocaleString('pt-BR')}</p>
              )}
            </div>

            <h4 className="mb-10"><i className="fas fa-shopping-cart"></i> Produtos Vendidos neste Caixa</h4>
            
            {vendasCaixa.length === 0 ? (
              <div style={{ padding: '15px', backgroundColor: '#eef2f7', borderRadius: '6px', textAlign: 'center', color: '#555' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Total faturado no turno: R$ {fmt(caixaDetalhado.total)}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#777' }}>
                  (Para ver o cupom item por item, certifique-se de que a rota de histórico do backend está ativa)
                </p>
              </div>
            ) : (
              <div className="table-container" style={{ marginTop: '10px' }}>
                <table style={{ fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f1f1' }}>
                      <th>Cód. Venda</th>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Valor Unit.</th>
                      <th>Total Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendasCaixa.map((v, idx) => (
                      <tr key={idx}>
                        <td>#{v.vendaId || v.id}</td>
                        <td>{v.produtoNome || v.nome}</td>
                        <td>{fmt3(v.quantidade)}</td>
                        <td>R$ {fmt(v.precoUnitario || v.preco)}</td>
                        <td style={{ fontWeight: 'bold' }}>R$ {fmt(Number(v.quantidade) * Number(v.precoUnitario || v.preco))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumo de Formas de Pagamento (Se houver no objeto do caixa) */}
            <div style={{ marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px', textAlign: 'right' }}>
              <h3 style={{ color: '#2e7d32', margin: 0 }}>
                Faturamento Total do Caixa: R$ {fmt(caixaDetalhado.total)}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}