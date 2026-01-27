
import React from 'react';

interface ApkGuideModalProps {
  onClose: () => void;
  darkMode: boolean;
  appUrl: string;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ onClose, darkMode, appUrl }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-white text-zinc-900'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-[#1A9B9F]">GERAR APK - MERAKI 3D</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* Opção 1 */}
          <section className="p-5 rounded-2xl border border-[#1A9B9F]/20 bg-[#1A9B9F]/5">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#1A9B9F] text-white flex items-center justify-center text-xs">1</span>
              Via PWABuilder (Profissional)
            </h3>
            <p className="text-sm opacity-70 mb-4">Ideal para publicar na Google Play Store com alta performance.</p>
            <ol className="text-sm space-y-2 list-decimal list-inside opacity-80">
              <li>Hospede este código (Vercel/GitHub).</li>
              <li>Copie sua URL: <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">{appUrl}</code></li>
              <li>Acesse <a href="https://www.pwabuilder.com" target="_blank" className="text-[#1A9B9F] underline font-bold">pwabuilder.com</a></li>
              <li>Cole a URL e gere o pacote Android.</li>
            </ol>
          </section>

          {/* Opção 2 */}
          <section className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-zinc-500 text-white flex items-center justify-center text-xs">2</span>
              Via MIT App Inventor (Simples)
            </h3>
            <p className="text-sm opacity-70 mb-4">Crie um instalador APK básico sem precisar de hospedagem complexa.</p>
            <div className="space-y-4 text-sm opacity-80">
              <div className="flex gap-3">
                <div className="font-bold text-[#1A9B9F]">A.</div>
                <div>Crie um novo projeto no <a href="http://ai2.appinventor.mit.edu" target="_blank" className="underline font-bold">MIT App Inventor</a>.</div>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-[#1A9B9F]">B.</div>
                <div>Arraste o componente <b>Web_Viewer</b> para o centro do celular.</div>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-[#1A9B9F]">C.</div>
                <div>Em <b>HomeUrl</b>, cole o link do seu sistema.</div>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-[#1A9B9F]">D.</div>
                <div>Vá em <b>Build</b> {'>'} <b>Android App (.apk)</b>.</div>
              </div>
            </div>
          </section>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
            <strong>Nota técnica:</strong> Como o app Meraki 3D usa <b>IndexedDB</b> para o banco de dados, os dados salvos no APK do MIT App Inventor ficarão isolados do navegador Chrome. Recomendamos usar o PWA (instalação via navegador) para maior compatibilidade de sincronização.
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 rounded-2xl bg-[#1A9B9F] text-white font-bold shadow-lg"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
