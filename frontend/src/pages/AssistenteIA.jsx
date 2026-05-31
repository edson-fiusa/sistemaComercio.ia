import { useState } from 'react';
import { api } from '../services/api';

export default function AssistenteIA() {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!pergunta.trim()) return;

    const texto = pergunta;
    setPergunta('');
    setMensagens((m) => [...m, { tipo: 'user', texto }]);
    setCarregando(true);

    try {
      const { data } = await api.post('/ia/vendas', { pergunta: texto });
      setMensagens((m) => [...m, { tipo: 'bot', texto: data.resposta }]);
    } catch {
      setMensagens((m) => [...m, { tipo: 'bot', texto: 'Erro ao consultar IA.' }]);
    }

    setCarregando(false);
  }

  return (
    <>
      {!aberto && (
        <button className="chatia-botao" onClick={() => setAberto(true)}>
          <i className="fas fa-robot"></i>
        </button>
      )}

      {aberto && (
        <div className="chatia-janela">
          <div className="chatia-topo">
            <div>
              <strong>Assistente IA</strong>
              <span>Relatórios de vendas</span>
            </div>

            <button onClick={() => setAberto(false)}>×</button>
          </div>

          <div className="chatia-corpo">
            {mensagens.length === 0 && (
              <div className="chatia-vazio">
                <i className="fas fa-chart-line"></i>
                <h3>Olá! Faça uma pergunta</h3>
                <p>Ex: quanto vendi hoje?</p>
              </div>
            )}

            {mensagens.map((msg, i) => (
              <div key={i} className={`chatia-msg ${msg.tipo}`}>
                {msg.texto}
              </div>
            ))}

            {carregando && (
              <div className="chatia-msg bot">
                Analisando vendas...
              </div>
            )}
          </div>

          <div className="chatia-rodape">
            <input
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar()}
              placeholder="Pergunte sobre vendas..."
            />

            <button onClick={enviar}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}