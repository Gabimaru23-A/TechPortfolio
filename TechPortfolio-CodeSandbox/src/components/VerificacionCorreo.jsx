import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { esCorreoValido } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { observarEsperaCorreo, proximoEnlaceCorreo } from '../utils/esperaCorreo.js';
import { enviarEnlaceCorreo } from '../utils/supabase.js';

export default function VerificacionCorreo({ correo, verificado, tipo, obtenerBorrador, deshabilitado }) {
  const [solicitado, setSolicitado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [, setAhora] = useState(Date.now);
  const enCurso = useRef(false);
  const venceEn = useSyncExternalStore(observarEsperaCorreo, proximoEnlaceCorreo);
  const segundos = Math.max(0, Math.ceil((venceEn - Date.now()) / 1000));
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

  if (verificado) {
    return <p className="success">
      Correo confirmado correctamente.{tipo === 'solicitud' && ' Ya puedes enviar tu solicitud.'}
    </p>;
  }

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
      {esperando && !enviando && <small>Podrás solicitar otro enlace en {segundos} segundos.</small>}
    </div>
  );
}
