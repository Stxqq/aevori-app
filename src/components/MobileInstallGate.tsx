import { ArrowUpRight, Download, Plus, Share, Smartphone } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import BrandLogo from './BrandLogo';
import Companion from './Companion';
import './mobile-install.css';
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const standalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
export default function MobileInstallGate({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(standalone);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [error, setError] = useState('');
  const mobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && matchMedia('(max-width:1024px)').matches);
  const requested = new URLSearchParams(location.search).get('install') === '1';
  const [preview, setPreview] = useState(requested);
  useEffect(() => {
    const ready = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const opened = () => setInstalled(standalone());
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const media = matchMedia('(display-mode: standalone)');
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    media.addEventListener('change', opened);
    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
      window.removeEventListener('appinstalled', done);
      media.removeEventListener('change', opened);
    };
  }, []);
  if (installed || (!mobile && !preview)) return children;
  const ios = !/Android/i.test(navigator.userAgent);
  return (
    <main className="mobile-install">
      <header>
        <BrandLogo />
        <span>Your agent. Always close by.</span>
      </header>
      <div className="install-intro">
        <span className="install-app-icon">
          <Companion size={116} />
        </span>
        <span className="install-eyebrow">AEVORI FOR YOUR PHONE</span>
        <h1>
          A place on
          <br />
          your Home Screen.
        </h1>
        <p>Open your personal agent like an app. The AI runs on your Mac.</p>
      </div>
      <section className="install-sheet">
        <h2>
          <Smartphone size={19} />
          Add Aevori
        </h2>
        {prompt ? (
          <button
            className="primary wide"
            onClick={async () => {
              setError('');
              try {
                await prompt.prompt();
                await prompt.userChoice;
                setPrompt(null);
              } catch {
                setError('Open your browser menu and choose “Install app”.');
              }
            }}
          >
            <Download size={17} />
            Install app
          </button>
        ) : (
          <ol>
            <li>
              <span>1</span>
              <div>
                {ios ? (
                  <>
                    Open this page in <strong>Safari</strong>.
                  </>
                ) : (
                  <>
                    Open this page in <strong>Chrome</strong>.
                  </>
                )}
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                {ios ? (
                  <>
                    Tap <strong>Share</strong> <Share size={15} />.
                  </>
                ) : (
                  <>
                    Open the <strong>⋮ menu</strong>.
                  </>
                )}
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                Choose <strong>{ios ? 'Add to Home Screen' : 'Install app'}</strong>{' '}
                <Plus size={15} /> and open Aevori using its new icon.
              </div>
            </li>
          </ol>
        )}
        {error && (
          <p className="small-error" role="alert">
            {error}
          </p>
        )}
        <p className="install-connection">
          Your Mac and AEVORI must be running. Use your workspace's secure HTTPS address and your
          personal invitation.
        </p>
      </section>
      <footer>
        Aevori — Intelligence, locally.
        {!mobile && (
          <button
            className="text-button"
            onClick={() => {
              setPreview(false);
              history.replaceState(null, '', location.pathname);
            }}
          >
            Go to desktop app
            <ArrowUpRight size={14} />
          </button>
        )}
      </footer>
    </main>
  );
}
