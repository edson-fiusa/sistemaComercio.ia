import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export default function AssistenteIA() {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false); // 🟢 Estado para controlar a gravação de voz

  // 1. Criação da referência para a ancoragem do scroll
  const finalDasMensagensRef = useRef(null);

  // 2. Efeito que monitora as mensagens e joga o scroll para baixo automaticamente
  useEffect(() => {
    if (finalDasMensagensRef.current) {
      finalDasMensagensRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, carregando]);

  // 🟢 FUNÇÃO CENTRALIZADA DE ENVIO (AGORA COM SÍNTESE DE VOZ NATIVA)
  async function executarEnvio(textoParaEnviar) {
    const texto = textoParaEnviar || pergunta;
    if (!texto.trim()) return;

    setPergunta('');
    setMensagens((m) => [...m, { tipo: 'user', texto }]);
    setCarregando(true);

    try {
      const { data } = await api.post('/ia/vendas', { pergunta: texto });
      
      // Guarda a resposta no chat para aparecer na tela
      setMensagens((m) => [...m, { tipo: 'bot', texto: data.resposta }]);

      // 🔊 MÁGICA DA FALA: Faz o computador ler a resposta da IA em voz alta
      if ('speechSynthesis' in window) {
        // Cancela qualquer fala que esteja rolando antes para não encavalar o áudio
        window.speechSynthesis.cancel();

        // Remove caracteres especiais ou emojis para a leitura ficar mais natural
        const textoLimpo = data.resposta.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');

        const mensagemVoz = new SpeechSynthesisUtterance(textoLimpo);
        mensagemVoz.lang = 'pt-BR'; // Configura a voz para Português do Brasil
        mensagemVoz.rate = 1.1;     // Velocidade da fala (1.0 é normal, 1.1 é levemente mais rápido e dinâmico)
        mensagemVoz.pitch = 1.0;    // Tom da voz

        // Tenta selecionar uma voz em português nativa do sistema (Google, Microsoft Maria, etc.)
        const vozes = window.speechSynthesis.getVoices();
        const vozPt = vozes.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
        if (vozPt) mensagemVoz.voice = vozPt;

        // Executa a fala
        window.speechSynthesis.speak(mensagemVoz);
      }

    } catch {
      setMensagens((m) => [...m, { tipo: 'bot', texto: 'Erro ao consultar IA.' }]);
      
      // Fala o aviso de erro também
      if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance('Erro ao consultar a inteligência artificial.'));
      }
    }

    setCarregando(false);
  }

  async function enviar() {
    await executarEnvio();
  }

  // 🟢 4. FUNÇÃO NATIVA DE RECONHECIMENTO DE FALA (WEB SPEECH API)
  function escutarVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador ou ambiente desktop não suporta comandos por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; // Escuta em Português do Brasil
    recognition.interimResults = false; // Aguarda a frase terminar completa

    recognition.onstart = () => {
      setGravando(true);
    };

    recognition.onend = () => {
      setGravando(false);
    };

    recognition.onerror = (event) => {
      console.error("Erro no microfone:", event.error);
      setGravando(false);
    };

    // Acionado quando o sistema termina de decodificar a sua voz em texto
    recognition.onresult = (event) => {
      const textoConvertido = event.results[0][0].transcript;
      if (textoConvertido && textoConvertido.trim() !== '') {
        // Envia direto para a IA o que você acabou de falar!
        executarEnvio(textoConvertido);
      }
    };

    // Inicia a captura pelo microfone
    recognition.start();
  }

  return (
    <>
      {/* Botão flutuante que você usa para abrir o chat */}
      {!aberto && (
        <button className="chatia-botao" onClick={() => setAberto(true)}>
          <i className="fas fa-robot"></i>
        </button>
      )}

      {/* Janela do chat aberta com condicional unificada */}
      {aberto && (
        <div className="chatia-janela">
          <div className="chatia-topo">
            <div>
              <strong>Assistente IA</strong>
              <span>Relatórios de vendas</span>
            </div>

            {/* 🟢 BOTÕES: Parar áudio e Fechar Chat organizados */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              
              {/* Botão para Mutar/Parar a voz na mesma hora */}
              <button 
                type="button"
                onClick={() => window.speechSynthesis.cancel()} 
                style={{ 
                  background: 'none', border: 'none', color: '#fff', 
                  cursor: 'pointer', fontSize: '16px', padding: '5px' 
                }}
                title="Silenciar voz"
              >
                <i className="fas fa-volume-mute"></i>
              </button>

              {/* Botão de fechar (Agora limpa a voz ao fechar o chat) */}
              <button 
                type="button"
                onClick={() => { 
                  window.speechSynthesis.cancel(); // 🌟 Para a voz imediatamente ao fechar
                  setAberto(false); 
                }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Caixa de mensagens (Corpo do Chat corrigido) */}
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

            {/* 3. A ÂNCORA INVISÍVEL colocada estrategicamente dentro do final do corpo */}
            <div ref={finalDasMensagensRef} />
          </div>

          {/* Rodapé do chat atualizado com o botão de microfone */}
          <div className="chatia-rodape" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar()}
              placeholder={gravando ? "Ouvindo sua voz..." : "Pergunte ou clique no microfone..."}
              disabled={gravando}
              style={{ flex: 1 }}
            />

            {/* 🟢 BOTÃO DO MICROFONE INJETADO */}
            <button 
              type="button"
              onClick={escutarVoz}
              style={{
                backgroundColor: gravando ? '#dc3545' : '#e3f2fd',
                color: gravando ? '#fff' : '#1e88e5',
                border: gravando ? 'none' : '1px solid #2196f3',
                borderRadius: '4px',
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
              className={gravando ? "microfone-gravando" : ""}
              title="Falar por voz"
            >
              <i className={gravando ? "fas fa-microphone-flash" : "fas fa-microphone"}></i>
            </button>

            <button onClick={enviar} disabled={gravando}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}