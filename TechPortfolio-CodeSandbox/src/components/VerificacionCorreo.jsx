import { useId, useRef, useState } from 'react';
import { esCorreoValido } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { enviarCodigoCorreo, verificarCorreo } from '../utils/supabase.js';

export default function VerificacionCorreo({ correo, verificado, alVerificar, deshabilitado }) {
  const id = useId();
  const [codigo, setCodigo] = useState('');
  const [solicitado, setSolicitado] = useState(false);
  const [operacion, setOperacion] = useState(null);
  const [aviso, setAviso] = useState(null);
  const enCurso = useRef(false);
  const codigoValido = /^\d{6,10}$/.test(codigo.trim());

  async function ejecutar(accion, tarea) {
    if (enCurso.current || deshabilitado) return;
    enCurso.current = true;
    setOperacion(accion);
    setAviso(null);
    try {
      await tarea();
    } catch (error) {
      setAviso({ error: true, mensaje: error.message });
    } finally {
      enCurso.current = false;
      setOperacion(null);
    }
  }

  function enviar() {
    if (!esCorreoValido(correo.trim())) return;
    return ejecutar('enviar', async () => {
      await enviarCodigoCorreo(correo);
      setCodigo('');
      setSolicitado(true);
      setAviso({ mensaje: 'Revisa tu bandeja para obtener el código de verificación.' });
    });
  }

  function confirmar() {
    if (!codigoValido) return;
    return ejecutar('verificar', async () => {
      const sesion = await verificarCorreo(correo, codigo.trim());
      setCodigo('');
      setSolicitado(false);
      alVerificar(sesion);
    });
  }

  if (verificado) return <p className="success">Correo verificado.</p>;

  return (
    <div className="verificacion-correo">
      <small>Verifica que puedes recibir mensajes en este correo.</small>
      <div>
        <button type="button" className="btn" disabled={deshabilitado || Boolean(operacion) || !esCorreoValido(correo.trim())}
          onClick={enviar}>
          {solicitado ? 'Reenviar código de verificación' : 'Enviar código de verificación'}
        </button>
      </div>
      {solicitado && (
        <>
          <div className="form-field">
            <label htmlFor={id}>Código de verificación</label>
            <input id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={10}
              value={codigo} readOnly={deshabilitado || Boolean(operacion)}
              onChange={evento => setCodigo(evento.target.value)}
              onKeyDown={evento => {
                if (evento.key === 'Enter') {
                  evento.preventDefault();
                  confirmar();
                }
              }} />
          </div>
          <div>
            <button type="button" className="btn" onClick={confirmar}
              disabled={deshabilitado || Boolean(operacion) || !codigoValido}>Verificar correo</button>
          </div>
        </>
      )}
      <small aria-live="polite" className={aviso?.error ? 'error' : undefined}>
        {operacion === 'enviar' && 'Enviando código…'}
        {operacion === 'verificar' && 'Verificando correo…'}
        {aviso?.mensaje}
      </small>
    </div>
  );
}
