import { ListChecks, PanelsTopLeft, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard.jsx';
import PageHeading from '../components/PageHeading.jsx';

const aportes = [
  { icon: PanelsTopLeft, title: 'Interfaces web', text: 'Organizo el contenido y los controles para que cada persona encuentre lo que necesita desde el celular o el computador.' },
  { icon: ListChecks, title: 'Información estructurada', text: 'Defino los datos que necesita cada proceso para que se puedan consultar, filtrar y actualizar con facilidad.' },
  { icon: Wrench, title: 'Documentación y soporte TI', text: 'Documento cómo usar una herramienta, cómo mantenerla y qué revisar cuando algo falla.' },
];

const enfoque = [
  ['Entender la tarea', 'Identifico quién usará la herramienta, qué necesita hacer y qué información requiere.'],
  ['Construir la interfaz', 'Diseño un flujo claro e implemento los elementos que se repiten como componentes.'],
  ['Validar y documentar', 'Compruebo los recorridos principales y dejo indicaciones para el mantenimiento.'],
];

export default function Propuesta() {
  return (
    <div className="container section page">
      <PageHeading title="Propuesta de valor">
        Diseño herramientas web para que consultar información y completar tareas cotidianas sea más sencillo.
      </PageHeading>
      <section aria-labelledby="aportes">
        <h2 id="aportes">Qué puedo aportar</h2>
        <div className="feature-grid">
          {aportes.map(({ icon, title, text }) => (
            <FeatureCard key={title} icon={icon} title={title}>{text}</FeatureCard>
          ))}
        </div>
      </section>
      <section className="process-panel spaced" aria-labelledby="enfoque">
        <div>
          <h2 id="enfoque">Cómo trabajo</h2>
          <Link className="button button-accent" to="/contacto">Hablemos de tu proyecto</Link>
        </div>
        <ol className="process-list">
          {enfoque.map(([titulo, texto]) => (
            <li key={titulo}><h3>{titulo}</h3><p>{texto}</p></li>
          ))}
        </ol>
      </section>
    </div>
  );
}
