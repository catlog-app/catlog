import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './ui/App';
import './styles.css';

const root = document.getElementById('app');
if (root) render(<App />, root);

// Update the app files in the background. User data is not touched.
// Only in production: the service worker would hide changes while we develop.
if (import.meta.env.PROD) registerSW({ immediate: true });
