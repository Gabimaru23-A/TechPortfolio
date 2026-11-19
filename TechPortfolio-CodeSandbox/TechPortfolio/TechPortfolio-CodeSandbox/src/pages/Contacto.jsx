import { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { perfil, testimonios } from '../data/site.js';
import { limpiarValorContacto, validarContacto } from '../utils/logic.js';

const inicial = { nombre: '', apellidos: '', correo: '', telefono: '', descripcion: '' };

export default function Contacto() {
  const [formulario, setFormulario] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enlaceCorreo, setEnlaceCorreo] = useState('');

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({...actual, [name]: limpiarValorContacto(name, value)}));
    setErrores(actual => ({...actual, [name]: ''}));
    setMensaje('');
    setEnlaceCorreo('');
  }
  function enviar(evento) {
    evento.preventDefault();
    const erroresEncontrados = validarContacto(formulario);
    setErrores(erroresEncontrados);
    if (Object.keys(erroresEncontrados).length) {
      setMensaje('Revisa los campos señalados para continuar.');
      return;
    }
    const nombreCompleto = `${formulario.nombre.trim()} ${formulario.apellidos.trim()}`;
    const asunto = encodeURIComponent(`Contacto TechPortfolio - ${nombreCompleto}`);
    const texto = encodeURIComponent([
      `Nombre: ${nombreCompleto}`,
      `Correo: ${formulario.correo.trim()}`,
      `Teléfono: ${formulario.telefono.trim()}`,
      '',
      `Descripción del proyecto:`, formulario.descripcion.trim()
    ].join('\n'));
    const enlace = `mailto:${perfil.email}?subject=${asunto}&body=${texto}`;
    setEnlaceCorreo(enlace);
    // Abre la app de correo; el envío real lo confirma el visitante.
    window.location.href = enlace;
    setMensaje('¡Gracias por tu interés! Los datos se validaron correctamente. Abre el correo preparado y confirma su envío en tu aplicación de correo.');
  }

  return (
    <section className="container section page">
      <PageHeading label="COMUNÍCATE" title="Formulario de" emphasis="contacto">
        Comparte una idea o consulta mediante el siguiente formulario.
      </PageHeading>
      <div className="contact-grid">
        <aside className="contact-aside"><span className="contact-icon"><Mail size={28}/></span>
          <h2>Hablemos de tu idea.</h2>
          <p>El objetivo es ofrecer soluciones tecnológicas prácticas para personas y organizaciones.</p><hr/>
          <p><strong>Canal de contacto:</strong> correo electrónico.</p>
          <p>Al completar el formulario se abre un borrador en tu aplicación de correo. La entrega del mensaje depende de que confirmes el envío desde allí.</p>
        </aside>
        <form className="card contact-form" onSubmit={enviar} noValidate>
          <div className="form-row">
            {[["nombre", "Nombre"], ["apellidos", "Apellidos"]].map(([nombre, etiqueta]) => <label key={nombre}>
              {etiqueta} *
              <input name={nombre} value={formulario[nombre]} onChange={cambiar} maxLength={20} autoComplete={nombre === 'nombre' ? 'given-name' : 'family-name'} aria-invalid={Boolean(errores[nombre])} aria-describedby={errores[nombre] ? `error-${nombre}` : undefined}/>
              {errores[nombre] && <small id={`error-${nombre}`} className="error">{errores[nombre]}</small>}
            </label>)}
          </div>
          <div className="form-row">
            <label>Correo electrónico *<input type="email" name="correo" value={formulario.correo} onChange={cambiar} autoComplete="email" aria-invalid={Boolean(errores.correo)}/>{errores.correo && <small className="error">{errores.correo}</small>}</label>
            <label>Teléfono *<input type="tel" name="telefono" inputMode="numeric" maxLength={15} value={formulario.telefono} onChange={cambiar} autoComplete="tel" aria-invalid={Boolean(errores.telefono)}/>{errores.telefono && <small className="error">{errores.telefono}</small>}</label>
          </div>
          <label>Descripción del proyecto *<textarea name="descripcion" rows={6} value={formulario.descripcion} onChange={cambiar} aria-invalid={Boolean(errores.descripcion)}/>{errores.descripcion && <small className="error">{errores.descripcion}</small>}</label>
          <button type="submit" className="btn blue">Enviar email <ArrowRight size={17}/></button>
          {mensaje && <div role="status" className={enlaceCorreo ? 'success' : 'form-warning'}>
            {enlaceCorreo && <CheckCircle2 size={18}/>} {mensaje}
            {enlaceCorreo && <a className="draft-link" href={enlaceCorreo}>Abrir correo preparado</a>}
          </div>}
          <small>Todos los campos son obligatorios. No se guardan mensajes en un servidor.</small>
        </form>
      </div>
      <section aria-labelledby="testimonios-titulo">
        <div className="timeline-heading"><span className="eyebrow">OPINIONES</span><h2 id="testimonios-titulo">Testimonios</h2><p>Opiniones ficticias para completar esta sección de la interfaz.</p></div>
        <div className="testimonial-grid">
          {testimonios.map(persona => <article className="card testimonial" key={persona.nombre}>
            <strong aria-hidden="true">“</strong><p>{persona.texto}</p>
            <small>{persona.nombre} · {persona.cargo}</small>
          </article>)}
        </div>
      </section>
    </section>
  );
}
