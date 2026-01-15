
import { CheckCircle2, AlertCircle } from 'lucide-react';
import React from 'react';

export type ToastMsg = {
  id: number;
  text: string;
  type: 'error' | 'success';
};

interface ToastProps {
  statusMsg: ToastMsg[];
}

const Toast: React.FC<ToastProps> = ({ statusMsg }) => {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100001] pointer-events-none flex flex-col items-center gap-2">
      {statusMsg.map((msg) => {
        const isError = msg.type === 'error';
        return (
          <div
            key={msg.id}
            className={`
              flex items-center gap-3 px-6 py-3.5 rounded-2xl border
              smart-glass shadow-2xl pointer-events-auto
              w-max max-w-[90vw] whitespace-nowrap
              transition-all duration-300 ease-out
              ${isError
                ? 'border-red-500/30 text-red-500 shadow-red-500/10'
                : 'border-[rgb(var(--theme-primary))]/30 text-[rgb(var(--theme-primary))] shadow-[var(--theme-primary-glow)]'
              }
            `}
            style={{
              animation: 'slideInDown 0.3s ease-out',
              transform: `translateY(0)`,
              opacity: 1
            }}
          >
            <div className="flex-shrink-0">
              {isError ? (
                <AlertCircle size={18} className="animate-pulse" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider">
              {msg.text}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
