
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastMsg = {
  id: number;
  text: string;
  type: 'error' | 'success';
};

interface ToastProps {
  statusMsg: ToastMsg | null;
  setStatusMsg?: React.Dispatch<React.SetStateAction<ToastMsg | null>>;
}

const Toast: React.FC<ToastProps> = ({ statusMsg, setStatusMsg }) => {
  // State and hooks must be called unconditionally to satisfy the rules of hooks
  const [portalEl, setPortalEl] = React.useState<HTMLElement | null>(null);
  const [hiding, setHiding] = React.useState(false);

  React.useEffect(() => {
    // create or reuse a top-level toast root attached to body
    let el = document.getElementById('__toast_root') as HTMLElement | null;
    let created = false;
    let styleEl: HTMLStyleElement | null = null;
    if (!el && typeof document !== 'undefined') {
      el = document.createElement('div');
      el.id = '__toast_root';
      Object.assign(el.style, { position: 'fixed', inset: '0px', zIndex: '1100', pointerEvents: 'none' });
      document.body.appendChild(el);
      created = true;

      styleEl = document.createElement('style');
      styleEl.id = '__toast_root_style';
      // make the status container auto-sized and cap the inner toast size (larger max to allow bigger toasts)
      styleEl.textContent = `#${el.id} > [role="status"] { position: fixed !important; top: 24px !important; left: 50% !important; transform: translateX(-50%) !important; width: auto !important; display: flex !important; justify-content: center !important; pointer-events: none !important; z-index: 1100 !important; } #${el.id} > [role="status"] > div { pointer-events: auto !important; max-width: 56rem !important; width: auto !important; }`;
      document.head.appendChild(styleEl);
    } else if (el) {
      styleEl = document.getElementById('__toast_root_style') as HTMLStyleElement | null;
    }
    setPortalEl(el);

    return () => {
      if (created && el && el.parentElement) el.parentElement.removeChild(el);
      if (styleEl && styleEl.parentElement) styleEl.parentElement.removeChild(styleEl);
    };
  }, []);

  // Manage positioning and auto-dismiss in an effect that runs in the browser only
  React.useEffect(() => {
    if (typeof window === 'undefined' || !portalEl) return;
    if (!statusMsg) return;

    const root = portalEl;
    const statusEl = root.querySelector('[role="status"]') as HTMLElement | null;
    const header = document.querySelector('.retro-header') as HTMLElement | null;

    function updatePosition() {
      if (!statusEl) return;
      let topPx = 24;
      const anchor = document.querySelector('.toast-anchor') as HTMLElement | null;
      if (anchor) {
        const aRect = anchor.getBoundingClientRect();
        topPx = Math.max(aRect.bottom + 8, 24);
        statusEl.style.left = `${aRect.left + aRect.width / 2}px`;
        statusEl.style.transform = 'translateX(-50%)';
      } else if (header) {
        const rect = header.getBoundingClientRect();
        topPx = Math.max(rect.bottom + 8, 24);
        // align toast center to header center to match decorative borders
        statusEl.style.left = `${rect.left + rect.width / 2}px`;
        statusEl.style.transform = 'translateX(-50%)';
      }
      statusEl.style.position = 'fixed';
      statusEl.style.top = `${topPx}px`;
      statusEl.style.zIndex = '1100';
      statusEl.style.pointerEvents = 'none';
      statusEl.style.width = 'auto';
      statusEl.style.display = 'flex';
      statusEl.style.justifyContent = 'center';
      const inner = statusEl.querySelector('div');
      if (inner) {
        (inner as HTMLElement).style.pointerEvents = 'auto';
        (inner as HTMLElement).style.margin = '0 auto';
      }
    }

    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });

    // auto-dismiss after timeout with fade-out animation (2s -> start hide, +220ms animation)
    setHiding(false); // reset any previous hiding state
    let removeTimer: number | undefined;
    const hideStart = window.setTimeout(() => {
      setHiding(true);
      removeTimer = window.setTimeout(() => setStatusMsg?.(null), 220);
    }, 2000);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
      if (hideStart) window.clearTimeout(hideStart);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [statusMsg, portalEl, setStatusMsg]);

  // mild dev styling: show a subtle solid accent line on top in DEV (no dashed outline)
  const devStyle: React.CSSProperties = import.meta.env.DEV ? { borderTop: '3px solid rgba(255,204,51,0.95)', borderRadius: 8 } : {};

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!statusMsg) return null;
  if (!portalEl) return null;

  const msg = statusMsg;
  const isError = msg.type === 'error';

  const bg = isError ? 'linear-gradient(180deg, rgba(40,10,10,0.98), rgba(20,8,8,0.95))' : 'linear-gradient(180deg, rgba(30,25,6,0.98), rgba(20,18,6,0.95))';
  const border = isError ? 'rgba(180,60,60,0.15)' : 'rgba(200,140,0,0.12)';
  const textColor = '#FFF';

  return createPortal(
    <div role="status" aria-live="polite" style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', width: 'auto', display: 'flex', justifyContent: 'center', padding: '0 1rem', zIndex: 1100, ...devStyle }}>
      <div
        key={msg.id}
        // entire toast is clickable and keyboard-accessible
        role="button"
        tabIndex={0}
        onClick={() => setStatusMsg?.(null)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setStatusMsg?.(null); e.preventDefault(); } }}
        className={`pointer-events-auto flex items-center gap-4 px-10 py-6 rounded-xl border shadow-2xl max-w-3xl w-auto${hiding ? ' toast-hide' : ''}`} 
        style={{
          background: bg,
          border: `1px solid ${border}`,
          color: textColor,
          boxShadow: '0 16px 60px rgba(0,0,0,0.6)',
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'transform 220ms ease, opacity 220ms ease',
          cursor: 'pointer'
        }}
      >
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', height: '100%' }}>
          {isError ? <AlertCircle size={24} color="rgba(255,140,120,0.95)" /> : <CheckCircle2 size={24} color="rgba(255,220,130,0.95)" />}
        </div>
        <div style={{ flex: '1 1 auto', textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.6 }}>{msg.text}</div>
        </div>
      </div>

      <style>{`
        @keyframes slideInDown {
          from { transform: translateY(-8px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
        .toast-hide { transform: translateY(-8px); opacity: 0 }
      `}</style>
    </div>,
    portalEl
  );
};

export default Toast;
