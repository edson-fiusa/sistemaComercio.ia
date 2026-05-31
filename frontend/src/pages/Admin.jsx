import { useEffect, useState } from 'react';
import { api, fmt, fmt3 } from '../services/api';
import AssistenteIA from './AssistenteIA';

const secoes = [
  ['cadastroProduto', 'fas fa-box', 'Cadastrar Produto'],
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
  const [produto, setProduto] = useState({
    unidade: 'unidade',
    quantidade: 0,
    estoqueMinimo: 0
  });
  const [operador, setOperador] = useState({});
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

  async function cadastrarProduto() {
    try {
      await api.post('/produtos', produto);

      setProduto({
        unidade: 'unidade',
        quantidade: 0,
        estoqueMinimo: 0
      });

      toast('Produto cadastrado!', 'success');
      carregar();
    } catch (e) {
      toast(e.response?.data?.erro || e.message, 'error');
    }
  }

  async function excluirProduto(id) {
    if (!confirm('Deseja excluir este produto?')) return;

    await api.delete(`/produtos/${id}`);
    toast('Produto excluído!', 'success');
    carregar();
  }

  async function cadastrarOperador() {
    if (operador.senha !== operador.confirmarSenha) {
      return toast('As senhas não conferem.', 'warning');
    }

    try {
      await api.post('/operadores', operador);
      setOperador({});
      toast('Operador cadastrado!', 'success');
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
            className="menu-btn"
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
            <i className="fas fa-box"></i> Cadastro de Produto
          </h2>

          <div className="form-grid">
            {[
              ['nome', 'Nome do Produto'],
              ['codigo', 'Código do Produto'],
              ['precoEntrada', 'Preço de Custo'],
              ['precoVenda', 'Preço de Venda'],
              ['quantidade', 'Quantidade Inicial'],
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

          <button className="btn mt-20" onClick={cadastrarProduto}>
            <i className="fas fa-save"></i> Cadastrar Produto
          </button>
        </div>
      )}

      {secao === 'gerenciarProdutos' && (
        <TabelaProdutos
          produtos={produtos}
          excluirProduto={excluirProduto}
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
            <i className="fas fa-users"></i> Gerenciar Operadores
          </h2>

          <div className="form-grid">
            {[
              ['nome', 'Nome'],
              ['usuario', 'Usuário'],
              ['senha', 'Senha'],
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

          <button className="btn mt-20" onClick={cadastrarOperador}>
            <i className="fas fa-user-plus"></i> Cadastrar Operador
          </button>

          <table className="mt-20">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Data Cadastro</th>
              </tr>
            </thead>

            <tbody>
              {operadores.map((o) => (
                <tr key={o.id}>
                  <td>{o.nome}</td>
                  <td>{o.usuario}</td>
                  <td>
                    {new Date(o.dataCadastro || o.createdAt).toLocaleDateString(
                      'pt-BR'
                    )}
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
          <h2>Produtos Avariados</h2>

          {avarias.map((a) => (
            <div className="produto-card" key={a.id}>
              <strong>{a.produtoNome}</strong>
              <p>
                Qtd: {fmt3(a.quantidade)} | Motivo: {a.motivo} | Valor: R${' '}
                {fmt(a.precoCusto)}
              </p>
            </div>
          ))}
        </div>
      )}

      {secao === 'relatorioCaixa' && <RelatorioCaixa />}

      <AssistenteIA />
    </section>
  );
}

function TabelaProdutos({ produtos, excluirProduto }) {
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
              <th>Ações</th>
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
                <td>
                  <button
                    className="btn btn-vermelho"
                    onClick={() => excluirProduto(p.id)}
                  >
                    <i className="fas fa-trash"></i>
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

  useEffect(() => {
    api.get('/caixas').then((r) => setCaixas(r.data));
  }, []);

  return (
    <div className="form-container">
      <h2>
        <i className="fas fa-chart-line"></i> Relatório de Caixa
      </h2>

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
              <tr key={c.id}>
                <td>
                  {new Date(c.dataAbertura || c.createdAt).toLocaleString(
                    'pt-BR'
                  )}
                </td>
                <td>{c.operadorNome}</td>
                <td>R$ {fmt(c.total)}</td>
                <td>{c.fechado ? 'Fechado' : 'Aberto'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}