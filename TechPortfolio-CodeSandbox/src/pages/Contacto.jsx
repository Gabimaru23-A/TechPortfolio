import { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { perfil, testimonios } from '../data/site.js';
import { crearEnlaceCorreo, validarContacto } from '../utils/logic.js';

const inicial = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '' };
const destinatario = import.meta.env.VITE_CONTACT_EMAIL?.trim() || perfil.email;
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

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({ ...actual, [name]: value }));
    setErrores(actual => ({ ...actual, [name]: '' }));
    setResultado(null);
  }

  function prepararBorrador(evento) {
    evento.preventDefault();
    const erroresEncontrados = validarContacto(formulario);
    setErrores(erroresEncontrados);

    const [primerCampoInvalido] = Object.keys(erroresEncontrados);
    if (primerCampoInvalido) {
      setResultado({ mensaje: 'Revisa los campos señalados para continuar.' });
      evento.currentTarget.elements.namedItem(primerCampoInvalido).focus();
      return;
    }

    const enlace = crearEnlaceCorreo(destinatario, formulario);
    setResultado(enlace ? {
      enlace,
      mensaje: 'Los datos son válidos. Revisa el borrador y confirma el envío en tu aplicación de correo.'
    } : {
      mensaje: 'Los datos son válidos. Para habilitar el borrador, configura un correo de destino válido en VITE_CONTACT_EMAIL.'
    });
  }

  function campo(nombre) {
    return { nombre, valor: formulario[nombre], error: errores[nombre], cambiar };
  }

  return (
    <section className="container section page">
      <PageHeading label="COMUNÍCATE" title="Formulario de" emphasis="contacto">
        Comparte una idea o consulta mediante el siguiente formulario.
      </PageHeading>
      <div className="contact-grid">
        <aside className="contact-aside">
          <span className="contact-icon" aria-hidden="true"><Mail size={28} /></span>
          <h2>Hablemos de tu idea</h2>
          <p>Cuenta qué problema quieres resolver, quién usaría la solución y qué información conviene tener en cuenta.</p>
          <p>El formulario prepara un borrador que puedes revisar y enviar desde tu aplicación de correo.</p>
        </aside>
        <form className="card contact-form" onSubmit={prepararBorrador} noValidate>
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
            <button type="submit" className="btn blue">Preparar borrador</button>
            <div role="status">
              {resultado && (
                <div className={resultado.enlace ? 'success' : 'form-warning'}>
                  {resultado.enlace && <CheckCircle2 size={18} aria-hidden="true" />}
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
