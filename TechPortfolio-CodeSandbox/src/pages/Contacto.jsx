import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import SeguimientoSolicitud from '../components/SeguimientoSolicitud.jsx';
import VerificacionCorreo from '../components/VerificacionCorreo.jsx';
import { contactoOficial, testimonios } from '../data/site.js';
import { validarContacto } from '../utils/logic.js';
import { normalizarCorreo, uuidV4 } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { eliminarBorrador } from '../utils/borradorContacto.js';
import { CorreoNoVerificado, registrarSolicitud, seguimientoDisponible, tokenVerificado } from '../utils/supabase.js';

const inicial = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '', empresa: '' };
const ayudaNombre = 'Hasta 20 letras. Puedes separar nombres con un espacio.';

function CampoContacto({ nombre, etiqueta, valor, error, cambiar, ayuda, multilinea, ...atributos }) {
  const Entrada = multilinea ? 'textarea' : 'input';
  const id = `contacto-${nombre}`;
  const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

  return (
    <div className="form-field">
      <label htmlFor={id}>{etiqueta}</label>
      <Entrada
        id={id}
        name={nombre}
        value={valor}
        onChange={cambiar}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={descripcion}
        {...atributos}
      />
      {error && <small id={`${id}-error`} className="error">{error}</small>}
      {ayuda && !error && <small id={`${id}-ayuda`} className="field-hint">{ayuda}</small>}
    </div>
  );
}

