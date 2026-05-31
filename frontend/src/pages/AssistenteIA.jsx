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
    setMensagens(prev => [...prev, { tipo: 'usuario', texto }]);
    setCarregando(true);

    try {
      const { data } = await api.post('/ia/vendas', {
        pergunta: texto
      });

      setMensagens(prev => [
        ...prev,
        { tipo: 'ia', texto: data.resposta || 'Sem resposta da IA.' }
      ]);
    } catch (error) {
      setMensagens(prev => [
        ...prev,
        { tipo: 'ia', texto: 'Erro ao consultar IA.' }
      ]);
    }

    setCarregando(false);
  }

  return (
    <>
      <button
        type="button"
        className="ia-float-btn"
        onClick={() => setAberto(true)}
      >
        <i className="fas fa-robot"></i>
      </button>

      {aberto && (
        <div className="ia-chat-box">
          <div className="ia-chat-header">
            <strong>
              <i className="fas fa-robot"></i> Assistente IA
            </strong>

            <button
              type="button"
              onClick={() => setAberto(false)}
            >
              ×
            </button>
          </div>

          <div className="ia-chat-body">
            {mensagens.length === 0 && (
              <div className="ia-empty">
                <p>Pergunte sobre suas vendas.</p>
                <small>Ex: Quanto vendi hoje?</small>
              </div>
            )}

            {mensagens.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.tipo === 'usuario'
                    ? 'ia-msg usuario'
                    : 'ia-msg bot'
                }
              >
                {msg.texto}
              </div>
            ))}

            {carregando && (
              <div className="ia-msg bot">
                Consultando...
              </div>
            )}
          </div>

          <div className="ia-chat-footer">
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarPergunta()}
              placeholder="Pergunte sobre vendas..."
            />

            <button
              type="button"
              onClick={enviarPergunta}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}