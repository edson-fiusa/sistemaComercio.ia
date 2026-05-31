import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import Caixa from './pages/Caixa.jsx';
import AssistenteIA from './pages/AssistenteIA.jsx';

export default function App() {
  const [modo, setModo] = useState('login');
  const [operador, setOperador] = useState(null);
  const [caixa, setCaixa] = useState(null);
  const [toastState, setToastState] = useState(null);

  function toast(msg, tipo = 'info') {
    setToastState({ msg, tipo, id: Date.now() });
  }

  useEffect(() => {
    if (toastState) {
      const t = setTimeout(() => setToastState(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastState]);

  function sair() {
    setModo('login');
    setOperador(null);
    setCaixa(null);
  }

  return (
    <>
      <Header />

      <main className="container main-container">
        {modo === 'login' && (
          <Login
            toast={toast}
            onAdmin={() => setModo('admin')}
            onCaixa={(op, cx) => {
              setOperador(op);
              setCaixa(cx);
              setModo('caixa');
              toast(`Bem-vindo, ${op.nome}!`, 'success');
            }}
          />
        )}

        {modo === 'admin' && (
          <>
            <Admin toast={toast} onLogout={sair} />

            <div className="menu">
              <button
                type="button"
                className="menu-btn"
                onClick={() => setModo('assistenteIA')}
              >
                <i className="fas fa-robot"></i>
                <span>Assistente IA</span>
              </button>
            </div>
          </>
        )}

        {modo === 'assistenteIA' && (
          <>
            <div className="flex justify-between items-center mb-20">
              <h2>Assistente IA</h2>
              <button type="button" className="btn btn-voltar" onClick={() => setModo('admin')}>
                <i className="fas fa-arrow-left"></i>
                Voltar
              </button>
            </div>

            <AssistenteIA />
          </>
        )}

        {modo === 'caixa' && (
          <Caixa
            toast={toast}
            operador={operador}
            caixa={caixa}
            onLogout={sair}
          />
        )}
      </main>

      <Toast toast={toastState} />
    </>
  );
}