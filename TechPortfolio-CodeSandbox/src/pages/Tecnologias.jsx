import { Blocks, BookOpen, CodeXml, PanelsTopLeft, Sparkles } from 'lucide-react';
import FeatureCard from '../components/FeatureCard.jsx';
import PageHeading from '../components/PageHeading.jsx';
import { perfil } from '../perfil.js';

const herramientas = [
  { icon: Blocks, title: 'React', text: 'Componentes reutilizables, gestión del estado y navegación entre vistas.' },
  { icon: CodeXml, title: 'JavaScript', text: 'Eventos, filtrado de datos y carga asíncrona del catálogo mediante Promesas.' },
  { icon: PanelsTopLeft, title: 'CSS', text: 'Jerarquía visual, cuadrículas adaptables y estados de foco.' },
];

const etapasExperiencia = ['Primera experiencia', 'Segunda experiencia', 'Tercera experiencia'];

export default function Tecnologias() {
  return (
    <div className="container section page">
      <PageHeading title="Tecnologías y estudios">
        Mi formación y las herramientas que aplico en este portafolio.
      </PageHeading>
      <section aria-labelledby="herramientas">
        <h2 id="herramientas">Herramientas de desarrollo</h2>
        <div className="feature-grid">
          {herramientas.map(({ icon, title, text }) => (
            <FeatureCard key={title} icon={icon} title={title}>{text}</FeatureCard>
          ))}
        </div>
      </section>
      <div className="split-grid spaced">
        <section className="card info-panel" aria-labelledby="estudios">
          <span className="tile-icon"><BookOpen size={22} aria-hidden="true" /></span>
          <h2 id="estudios">Estudios</h2>
          <h3>{perfil.carrera}</h3>
          <p>{perfil.institucion}</p>
        </section>
        <section className="card info-panel" aria-labelledby="inteligencia-artificial">
          <span className="tile-icon"><Sparkles size={22} aria-hidden="true" /></span>
          <h2 id="inteligencia-artificial">Herramientas de IA</h2>
          <dl className="tool-list">
            <div><dt>ChatGPT</dt><dd>Apoyo en el diseño y la revisión de código.</dd></div>
            <div><dt>Codex</dt><dd>Implementación y verificación de la aplicación.</dd></div>
          </dl>
        </section>
      </div>
      <section className="spaced" aria-labelledby="experiencia">
        <h2 id="experiencia">Experiencia laboral</h2>
        <p className="muted">Espacios para registrar cargos, periodos y actividades.</p>
        <ol className="timeline">
          {etapasExperiencia.map(titulo => (
            <li key={titulo}><h3>{titulo}</h3><p>Pendiente de registrar</p></li>
          ))}
        </ol>
      </section>
    </div>
  );
}
