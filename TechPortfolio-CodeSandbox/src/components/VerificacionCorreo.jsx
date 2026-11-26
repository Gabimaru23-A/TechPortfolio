import { useEffect, useRef, useState } from 'react';
import { esCorreoValido } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { enviarEnlaceCorreo, proximoEnlaceCorreo } from '../utils/supabase.js';

export default function VerificacionCorreo({ correo, verificado, tipo, obtenerBorrador, deshabilitado }) {
  const [solicitado, setSolicitado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [ahora, setAhora] = useState(Date.now);
  const enCurso = useRef(false);
  const segundos = Math.max(0, Math.ceil((proximoEnlaceCorreo(correo) - ahora) / 1000));
  const esperando = segundos > 0;

  useEffect(() => {
    if (!esperando) return;
    const reloj = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(reloj);
  }, [esperando]);

  async function enviar() {
    if (enCurso.current || deshabilitado || esperando || !esCorreoValido(correo.trim())) return;
    enCurso.current = true;
    setEnviando(true);
    setAviso(null);
    try {
      await enviarEnlaceCorreo(correo, tipo, obtenerBorrador());
      setSolicitado(true);
      setAviso({ mensaje: 'Te enviamos un enlace de confirmación. Ábrelo para volver a TechPortfolio.' });
    } catch (error) {
      setAviso({ error: true, mensaje: error.message });
    } finally {
      enCurso.current = false;
      setAhora(Date.now());
      setEnviando(false);
    }
  }

  if (verificado) return <p className="success">Correo confirmado correctamente.</p>;

  return (
    <div className="verificacion-correo">
      <div>
        <button type="button" className="btn" onClick={enviar}
          disabled={deshabilitado || enviando || esperando || !esCorreoValido(correo.trim())}>
          {solicitado ? 'Reenviar enlace' : 'Confirmar mi correo'}
        </button>
      </div>
      <small aria-live="polite" className={aviso?.error ? 'error' : undefined}>
        {enviando ? 'Enviando enlace…' : aviso?.mensaje}
      </small>
      {esperando && !enviando && <small>Puedes pedir otro enlace en {segundos} s.</small>}
    </div>
  );
}
