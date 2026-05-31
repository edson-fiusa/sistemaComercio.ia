import { useState } from 'react';
import { api } from '../services/api';

export default function AssistenteIA() {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);

  async function enviarPergunta() {
    if (!pergunta.trim()) return;

    const texto = pergunta;
    setPergunta('');
    setMensagens(prev => [...prev, { tipo: 'user', texto }]);
    setCarregando(true);

    try {
      const { data } = await api.post('/ia/vendas', { pergunta: texto });

      setMensagens(prev => [
        ...prev,
        { tipo: 'bot', texto: data.resposta || 'Não encontrei resposta.' }
      ]);
    } catch {
      setMensagens(prev => [
        ...prev,
        { tipo: 'bot', texto: 'Erro ao consultar a IA.' }
      ]);
    }

    setCarregando(false);
  }

  return (
    <>
      <button className="ia-float" onClick={() => setAberto(true)}>
        <i className="fas fa-robot"></i>
      </button>

      {aberto && (
        <div className="ia-window">
          <div className="ia-header">
            <div>
              <strong>Assistente IA</strong>
              <span>Relatórios de vendas</span>
            </div>
            <button onClick={() => setAberto(false)}>×</button>
          </div>

          <div className="ia-body">
            {mensagens.length === 0 && (
              <div className="ia-welcome">
                <i className="fas fa-chart-line"></i>
                <h3>Olá, posso ajudar?</h3>
                <p>Pergunte sobre vendas, caixa, PIX ou resumo financeiro.</p>
              </div>
            )}

            {mensagens.map((m, i) => (
              <div key={i} className={`ia-message ${m.tipo}`}>
                {m.texto}
              </div>
            ))}

            {carregando && (
              <div className="ia-message bot">Analisando vendas...</div>
            )}
          </div>

          <div className="ia-footer">
            <input
              value={pergunta}
              onChange={e => setPergunta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviarPergunta()}
              placeholder="Ex: quanto vendi hoje?"
            />
            <button onClick={enviarPergunta}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}