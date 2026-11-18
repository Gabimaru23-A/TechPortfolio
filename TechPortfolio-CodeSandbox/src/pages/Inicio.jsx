import { BookOpen, CodeXml, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard.jsx';
import { SocialLinks } from '../components/Layout.jsx';
import { perfil } from '../perfil.js';

const intereses = [
  { icon: BookOpen, title: 'Formación académica', text: 'Estudio cómo organizar la información y convertir necesidades en soluciones que se puedan implementar.' },
  { icon: CodeXml, title: 'Desarrollo web', text: 'Me enfoco en interfaces adaptables con React, JavaScript y CSS.' },
  { icon: FileText, title: 'Documentación y soporte', text: 'Me interesa documentar decisiones y procesos para que otros puedan usar y mantener las aplicaciones.' },
];

export default function Inicio() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="overline">{perfil.nombre}</p>
            <h1>Desarrollo web y <span>soluciones TI</span></h1>
            <p className="hero-intro">Soy estudiante de Sistemas de Información. Diseño interfaces web y exploro formas de simplificar tareas a través de la tecnología.</p>
            <div className="button-group">
              <Link className="button button-accent" to="/proyectos">Ver proyectos</Link>
              <Link className="button button-outline-dark" to="/contacto">Contactar</Link>
            </div>
          </div>
          <img
            className="hero-visual"
            src={`${import.meta.env.BASE_URL}espacio-de-trabajo.jpg`}
            alt=""
            width="1448"
            height="1086"
            fetchPriority="high"
          />
        </div>
      </section>
      <section className="container section" aria-labelledby="biografia">
        <h2 id="biografia">Sobre mí</h2>
        <div className="bio-panel">
          <div>
            <p className="bio-name">{perfil.nombre}</p>
            <p>{perfil.carrera} · {perfil.institucion}</p>
          </div>
          <SocialLinks />
        </div>
        <div className="feature-grid">
          {intereses.map(({ icon, title, text }) => (
            <FeatureCard key={title} icon={icon} title={title}>{text}</FeatureCard>
          ))}
        </div>
      </section>
    </>
  );
}
