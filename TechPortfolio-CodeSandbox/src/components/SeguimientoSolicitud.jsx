import { useRef, useState } from 'react';
import { consultarSolicitud } from '../utils/supabase.js';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

export default function SeguimientoSolicitud() {
  const [codigo, setCodigo] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const consultaEnCurso = useRef(false);

  async function consultar(evento) {
    evento.preventDefault();
    if (consultaEnCurso.current) return;

    consultaEnCurso.current = true;
    setConsultando(true);
    setResultado(null);
    try {
      setResultado(await consultarSolicitud(codigo.trim()));
    } catch (error) {
      setResultado({ error: error.message });
    } finally {
      consultaEnCurso.current = false;
      setConsultando(false);
    }
  }

  return (
    <form className="card contact-form seguimiento-form" aria-labelledby="titulo-seguimiento" onSubmit={consultar}>
      <div className="contact-form-heading">
        <h2 id="titulo-seguimiento">Consulta el estado de tu solicitud</h2>
        <small>Usa el código asignado al registrar tu solicitud.</small>
      </div>
      <div className="form-field">
        <label htmlFor="seguimiento-codigo">Código de seguimiento</label>
        <input id="seguimiento-codigo" value={codigo} required readOnly={consultando}
          autoComplete="off" autoCapitalize="none" spellCheck={false}
          onChange={evento => { setCodigo(evento.target.value); setResultado(null); }} />
      </div>
      <div className="contact-actions">
        <button type="submit" className="btn blue" disabled={consultando} aria-busy={consultando}>
          {consultando ? 'Consultando…' : 'Consultar estado'}
        </button>
        <div role="status">
          {resultado?.error && <p className="form-warning">{resultado.error}</p>}
          {resultado?.estado && (
            <div className="contact-feedback success">
              <span>Estado actual <strong>{resultado.estado}</strong>. Última actualización el <time dateTime={resultado.fecha.toISOString()}>{formatoFecha.format(resultado.fecha)}</time>.</span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