export default function Contacto({ retorno, alCompletarRetorno }) {
  const [formulario, setFormulario] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [sesion, setSesion] = useState(null);
  const [errorConfirmacion, setErrorConfirmacion] = useState('');
  const [borradorSeguimiento, setBorradorSeguimiento] = useState(null);
  const envioEnCurso = useRef(false);
  const intento = useRef(null);
  const confirmando = Boolean(retorno);

  useEffect(() => {
    if (!retorno) return;
    let actual = true;
    retorno.then(confirmacion => {
      if (!actual) return;
      if (confirmacion.sesion) {
        const { correo } = confirmacion.sesion;
        const restaurado = { ...inicial, ...confirmacion.solicitud?.formulario, correo };
        if (uuidV4.test(confirmacion.solicitud?.id ?? '')) {
          intento.current = { id: confirmacion.solicitud.id, formulario: restaurado };
        }
        setSesion(confirmacion.sesion);
        setFormulario(restaurado);
        setBorradorSeguimiento({ correo, codigo: confirmacion.seguimiento?.codigo ?? '' });
      } else {
        setSesion(null);
      }
      setErrorConfirmacion(confirmacion.error ?? '');
      alCompletarRetorno(null);
    });
    return () => { actual = false; };
  }, [retorno, alCompletarRetorno]);

  function prepararIntento() {
    const mismosDatos = intento.current && Object.keys(inicial)
      .every(campo => intento.current.formulario[campo] === formulario[campo]);
    if (!mismosDatos) intento.current = { id: crypto.randomUUID(), formulario };
    return intento.current;
  }

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({ ...actual, [name]: value }));
    setErrores(actual => ({ ...actual, [name]: '' }));
    setResultado(null);
  }

  async function tramitarSolicitud(evento) {
    evento.preventDefault();
    if (!seguimientoDisponible || envioEnCurso.current || confirmando) return;

    const erroresEncontrados = validarContacto(formulario);
    setErrores(erroresEncontrados);

    const [primerCampoInvalido] = Object.keys(erroresEncontrados);
    if (primerCampoInvalido) {
      setResultado({ mensaje: 'Revisa los campos señalados para continuar.' });
      evento.currentTarget.elements.namedItem(primerCampoInvalido).focus();
      return;
    }

    const token = tokenVerificado(sesion, formulario.correo);
    if (!token) {
      setResultado({ mensaje: 'Confirma tu correo antes de enviar la solicitud.' });
      return;
    }

    envioEnCurso.current = true;
    setEnviando(true);
    setResultado(null);
    try {
      const codigo = await registrarSolicitud(prepararIntento().id, formulario, token);
      eliminarBorrador(formulario.correo, 'solicitud').catch(() => {});
      setFormulario(inicial);
      intento.current = null;
      setResultado({ exito: true, codigo, mensaje: 'Solicitud registrada. La confirmación por correo quedó en cola.' });
    } catch (error) {
      if (error instanceof CorreoNoVerificado) {
        setSesion(actual => actual?.token === token ? null : actual);
      }
      setResultado({ mensaje: error.message });
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }

  function campo(nombre) {
    return { nombre, valor: formulario[nombre], error: errores[nombre], cambiar, readOnly: enviando || confirmando };
  }

  return (
    <section className="container section page">
      <PageHeading title="Contacto con" emphasis="TechPortfolio">
        Envía una consulta sobre un proyecto web, un catálogo o una herramienta que quieras mejorar.
      </PageHeading>
      <div className="contact-grid">
        <aside className="contact-aside">
          <span className="contact-icon" aria-hidden="true"><Mail size={28} /></span>
          <h2>Hablemos de tu idea</h2>
          <p>Cuenta qué problema quieres resolver, quién usaría la solución y qué información conviene tener en cuenta.</p>
          <div className="contact-mail">
            <p>Correo oficial</p>
            <a className="text-link contact-email" href={`mailto:${contactoOficial.email}`}>{contactoOficial.email}</a>
          </div>
        </aside>
        <form className="card contact-form" aria-labelledby="titulo-solicitud" onSubmit={tramitarSolicitud} noValidate>
          <div className="contact-form-heading">
            <h2 id="titulo-solicitud">Describe tu proyecto</h2>
            <small>Todos los campos salvo Empresa son obligatorios.</small>
          </div>
          {confirmando && <p role="status">Confirmando tu correo…</p>}
          {errorConfirmacion && <p className="form-warning" role="alert">{errorConfirmacion}</p>}
          {!seguimientoDisponible && (
            <div id="contacto-configuracion" className="form-warning">
              El registro de solicitudes no está disponible. Puedes escribir al correo oficial.
              {import.meta.env.DEV && <span>Revisa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local.</span>}
            </div>
          )}
          <div className="form-row">
            <CampoContacto {...campo('nombre')} etiqueta="Nombre" ayuda={ayudaNombre} autoComplete="given-name" />
            <CampoContacto {...campo('apellidos')} etiqueta="Apellidos" ayuda={ayudaNombre} autoComplete="family-name" />
          </div>
          <div className="form-row">
            <CampoContacto {...campo('correo')} etiqueta="Correo electrónico" type="email" autoComplete="email" />
            <CampoContacto {...campo('telefono')} etiqueta="Teléfono" type="tel" inputMode="numeric" autoComplete="tel" />
          </div>
          <CampoContacto {...campo('empresa')} etiqueta="Empresa (opcional)" autoComplete="organization" required={false} />
          <CampoContacto {...campo('descripcion')} etiqueta="Descripción del proyecto" multilinea rows={5} />
          {seguimientoDisponible && (
            <VerificacionCorreo key={normalizarCorreo(formulario.correo)} correo={formulario.correo}
              verificado={Boolean(tokenVerificado(sesion, formulario.correo))} deshabilitado={enviando || confirmando}
              tipo="solicitud" obtenerBorrador={prepararIntento} />
          )}
          <div className="contact-actions">
            <button type="submit" className="btn blue" disabled={enviando || confirmando || !seguimientoDisponible} aria-busy={enviando} aria-describedby={seguimientoDisponible ? undefined : 'contacto-configuracion'}>
              {enviando ? 'Enviando solicitud…' : 'Enviar solicitud'}
            </button>
            <div role="status">
              {enviando && <span className="sr-only">Enviando solicitud.</span>}
              {resultado && (
                <div className={`contact-feedback ${resultado.exito ? 'success' : 'form-warning'}`}>
                  {resultado.exito
                    ? <CheckCircle2 size={18} aria-hidden="true" />
                    : <CircleAlert size={18} aria-hidden="true" />}
                  <div>
                    <span>{resultado.mensaje}</span>
                    {resultado.codigo && <div className="seguimiento-resultado">Código de seguimiento <code>{resultado.codigo}</code></div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
      {seguimientoDisponible && !confirmando &&
        <SeguimientoSolicitud sesion={sesion} alVerificar={setSesion} borrador={borradorSeguimiento} />}
      <section aria-labelledby="testimonios-titulo">
        <div className="timeline-heading">
          <h2 id="testimonios-titulo">Testimonios</h2>
          <p>Comentarios ficticios que ilustran el uso del portafolio.</p>
        </div>
        <div className="testimonial-grid">
          {testimonios.map(persona => (
            <figure className="card testimonial" key={persona.nombre}>
              <blockquote><p>«{persona.texto}»</p></blockquote>
              <figcaption><strong>{persona.nombre}</strong><small>{persona.cargo}</small></figcaption>
            </figure>
          ))}
        </div>
      </section>
    </section>
  );
}
