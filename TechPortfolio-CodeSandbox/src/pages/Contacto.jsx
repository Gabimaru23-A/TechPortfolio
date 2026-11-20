import { send as enviarPorEmailJS } from '@emailjs/browser';
import { useRef, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { contactoOficial, testimonios } from '../data/site.js';
import { configurarEmailJS, enviarSolicitud } from '../utils/email.js';
import { validarContacto } from '../utils/logic.js';

const inicial = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '', empresa: '' };
const configuracion = configurarEmailJS(import.meta.env);
const ayudaNombre = 'Hasta 20 letras, sin espacios.';

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

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({ ...actual, [name]: value }));
    setErrores(actual => ({ ...actual, [name]: '' }));
    setResultado(null);
  }

  async function tramitarSolicitud(evento) {
    evento.preventDefault();
    if (!configuracion || envioEnCurso.current) return;

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
    try {
      await enviarSolicitud(configuracion, formulario, enviarPorEmailJS);
      setFormulario(inicial);
      setResultado({ exito: true, mensaje: 'Gracias por tu solicitud. EmailJS aceptó el envío.' });
    } catch {
      setResultado({
        mensaje: 'No pudimos confirmar el envío. Tus datos siguen aquí. Puedes reintentar o escribir al correo oficial.'
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
        Solicita información sobre un proyecto web o envía una consulta sobre nuestros servicios.
      </PageHeading>
      <div className="contact-grid">
        <aside className="contact-aside">
          <span className="contact-icon" aria-hidden="true"><Mail size={28} /></span>
          <h2>Hablemos de tu idea</h2>
          <p>Cuenta qué problema quieres resolver, quién usaría la solución y qué información conviene tener en cuenta.</p>
          <p><a className="text-link contact-email" href={`mailto:${contactoOficial.email}`}>{contactoOficial.email}</a></p>
        </aside>
        <form className="card contact-form" onSubmit={tramitarSolicitud} noValidate>
          {!configuracion && (
            <div id="contacto-configuracion" className="form-warning">
              El envío requiere configurar el servicio de correo. Puedes escribir al correo oficial que aparece en esta página.
              {import.meta.env.DEV && <span>Configura VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_PUBLIC_KEY en .env.local y reinicia Vite.</span>}
            </div>
          )}
          <small>Todos los campos salvo Empresa son obligatorios.</small>
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
            <button type="submit" className="btn blue" disabled={enviando || !configuracion} aria-describedby={configuracion ? undefined : 'contacto-configuracion'}>
              {enviando ? 'Enviando solicitud…' : 'Enviar solicitud'}
            </button>
            <div role="status">
              {enviando && <span className="sr-only">Enviando solicitud.</span>}
              {resultado && (
                <div className={resultado.exito ? 'success' : 'form-warning'}>
                  {resultado.exito && <CheckCircle2 size={18} aria-hidden="true" />}
                  <span>{resultado.mensaje}</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
      <section aria-labelledby="testimonios-titulo">
        <div className="timeline-heading">
          <h2 id="testimonios-titulo">Testimonios</h2>
          <p>Opiniones ficticias sobre la experiencia de uso de TechPortfolio.</p>
        </div>
        <div className="testimonial-grid">
          {testimonios.map(persona => (
            <figure className="card testimonial" key={persona.nombre}>
              <blockquote><p>{persona.texto}</p></blockquote>
              <figcaption><strong>{persona.nombre}</strong><small>{persona.cargo}</small></figcaption>
            </figure>
          ))}
        </div>
      </section>
    </section>
  );
}
