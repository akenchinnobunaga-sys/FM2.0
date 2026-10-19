import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DownloadCloud, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'full' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Si ya está ejecutándose como PWA instalada, no mostramos el botón
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Si el navegador de escritorio aún no emitió prompt nativo o ya pasó
      setShowIOSGuide(true);
    }
  };

  // Render para barra lateral
  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition shadow-sm"
          title="Instalar aplicación en tu dispositivo móvil o PC"
        >
          <div className="flex items-center gap-2.5">
            <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Instalar My Finance</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-600 text-white uppercase">
            PWA
          </span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Render para botón compacto en Navbar
  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 cursor-pointer"
        title="Instalar My Finance como aplicación en tu pantalla principal"
      >
        <DownloadCloud className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Instalar My Finance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aplicación Web Progresiva (PWA)
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              Para instalar en tu iPhone o iPad (Safari):
            </p>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <Share2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>
                1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <PlusSquare className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>
                2. Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              Para instalar en Chrome, Edge o Android:
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 leading-relaxed">
              Haz clic en el menú del navegador (<strong>⋮</strong> o icono de instalación en la barra de URL) y selecciona <strong>"Instalar My Finance"</strong> o <strong>"Agregar a pantalla principal"</strong>.
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
