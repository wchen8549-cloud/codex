import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, WifiOff } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [error, setError] = useState('');
  const [installing, setInstalling] = useState(false);
  const { offlineReady: [offlineReady, setOfflineReady], needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError() { setError('离线缓存初始化失败，可稍后联网重试。'); },
  });
  useEffect(() => {
    const connectivity = () => setOnline(navigator.onLine);
    const prompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const complete = () => { setInstalled(true); setInstallPrompt(null); };
    const display = window.matchMedia('(display-mode: standalone)');
    const displayChanged = () => setInstalled(display.matches);
    window.addEventListener('online', connectivity); window.addEventListener('offline', connectivity);
    window.addEventListener('beforeinstallprompt', prompt); window.addEventListener('appinstalled', complete);
    display.addEventListener('change', displayChanged);
    return () => {
      window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity);
      window.removeEventListener('beforeinstallprompt', prompt); window.removeEventListener('appinstalled', complete);
      display.removeEventListener('change', displayChanged);
    };
  }, []);
  async function install() {
    if (!installPrompt || installing) return;
    setInstalling(true);
    try { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
    catch { setError('安装提示未能打开，请使用浏览器菜单添加到主屏幕。'); }
    finally { setInstalling(false); }
  }
  async function update() {
    if (!window.confirm('更新会重新载入页面，请先保存正在编辑的内容。现在更新？')) return;
    try { await updateServiceWorker(true); }
    catch { setError('版本更新失败，请联网后重试。'); }
  }
  return <section className="mb-5 text-xs" aria-label="应用安装与连接状态">
    {!online && <p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 leading-6 text-amber-900"><WifiOff size={15} className="shrink-0" />当前离线，已加载的页面可继续记录，本地数据不需要联网。</p>}
    {(offlineReady || needRefresh || error) && <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
      <p role="status" className="leading-6 text-blue-900">{error || (needRefresh ? '有新版本可用，请先保存正在编辑的内容。' : '离线缓存已就绪，可在本机离线使用。')}</p>
      <div className="mt-2 flex flex-wrap gap-2">{needRefresh && <button type="button" className="primary-button" onClick={() => void update()}>更新版本</button>}<button type="button" className="secondary-button" onClick={() => { setOfflineReady(false); setNeedRefresh(false); setError(''); }}>稍后 / 关闭</button></div>
    </div>}
    {!installed && <details className="rounded-xl border border-slate-200 bg-white px-3"><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-slate-500"><Download size={14} aria-hidden="true" />安装到手机桌面</summary><div className="pb-3 leading-7 text-slate-500">{installPrompt && <button type="button" disabled={installing} className="primary-button mb-2" onClick={() => void install()}>安装应用</button>}<p>Android：在浏览器菜单中选择“安装应用”或“添加到主屏幕”。</p><p>iPhone：用 Safari 打开，点击分享 → 添加到主屏幕。</p><p className="mt-2">手机安装与离线缓存需要 HTTPS 地址。局域网 HTTP 仅用于页面预览；本地开发时不会生成生产离线缓存。</p></div></details>}
  </section>;
}
