import { ArrowRight, Braces, Github, Layers3, Linkedin, Route, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { perfil, biografia } from '../data/site.js';

export default function Inicio() {
  return (
    <>
      <section className="hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="signal-dot"/> PROYECTO ACADÉMICO · SOLUCIONES TI</span>
            <h1>Ideas digitales.<br/>Soluciones con <span className="hero-gradient">estructura y propósito.</span></h1>
            <p>{perfil.presentacion} Este portafolio reúne una aplicación React y propuestas conceptuales presentadas con claridad.</p>
            <div className="actions">
              <Link className="btn mint" to="/proyectos">Explorar proyectos <ArrowRight size={17}/></Link>
              <Link className="btn glass" to="/contacto">Hablemos de tu idea <ArrowRight size={17}/></Link>
            </div>
            <div className="hero-facts" aria-label="Resumen del portafolio">
              <div><small>APLICACIÓN</small><strong>React + JavaScript</strong></div>
              <div><small>CONTENIDO</small><strong>5 vistas conectadas</strong></div>
              <div><small>CATÁLOGO</small><strong>12 fichas de proyecto</strong></div>
            </div>
          </div>
          <div className="hero-overview">
            <div className="hero-profile">
              <div className="hero-profile-main">
                <img src={`${import.meta.env.BASE_URL}${perfil.avatar}`} alt="" />
                <div><span className="profile-label">PERFIL DE EJEMPLO</span><h2>{perfil.nombre}</h2><p>{perfil.rol}</p></div>
              </div>
              <div className="hero-tags"><span>React</span><span>JavaScript</span><span>CSS</span><span>Interfaces web</span></div>
              <div className="hero-profile-links"><Link to="/tecnologias">Ver formación <ArrowRight size={15}/></Link><a href={perfil.github} target="_blank" rel="noreferrer">GitHub <ArrowRight size={15}/></a></div>
            </div>
            <div className="hero-capabilities">
              <article><Braces size={21}/><span>DESARROLLO</span><h3>Interfaces en React</h3><p>Componentes reutilizables y vistas conectadas.</p></article>
              <article><Layers3 size={21}/><span>ORGANIZACIÓN</span><h3>Datos claros</h3><p>Catálogo con filtros, fichas y paginación.</p></article>
              <article><Route size={21}/><span>EXPERIENCIA</span><h3>Navegación útil</h3><p>Información accesible en escritorio y móvil.</p></article>
              <article><ShieldCheck size={21}/><span>CALIDAD</span><h3>Validación y pruebas</h3><p>Formularios comprobados y lógica verificable.</p></article>
            </div>
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
