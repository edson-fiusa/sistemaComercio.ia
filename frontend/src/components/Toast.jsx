export default function Toast({ toast }) {
  if (!toast) return null;
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  return <div id="toastContainer"><div className={`toast toast-${toast.tipo || 'info'}`}>{icons[toast.tipo] || 'ℹ️'} {toast.msg}</div></div>;
}
