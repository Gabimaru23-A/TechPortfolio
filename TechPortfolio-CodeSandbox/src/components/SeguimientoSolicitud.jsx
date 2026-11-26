import { useRef, useState } from 'react';
import { normalizarCorreo } from '../../supabase/functions/_shared/validar-contacto.mjs';
import VerificacionCorreo from './VerificacionCorreo.jsx';
import { eliminarBorrador } from '../utils/borradorContacto.js';
import { CorreoNoVerificado, consultarSolicitud, tokenVerificado } from '../utils/supabase.js';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

export default function SeguimientoSolicitud({ sesion, alVerificar, borrador }) {
  const [codigo, setCodigo] = useState(borrador?.codigo ?? '');
  const [correo, setCorreo] = useState(borrador?.correo ?? '');
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const consultaEnCurso = useRef(false);
  const token = tokenVerificado(sesion, correo);

  async function consultar(evento) {
    evento.preventDefault();
    if (consultaEnCurso.current) return;

    consultaEnCurso.current = true;
    setConsultando(true);
    setResultado(null);
    try {
      setResultado(await consultarSolicitud(codigo.trim(), token));
      eliminarBorrador(correo, 'seguimiento').catch(() => {});
    } catch (error) {
      if (error instanceof CorreoNoVerificado && token) {
        alVerificar(actual => actual?.token === token ? null : actual);
      }
      setResultado({ error: error.message });
    } finally {
      consultaEnCurso.current = false;
      setConsultando(false);
    }
  }

  return (
    <form className="card contact-form seguimiento-form" aria-labelledby="titulo-seguimiento" onSubmit={consultar} noValidate>
      <div className="contact-form-heading">
        <h2 id="titulo-seguimiento">Consulta el estado de tu solicitud</h2>
        <small>Usa el código de seguimiento y confirma el correo que registraste.</small>
      </div>
      <div className="form-field">
        <label htmlFor="seguimiento-codigo">Código de seguimiento</label>
        <input id="seguimiento-codigo" value={codigo} required readOnly={consultando}
          autoComplete="off" autoCapitalize="none" spellCheck={false}
          onChange={evento => { setCodigo(evento.target.value); setResultado(null); }} />
      </div>
      <div className="form-field">
        <label htmlFor="seguimiento-correo">Correo de la solicitud</label>
        <input id="seguimiento-correo" type="email" autoComplete="email" value={correo} required
          readOnly={consultando} onChange={evento => { setCorreo(evento.target.value); setResultado(null); }} />
      </div>
      <VerificacionCorreo key={normalizarCorreo(correo)} correo={correo}
        verificado={Boolean(token)} deshabilitado={consultando}
        tipo="seguimiento" obtenerBorrador={() => ({ codigo })} />
      <div className="contact-actions">
        <button type="submit" className="btn blue" disabled={consultando} aria-busy={consultando}>
          {consultando ? 'Consultando…' : 'Consultar estado'}
        </button>
        <div role="status">
          {resultado?.error && <p className="form-warning">{resultado.error}</p>}
          {token && resultado?.estado && (
            <div className="contact-feedback success">
              <span>Estado actual <strong>{resultado.estado}</strong>. Última actualización el <time dateTime={resultado.fecha.toISOString()}>{formatoFecha.format(resultado.fecha)}</time>.</span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
