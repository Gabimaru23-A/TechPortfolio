import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { procesarRetornoCorreo } from './utils/supabase.js';
import './style.css';

const confirmacion = procesarRetornoCorreo();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App retornoInicial={confirmacion} />
    </HashRouter>
  </React.StrictMode>
);
