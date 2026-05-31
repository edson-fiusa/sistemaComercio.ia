export default function PixModal({ pix, onCancelar }) {
  if (!pix) return null;
  async function copiar() {
    await navigator.clipboard.writeText(pix.qr_code || '');
  }
  return <div className="modal show-modal pix-modal">
    <div className="modal-content pix-content">
      <h3><i className="fas fa-qrcode"></i> Pagamento PIX</h3>
      <p>Escaneie o QR Code ou copie o código PIX</p>
      {pix.qr_code_base64 && <img className="pix-qr-img" src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code PIX" />}
      <label>Copia e Cola:</label>
      <div className="pix-copy"><input value={pix.qr_code || ''} readOnly /><button type="button" onClick={copiar}><i className="fas fa-copy"></i></button></div>
      <div className={`pix-status-msg ${pix.status === 'approved' ? 'pix-ok' : ''}`}>{pix.status === 'approved' ? '✅ Pagamento aprovado!' : '⏳ Aguardando pagamento...'}</div>
      <button type="button" className="btn btn-vermelho" onClick={onCancelar}>Cancelar</button>
    </div>
  </div>;
}
