import { FileText, Layers, LifeBuoy, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading.jsx';

const soluciones = [
  {
    titulo: 'Desarrollo de interfaces web',
    texto: 'Facilita consultas y solicitudes desde cualquier pantalla con formularios claros, catálogos y flujos de navegación breves.',
    icono: Monitor
  },
  {
    titulo: 'Organización de información',
    texto: 'Encuentra y compara registros que hoy están dispersos mediante fichas coherentes, categorías y filtros.',
    icono: Layers
  },
  {
    titulo: 'Documentación de software',
    texto: 'Entrega al equipo una guía de instalación, configuración y pruebas para que pueda retomar y mantener el proyecto.',
    icono: FileText
  },
  {
    titulo: 'Soporte tecnológico',
    texto: 'Recupera una tarea interrumpida con un diagnóstico documentado, una corrección verificable y pasos para repetir la comprobación.',
    icono: LifeBuoy
  }
];

const etapas = [
  { titulo: 'Identificación de necesidades', texto: 'Definir qué debe resolver la herramienta, quién la usará y qué condiciones debe cumplir.' },
  { titulo: 'Diseño de soluciones', texto: 'Organizar las pantallas y los datos en torno a las tareas que las personas necesitan completar.' },
  { titulo: 'Desarrollo de componentes', texto: 'Construir las vistas con piezas reutilizables y comportamientos coherentes.' },
  { titulo: 'Validación funcional', texto: 'Recorrer las rutas, probar datos válidos e inválidos y comprobar la interacción con teclado y en pantallas pequeñas.' },
  { titulo: 'Mantenimiento y mejora', texto: 'Registrar decisiones y aplicar cambios verificables al contenido, los estilos o la lógica.' }
];

export default function Propuesta() {
  return (
    <section className="container section page value-page">
      <PageHeading label="SERVICIOS Y PROCESO" title="Propuesta de" emphasis="valor">
        Interfaces para consultar datos y completar tareas, con documentación que facilita mantenerlas.
      </PageHeading>

      <section className="value-services" aria-labelledby="soluciones-titulo">
        <div className="section-row">
          <h2 id="soluciones-titulo">Soluciones tecnológicas</h2>
        </div>
        <div className="stack-grid solution-grid">
          {soluciones.map(({ titulo, texto, icono: Icono }) => (
            <article className="card stack-card solution-card" key={titulo}>
              <span className="tile-icon" aria-hidden="true"><Icono size={24} /></span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="value-process" aria-labelledby="metodologia-titulo">
        <div className="timeline-heading">
          <h2 id="metodologia-titulo">Enfoque profesional</h2>
        </div>
        <ol className="process-list" role="list">
          {etapas.map(({ titulo, texto }) => (
            <li className="process-step" key={titulo}>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="value-cta">
        <div>
          <h2>Hablemos de tu proyecto</h2>
          <p>Cuéntanos qué tarea quieres facilitar, quién la realiza y qué información necesita.</p>
        </div>
        <Link to="/contacto" className="btn blue">Contactar</Link>
      </div>
    </section>
  );
}
