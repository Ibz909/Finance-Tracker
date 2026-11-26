import '@fontsource-variable/geist';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { installStaleChunkReload } from './app/reloadOnStaleChunk';
import './styles/index.css';

installStaleChunkReload();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
