import { send as enviarPorEmailJS } from '@emailjs/browser';
import { useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import SeguimientoSolicitud from '../components/SeguimientoSolicitud.jsx';
import { contactoOficial, testimonios } from '../data/site.js';
import { configurarEmailJS, enviarSolicitud } from '../utils/email.js';
import { validarContacto } from '../utils/logic.js';
import { configuracionIncompleta, registrarSolicitud, seguimientoDisponible } from '../utils/supabase.js';

const inicial = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '', empresa: '' };
const configuracion = configurarEmailJS({
  VITE_EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  VITE_EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
});
const ayudaNombre = 'Hasta 20 letras, sin espacios.';
const puedeEnviar = Boolean(configuracion) && !configuracionIncompleta;

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

export default function Contacto() {
  const [formulario, setFormulario] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const envioEnCurso = useRef(false);
  const intento = useRef(null);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({ ...actual, [name]: value }));
    setErrores(actual => ({ ...actual, [name]: '' }));
    setResultado(null);
    intento.current = null;
  }

  async function tramitarSolicitud(evento) {
    evento.preventDefault();
    if (!puedeEnviar || envioEnCurso.current) return;

    const erroresEncontrados = validarContacto(formulario);
    setErrores(erroresEncontrados);

    const [primerCampoInvalido] = Object.keys(erroresEncontrados);
    if (primerCampoInvalido) {
      setResultado({ mensaje: 'Revisa los campos señalados para continuar.' });
      evento.currentTarget.elements.namedItem(primerCampoInvalido).focus();
      return;
    }

    envioEnCurso.current = true;
    setEnviando(true);
    setResultado(null);
    let codigo;
    try {
      if (seguimientoDisponible) {
        intento.current ??= { id: crypto.randomUUID(), codigo: null };
        intento.current.codigo ??= await registrarSolicitud(intento.current.id, formulario);
        codigo = intento.current.codigo;
      }
      await enviarSolicitud(configuracion, formulario, enviarPorEmailJS, codigo);
      setFormulario(inicial);
      intento.current = null;
      setResultado({ exito: true, codigo, mensaje: 'Gracias por tu solicitud. EmailJS aceptó el envío.' });
    } catch (error) {
      setResultado({
        codigo,
        mensaje: codigo
          ? 'Guardamos tu solicitud. No pudimos confirmar el envío del correo. Puedes reintentarlo con los mismos datos.'
          : seguimientoDisponible
            ? error.message
            : 'No pudimos confirmar el envío. Tus datos siguen aquí. Puedes reintentar o escribir al correo oficial.'
      });
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }

  function campo(nombre) {
    return { nombre, valor: formulario[nombre], error: errores[nombre], cambiar, readOnly: enviando };
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
          {!configuracion && (
            <div id="contacto-configuracion" className="form-warning">
              El envío requiere configurar el servicio de correo. Puedes escribir al correo oficial que aparece en esta página.
              {import.meta.env.DEV && <span>Configura VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_PUBLIC_KEY en .env.local y reinicia Vite.</span>}
            </div>
          )}
          {configuracion && configuracionIncompleta && (
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
          <div className="contact-actions">
            <button type="submit" className="btn blue" disabled={enviando || !puedeEnviar} aria-busy={enviando} aria-describedby={puedeEnviar ? undefined : 'contacto-configuracion'}>
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
      {seguimientoDisponible && <SeguimientoSolicitud />}
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
