import { useRef, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { contactoOficial, testimonios } from '../data/site.js';
import { configurarEmailJS, enviarSolicitud } from '../utils/email.js';
import { crearEnlaceCorreo, validarContacto } from '../utils/logic.js';

const inicial = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '' };
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
    if (envioEnCurso.current) return;

    const erroresEncontrados = validarContacto(formulario);
    setErrores(erroresEncontrados);

    const [primerCampoInvalido] = Object.keys(erroresEncontrados);
    if (primerCampoInvalido) {
      setResultado({ mensaje: 'Revisa los campos señalados para continuar.' });
      evento.currentTarget.elements.namedItem(primerCampoInvalido).focus();
      return;
    }

    if (!configuracion) {
      setResultado({
        enlace: crearEnlaceCorreo(contactoOficial.email, formulario),
        mensaje: 'El borrador está listo para abrirlo y enviarlo desde tu aplicación de correo.'
      });
      return;
    }

    envioEnCurso.current = true;
    setEnviando(true);
    setResultado(null);
    try {
      await enviarSolicitud(configuracion, formulario);
      setFormulario(inicial);
      setResultado({ exito: true, mensaje: 'Gracias por tu solicitud. El servicio de correo confirmó el envío.' });
    } catch {
      setResultado({
        enlace: crearEnlaceCorreo(contactoOficial.email, formulario),
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
          {!configuracion && <p className="form-warning">El envío directo no está disponible. Puedes escribir al correo oficial o preparar un borrador con el formulario.</p>}
          <small>Todos los campos son obligatorios.</small>
          <div className="form-row">
            <CampoContacto {...campo('nombre')} etiqueta="Nombre" ayuda={ayudaNombre} autoComplete="given-name" />
            <CampoContacto {...campo('apellidos')} etiqueta="Apellidos" ayuda={ayudaNombre} autoComplete="family-name" />
          </div>
          <div className="form-row">
            <CampoContacto {...campo('correo')} etiqueta="Correo electrónico" type="email" autoComplete="email" />
            <CampoContacto {...campo('telefono')} etiqueta="Teléfono" type="tel" inputMode="numeric" autoComplete="tel" />
          </div>
          <CampoContacto {...campo('descripcion')} etiqueta="Descripción del proyecto" multilinea rows={5} />
          <div className="contact-actions">
            <button type="submit" className="btn blue" disabled={enviando}>
              {enviando ? 'Enviando solicitud…' : configuracion ? 'Enviar solicitud' : 'Preparar borrador'}
            </button>
            <div role="status">
              {enviando && <span className="sr-only">Enviando solicitud.</span>}
              {resultado && (
                <div className={resultado.exito ? 'success' : 'form-warning'}>
                  {resultado.exito && <CheckCircle2 size={18} aria-hidden="true" />}
                  <span>{resultado.mensaje}</span>
                  {resultado.enlace && <a className="draft-link" href={resultado.enlace}>Abrir borrador de correo</a>}
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
