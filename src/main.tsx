import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import SessionGate from './components/SessionGate';
import MobileInstallGate from './components/MobileInstallGate';
import './registry.css';
import './components/interaction.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><SessionGate>{session=><MobileInstallGate><App key={session.id} session={session}/></MobileInstallGate>}</SessionGate></React.StrictMode>
);

if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').catch(()=>{/* Browser installation remains available without offline support. */});});
}
