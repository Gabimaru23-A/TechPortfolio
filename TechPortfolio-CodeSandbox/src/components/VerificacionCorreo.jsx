import { useEffect, useRef, useState } from 'react';
import { esCorreoValido } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { observarEsperaCorreo, proximoEnlaceCorreo } from '../utils/esperaCorreo.js';
import { enviarEnlaceCorreo } from '../utils/supabase.js';

export default function VerificacionCorreo({ correo, verificado, tipo, obtenerBorrador, deshabilitado }) {
  const [solicitado, setSolicitado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [ahora, setAhora] = useState(Date.now);
  const [venceEn, setVenceEn] = useState(0);
  const [comprobando, setComprobando] = useState(true);
  const enCurso = useRef(false);
  const segundos = Math.max(0, Math.ceil((venceEn - ahora) / 1000));
  const esperando = segundos > 0;

  useEffect(() => {
    let vigente = true;
    async function actualizar() {
      const fecha = await proximoEnlaceCorreo(correo).catch(() => 0);
      if (!vigente) return;
      setVenceEn(fecha);
      setAhora(Date.now());
      setComprobando(false);
    }
    setComprobando(true);
    actualizar();
    const dejarObservar = observarEsperaCorreo(actualizar);
    const reloj = window.setInterval(actualizar, 1000);
    return () => {
      vigente = false;
      dejarObservar();
      window.clearInterval(reloj);
    };
  }, [correo]);

  async function enviar() {
    if (enCurso.current || deshabilitado || comprobando || esperando || !esCorreoValido(correo.trim())) return;
    enCurso.current = true;
    setEnviando(true);
    setAviso(null);
    try {
      await enviarEnlaceCorreo(correo, tipo, obtenerBorrador());
      setSolicitado(true);
      setAviso({ mensaje: 'Supabase aceptó la solicitud del enlace. Revisa tu correo, incluida la carpeta de spam. Si no llega, contacta con TechPortfolio.' });
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
          disabled={deshabilitado || enviando || comprobando || esperando || !esCorreoValido(correo.trim())}>
          {solicitado ? 'Reenviar enlace' : 'Confirmar mi correo'}
        </button>
      </div>
      <small aria-live="polite" className={aviso?.error ? 'error' : undefined}>
        {enviando ? 'Enviando enlace…' : aviso?.mensaje}
      </small>
      {esperando && !enviando && <small>Podrás solicitar otro enlace en {segundos} segundos.</small>}
      {!esperando && !enviando && comprobando && <small>Comprobando cuándo puedes solicitar el enlace…</small>}
      {!esperando && !enviando && !comprobando && !esCorreoValido(correo.trim()) && <small>Escribe un correo electrónico válido para activar la confirmación.</small>}
      {!esperando && !enviando && !comprobando && deshabilitado && <small>Espera a que termine la solicitud actual.</small>}
    </div>
  );
}
