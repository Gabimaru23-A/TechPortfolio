import { useState } from 'react';
import { Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { SocialLinks } from '../components/Layout.jsx';
import { perfil } from '../perfil.js';

const CAMPOS_INICIALES = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '' };
const NOMBRE_VALIDO = /^[\p{L}\p{M} ]+$/u;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const testimonios = [
  'Pude encontrar los proyectos de React con el filtro de tecnología.',
  'El detalle me permitió consultar cada ficha en el mismo catálogo.',
  'Encontré la información sobre el autor y su formación desde Inicio.',
  'Pude recorrer las cinco vistas desde el celular.',
  'El formulario me indicó qué campos debía revisar antes de preparar el mensaje.',
];

function ContactField({ name, label, value, onChange, error, multiline = false, ...props }) {
  const Elemento = multiline ? 'textarea' : 'input';
  const id = `contacto-${name}`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Elemento
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && <small id={`${id}-error`} className="field-error">{error}</small>}
    </div>
  );
}

function ContactForm() {
  const [formulario, setFormulario] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [borrador, setBorrador] = useState('');

  function actualizar(evento) {
    const { name, value } = evento.target;
    setFormulario(anterior => ({ ...anterior, [name]: value }));
    setErrores(anteriores => ({ ...anteriores, [name]: '' }));
    setBorrador('');
  }

  function prepararCorreo(evento) {
    evento.preventDefault();
    const { nombre, apellidos, correo, telefono, descripcion } = formulario;
    const erroresSiguientes = {};

    if (!NOMBRE_VALIDO.test(nombre.trim())) erroresSiguientes.nombre = 'Escribe tu nombre usando solo letras.';
    if (!NOMBRE_VALIDO.test(apellidos.trim())) erroresSiguientes.apellidos = 'Escribe tus apellidos usando solo letras.';
    if (!CORREO_VALIDO.test(correo.trim())) erroresSiguientes.correo = 'Escribe un correo válido.';
    if (!/^\d{1,15}$/.test(telefono.trim())) erroresSiguientes.telefono = 'Escribe un teléfono de hasta 15 dígitos.';
    if (!descripcion.trim()) erroresSiguientes.descripcion = 'Describe tu proyecto o consulta.';
    setErrores(erroresSiguientes);

    const primerError = Object.keys(erroresSiguientes)[0];
    if (primerError) {
      evento.currentTarget.elements.namedItem(primerError).focus();
      return;
    }

    const nombreCompleto = `${nombre.trim()} ${apellidos.trim()}`;
    const asunto = encodeURIComponent(`Contacto TechPortfolio de ${nombreCompleto}`);
    const cuerpo = encodeURIComponent([
      `Nombre: ${nombreCompleto}`,
      `Correo: ${correo.trim()}`,
      `Teléfono: ${telefono.trim()}`,
      '',
      descripcion.trim(),
    ].join('\r\n'));
    setBorrador(`mailto:${perfil.email}?subject=${asunto}&body=${cuerpo}`);
  }

  function datosCampo(name) {
    return { name, value: formulario[name], error: errores[name], onChange: actualizar };
  }

  return (
    <form className="card contact-form" noValidate onSubmit={prepararCorreo}>
      <p className="form-hint">Todos los campos son obligatorios.</p>
      <div className="form-row">
        <ContactField {...datosCampo('nombre')} label="Nombre" autoComplete="given-name" maxLength={20} />
        <ContactField {...datosCampo('apellidos')} label="Apellidos" autoComplete="family-name" maxLength={20} />
      </div>
      <div className="form-row">
        <ContactField {...datosCampo('correo')} label="Correo" type="email" autoComplete="email" />
        <ContactField {...datosCampo('telefono')} label="Teléfono" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={15} />
      </div>
      <ContactField {...datosCampo('descripcion')} label="Descripción del proyecto o consulta" multiline rows={5} />
      <button className="button button-primary" type="submit">Preparar correo</button>
      <div role="status">
        {borrador && (
          <div className="draft">
            <p>{perfil.email
              ? 'Gracias. Tu borrador está listo para abrir en tu aplicación de correo.'
              : 'Gracias. Tu borrador está listo. Completa el destinatario en tu aplicación de correo.'}</p>
            <a className="text-link" href={borrador}>Abrir borrador de correo</a>
          </div>
        )}
      </div>
    </form>
  );
}

export default function Contacto() {
  return (
    <div className="container section page">
      <PageHeading title="Contacto">
        Comparte una idea para un proyecto, una consulta o una propuesta de colaboración.
      </PageHeading>
      <div className="contact-grid">
        <section className="contact-info" aria-labelledby="contacto-directo">
          <span className="tile-icon"><Mail size={23} aria-hidden="true" /></span>
          <h2 id="contacto-directo">Dónde encontrarme</h2>
          <SocialLinks />
          {perfil.email && <p><a className="text-link" href={`mailto:${perfil.email}`}>{perfil.email}</a></p>}
        </section>
        <ContactForm />
      </div>
      <section className="spaced" aria-labelledby="testimonios">
        <h2 id="testimonios">Testimonios de ejemplo</h2>
        <ul className="testimonial-grid">
          {testimonios.map(texto => <li className="card testimonial" key={texto}><q>{texto}</q></li>)}
        </ul>
      </section>
    </div>
  );
}
