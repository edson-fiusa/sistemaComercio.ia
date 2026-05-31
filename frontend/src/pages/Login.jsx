import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Login({ onAdmin, onCaixa }) {
  const [screen, setScreen] = useState('main');
  const [adminSenha, setAdminSenha] = useState('');
  const [operadores, setOperadores] = useState([]);
  const [operadorId, setOperadorId] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/operadores')
      .then((r) => setOperadores(r.data))
      .catch(() => {});
  }, []);

  function tratarErro(e) {
    if (e.code === 'ECONNABORTED') {
      setErro('Servidor demorou para responder. Tente novamente.');
    } else if (e.message === 'Network Error') {
      setErro('Servidor acordando ou sem conexão. Aguarde alguns segundos e tente novamente.');
    } else {
      setErro(e.response?.data?.erro || e.message);
    }
  }

  async function loginAdmin() {
    setErro('');

    try {
      await api.post('/auth/admin', { senha: adminSenha });
      setAdminSenha('');
      onAdmin();
    } catch (e) {
      tratarErro(e);
    }
  }

  async function loginCaixa() {
    setErro('');

    try {
      const op = (await api.post('/auth/caixa', {
        operadorId,
        senha
      })).data;

      const cx = (await api.post('/caixas/abrir', {
        operadorId: op.id,
        saldoInicial: 0
      })).data;

      setOperadorId('');
      setSenha('');

      onCaixa(op, {
        id: cx.caixaId,
        operadorId: op.id,
        operadorNome: op.nome
      });
    } catch (e) {
      tratarErro(e);
    }
  }

  if (screen === 'admin') {
    return (
      <section className="admin-login">
        <div className="login-box">
          <h2>Acesso Administrador</h2>

          <div className={`error-message ${erro ? 'show' : ''}`}>
            {erro}
          </div>

          <div className="input-group">
            <label>Senha:</label>
            <input
              type="password"
              value={adminSenha}
              onChange={(e) => setAdminSenha(e.target.value)}
              placeholder="Digite a senha de administrador"
            />
          </div>

          <button className="btn" onClick={loginAdmin}>
            <i className="fas fa-sign-in-alt"></i> Entrar
          </button>

          <button
            className="btn btn-voltar"
            onClick={() => {
              setScreen('main');
              setErro('');
            }}
          >
            <i className="fas fa-arrow-left"></i> Voltar
          </button>
        </div>
      </section>
    );
  }

  if (screen === 'caixa') {
    return (
      <section className="admin-login">
        <div className="login-box">
          <h2>Acesso Caixa</h2>

          <div className={`error-message ${erro ? 'show' : ''}`}>
            {erro}
          </div>

          <div className="input-group">
            <label>Operador:</label>
            <select
              value={operadorId}
              onChange={(e) => setOperadorId(e.target.value)}
            >
              <option value="">Selecione um operador</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome} ({o.usuario})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Senha:</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          <button className="btn" onClick={loginCaixa}>
            <i className="fas fa-cash-register"></i> Abrir Caixa
          </button>

          <button
            className="btn btn-voltar"
            onClick={() => {
              setScreen('main');
              setErro('');
            }}
          >
            <i className="fas fa-arrow-left"></i> Voltar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="login-container">
      <div className="login-box">
        <h2>Selecione o Modo</h2>

        <div className="menu">
          <button
            type="button"
            className="menu-btn"
            onClick={() => setScreen('admin')}
          >
            <i className="fas fa-user-shield"></i>
            <span>Modo Administrador</span>
          </button>

          <button
            type="button"
            className="menu-btn"
            onClick={() => setScreen('caixa')}
          >
            <i className="fas fa-cash-register"></i>
            <span>Caixa PDV</span>
          </button>
        </div>
      </div>
    </section>
  );
}