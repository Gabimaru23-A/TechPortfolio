import { ArrowRight, CheckCircle2, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { perfil, biografia } from '../data/site.js';

export default function Inicio() {
  return (
    <>
      <section className="hero">
        <div className="container hero-layout">
          <div>
            <span className="hero-kicker">● PORTAFOLIO DE SOLUCIONES TECNOLÓGICAS</span>
            <h1>Ideas digitales.<br/><strong>Soluciones que</strong><br/>funcionan.</h1>
            <p>{perfil.presentacion}</p>
            <div className="actions">
              <Link className="btn mint" to="/proyectos">Explorar proyectos <ArrowRight size={17}/></Link>
              <Link className="btn glass" to="/contacto">Contactar <ArrowRight size={17}/></Link>
            </div>
          </div>
          <div className="hero-screen" aria-label="Ilustración de una aplicación en React">
            <div className="screen-top"><span>● ● ●</span> techportfolio.jsx</div>
            <pre><span>const</span> developer = {'{'}{'\n'}  enfoque: 'soluciones TI',{'\n'}  objetivos: [{'\n'}    'Crear',{'\n'}    'Aprender',{'\n'}    'Mejorar'{'\n'}  ]{'\n'}{'}'};</pre>
            <div className="screen-status"><CheckCircle2 size={15}/> Aplicación construida con React</div>
          </div>
        </div>
      </section>
      <section className="container section" id="biografia">
        <div className="intro-grid"><div><span className="eyebrow">SOBRE MÍ</span><h2>Presentación y <em>biografía</em></h2></div><p>{perfil.biografia}</p></div>
        <div className="bio-grid">
          <article className="card bio-profile">
            <img className="avatar-image" src={`${import.meta.env.BASE_URL}${perfil.avatar}`} alt="Avatar ilustrativo del perfil"/>
            <span className="eyebrow">PERFIL PROFESIONAL</span>
            <h3>{perfil.nombre}</h3>
            <p>{perfil.rol}<br/>{perfil.carrera}<br/>{perfil.institucion}</p><hr/>
            <p>{perfil.biografia}</p>
            <div className="social">
              <a href={perfil.github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a>
              <a href={perfil.linkedin} target="_blank" rel="noreferrer"><Linkedin size={17}/> LinkedIn</a>
            </div>
          </article>
          <div className="biography-items">
            {biografia.map(item => <article className="card biography-row" key={item.numero}><strong>{item.numero}</strong><div><h3>{item.titulo}</h3><p>{item.texto}</p></div></article>)}
          </div>
        </div>
      </section>
      <section className="soft-strip">
        <div className="container strip"><div><span className="eyebrow">EXPLORA</span><h2>Conoce los proyectos y propuestas</h2><p>Consulta los proyectos, aplica filtros y revisa sus características.</p></div><Link to="/proyectos" className="btn blue">Ver proyectos <ArrowRight size={17}/></Link></div>
      </section>
    </>
  );
}
