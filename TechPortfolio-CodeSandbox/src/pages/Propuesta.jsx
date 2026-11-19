import { ArrowRight, CheckCircle2, Layers, Monitor, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading.jsx';

export default function Propuesta() {
  const aportes = [
    'Desarrollo de interfaces web',
    'Organización de información',
    'Documentación y soporte TI'
  ];
  const principios = [
    { titulo: 'Organización', texto: 'Componentes reutilizables y datos estructurados para facilitar los cambios.', icono: Layers },
    { titulo: 'Usabilidad', texto: 'Navegación intuitiva, contenido legible y diseños adaptables.', icono: Monitor },
    { titulo: 'Calidad', texto: 'Validaciones, pruebas funcionales y mantenimiento claro del código.', icono: ShieldCheck }
  ];

  return (
    <section className="container section page">
      <PageHeading label="QUÉ PUEDO APORTAR" title="Mi propuesta de" emphasis="valor">
        Soluciones digitales útiles, con enfoque en usabilidad, organización y evolución tecnológica.
      </PageHeading>
      <section className="value-hero" aria-labelledby="soluciones-titulo">
        <div className="value-art"><img className="value-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Isotipo TP de TechPortfolio"/><small>TECHPORTFOLIO · SOLUCIONES TI</small></div>
        <div><span className="eyebrow">SECCIÓN 01</span><h2 id="soluciones-titulo">Soluciones tecnológicas con propósito</h2>
          <p>Desarrollo de herramientas e interfaces para presentar información, simplificar procesos y facilitar tareas habituales.</p>
          {aportes.map(aporte => <div key={aporte} className="tick"><CheckCircle2 size={18}/>{aporte}</div>)}
        </div>
      </section>
      <section aria-labelledby="metodologia-titulo">
        <div className="timeline-heading"><span className="eyebrow">SECCIÓN 02</span><h2 id="metodologia-titulo">Mi enfoque profesional</h2><p>Aplicar buenas prácticas sin añadir complejidad innecesaria.</p></div>
        <div className="stack-grid">
          {principios.map(({titulo, texto, icono: Icono}) => <article className="card stack-card" key={titulo}>
            <span className="tile-icon"><Icono size={24}/></span><h3>{titulo}</h3><p>{texto}</p>
          </article>)}
        </div>
      </section>
      <div className="value-cta"><div><h2>¿Tienes una idea en mente?</h2><p>Utiliza el formulario para establecer contacto.</p></div><Link to="/contacto" className="btn blue">Ir a contacto <ArrowRight size={17}/></Link></div>
    </section>
  );
}
