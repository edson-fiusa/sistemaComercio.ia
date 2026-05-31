import { useEffect, useMemo, useState } from 'react';
import { api, fmt, fmt3 } from '../services/api';
import PixModal from '../components/PixModal';

const STATUS_FINAIS_ERRO = ['cancelled', 'rejected', 'refunded', 'charged_back'];

export default function Caixa({ operador, caixa, onLogout, toast }) {
  const [busca, setBusca] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState(null);
  const [valorPago, setValorPago] = useState('');
  const [pix, setPix] = useState(null);
  const [cupom, setCupom] = useState(null);

  useEffect(() => { carregarProdutos(); }, []);
  async function carregarProdutos(){ setProdutos((await api.get('/produtos')).data); }

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    if (!t) return [];
    return produtos.filter(p => p.ativo !== false && Number(p.quantidade) > 0 && (`${p.nome} ${p.codigo} ${p.categoria}`.toLowerCase().includes(t)));
  }, [busca, produtos]);
  const total = carrinho.reduce((s,i)=>s+i.preco*i.quantidade,0);
  const troco = Math.max(Number(valorPago || 0) - total, 0);

  function adicionar(produto, qtd) {
    qtd = Number(qtd || 1);
    if (qtd <= 0) return toast('Quantidade inválida.','warning');
    const existente = carrinho.find(i => i.produtoId === produto.id);
    const qtdTotal = (existente?.quantidade || 0) + qtd;
    if (qtdTotal > Number(produto.quantidade)) return toast('Estoque insuficiente.','warning');
    if (existente) setCarrinho(carrinho.map(i=>i.produtoId===produto.id ? {...i, quantidade:qtdTotal}:i));
    else setCarrinho([...carrinho,{ produtoId:produto.id, nome:produto.nome, preco:Number(produto.precoVenda), unidade:produto.unidade, quantidade:qtd }]);
    toast(`${produto.nome} adicionado!`,'success');
  }

  async function finalizarVenda(forma = pagamento, mercadoPagoId = null) {
    const body = { caixaId: caixa.id, formaPagamento: forma, valorPago: Number(valorPago||0), mercadoPagoId, itens: carrinho.map(i=>({ produtoId:i.produtoId, quantidade:i.quantidade })) };
    const res = (await api.post('/vendas', body)).data;
    setCupom({ total: res.total, troco: res.troco, formaPagamento: forma, operadorNome: operador.nome, data: new Date(), itens: carrinho });
    setCarrinho([]); setPagamento(null); setValorPago(''); setPix(null); await carregarProdutos();
    toast('Venda realizada com sucesso!','success');
  }

  async function concluir() {
    if (!pagamento) return toast('Selecione uma forma de pagamento.','warning');
    if (carrinho.length === 0) return toast('Carrinho vazio.','warning');
    try {
      if (pagamento === 'dinheiro' && Number(valorPago) < total) return toast('Valor recebido menor que o total.','warning');
      if (pagamento === 'pix') {
        const dados = (await api.post('/pagamentos/pix', { valor: total, descricao:'Venda PDV', nome:'Cliente', email:'cliente@email.com', caixaId: caixa.id })).data;
        setPix(dados);
        const intervalId = setInterval(async () => {
          try {
            const consulta = (await api.get(`/pagamentos/${dados.mercadoPagoId}`)).data;
            if (consulta.status === 'approved') {
              clearInterval(intervalId);
              setPix(p => ({ ...p, status:'approved' }));
              await finalizarVenda('pix', dados.mercadoPagoId);
            }
            if (STATUS_FINAIS_ERRO.includes(consulta.status)) {
              clearInterval(intervalId); setPix(null); toast(`PIX inválido: ${consulta.status}`,'error');
            }
          } catch {}
        }, 3000);
        return;
      }
      await finalizarVenda(pagamento);
    } catch (e) { toast(e.response?.data?.erro || e.message, 'error'); }
  }

  async function encerrarCaixa() {
    if (pix) return toast('Conclua ou cancele o PIX antes de encerrar o caixa.','warning');
    if (carrinho.length && !confirm('Há itens no carrinho. Deseja encerrar?')) return;
    await api.put(`/caixas/${caixa.id}/fechar`, { saldoFinal: 0 });
    toast('Caixa encerrado com sucesso!','success'); onLogout();
  }

  return <section id="caixaMode"><div className="pdv-container"><div className="pdv-header"><div><h2>Caixa PDV</h2><div><strong>Operador:</strong> {operador.nome}</div><div className="status-caixa status-aberto">Aberto</div></div><button className="btn btn-voltar" onClick={encerrarCaixa}><i className="fas fa-power-off"></i> Encerrar Caixa</button></div><div className="pdv-main"><div className="produtos-section"><h3>Produtos Disponíveis</h3><div className="input-group"><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome ou código do produto..." /></div><div className="mt-20">{!busca && <Empty icon="search" text="Digite o nome ou código do produto para buscar"/>}{busca && filtrados.length===0 && <Empty icon="search" text={`Nenhum produto encontrado para "${busca}"`}/>} {filtrados.map(p=><ProdutoCard key={p.id} produto={p} adicionar={adicionar}/>)}</div></div><div className="carrinho-section"><div className="flex justify-between items-center mb-10"><h3>Carrinho de Compras</h3><div className="carrinho-total-small">Total: R$ {fmt(total)}</div></div><div className="carrinho-items">{carrinho.length===0 ? <Empty icon="shopping-cart" text="Carrinho vazio"/> : carrinho.map((i,idx)=><div className="carrinho-item" key={i.produtoId}><div className="carrinho-item-header"><strong>{i.nome}</strong><strong>R$ {fmt(i.preco*i.quantidade)}</strong></div><div className="carrinho-item-detalhes"><span>{fmt3(i.quantidade)} {i.unidade} × R$ {fmt(i.preco)}</span><button className="btn btn-vermelho btn-small" onClick={()=>setCarrinho(carrinho.filter((_,x)=>x!==idx))}><i className="fas fa-trash"></i></button></div></div>)}</div>{!pagamento && <div className="carrinho-footer"><div className="carrinho-total">Total: R$ {fmt(total)}</div><div className="flex gap-10 mt-10"><button className="btn w-100" disabled={!carrinho.length} onClick={()=>setCarrinho([])}><i className="fas fa-times"></i> Cancelar Compra</button><button className="btn w-100" disabled={!carrinho.length} onClick={()=>setPagamento('dinheiro')}><i className="fas fa-check-circle"></i> Finalizar Venda</button></div></div>}{pagamento && <div className="mt-20"><h4>Forma de Pagamento</h4><div className="formas-pagamento-grid">{['dinheiro','pix'].map(tipo=><button key={tipo} className={`forma-pagamento-btn ${pagamento===tipo?'active':''}`} onClick={()=>setPagamento(tipo)}><i className={tipo==='dinheiro'?'fas fa-credit-card':'fas fa-qrcode'}></i><span>{tipo.toUpperCase()}</span></button>)}</div>{pagamento==='dinheiro' && <div className="mt-20"><div className="input-group"><label>Valor Recebido (R$):</label><input type="number" step="0.01" value={valorPago} onChange={e=>setValorPago(e.target.value)}/></div><div className="troco-display">Troco: R$ {fmt(troco)}</div></div>}<div className="flex gap-10 mt-20"><button className="btn btn-voltar w-100" onClick={()=>setPagamento(null)}>Voltar</button><button className="btn w-100" onClick={concluir}><i className="fas fa-check"></i> Concluir Venda</button></div></div>}</div></div></div><PixModal pix={pix} onCancelar={()=>setPix(null)}/>{cupom && <Cupom venda={cupom} fechar={()=>setCupom(null)}/>}</section>;
}
function Empty({icon,text}){return <div className="empty-state"><i className={`fas fa-${icon}`}></i><p>{text}</p></div>}
function ProdutoCard({produto, adicionar}){const [qtd,setQtd]=useState(1);return <div className="produto-card"><div className="flex justify-between"><div><strong>{produto.nome}</strong><p>Código: {produto.codigo}</p><p>Estoque: {fmt3(produto.quantidade)} {produto.unidade}</p></div><div><div className="preco">R$ {fmt(produto.precoVenda)}</div><small>por {produto.unidade}</small></div></div><div className="produto-quantidade-controles"><button className="quantidade-btn" onClick={()=>setQtd(Math.max(0.001,Number(qtd)-1))}>-</button><input className="quantidade-input" type="number" step="0.001" value={qtd} onChange={e=>setQtd(e.target.value)}/><button className="quantidade-btn" onClick={()=>setQtd(Number(qtd)+1)}>+</button><button className="btn" onClick={()=>adicionar(produto,qtd)}><i className="fas fa-plus"></i> Adicionar</button></div></div>}
function Cupom({venda,fechar}){return <div className="modal show-modal"><div className="modal-content"><div className="cupom"><div className="cupom-header"><h3>ESTOQUE MESTRE</h3><p>CUPOM FISCAL</p><div>Data: {new Date(venda.data).toLocaleString('pt-BR')}</div><div>Operador: {venda.operadorNome}</div></div>{venda.itens.map(i=><div className="cupom-item" key={i.produtoId}><span>{i.nome} {fmt3(i.quantidade)} × {fmt(i.preco)}</span><span>{fmt(i.preco*i.quantidade)}</span></div>)}<div className="cupom-item"><span>TOTAL:</span><span>R$ {fmt(venda.total)}</span></div><p>Pagamento: {venda.formaPagamento.toUpperCase()}</p>{venda.troco>0 && <p>Troco: R$ {fmt(venda.troco)}</p>}<div className="text-center mt-20"><p>********************************</p><p>*** OBRIGADO VOLTE SEMPRE ***</p><p>********************************</p></div></div><button className="btn w-100 mt-20" onClick={fechar}>Fechar</button></div></div>}
