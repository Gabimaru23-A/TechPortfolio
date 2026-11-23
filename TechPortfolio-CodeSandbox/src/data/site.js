// Contenido del perfil de demostración y enlaces públicos.
function enlaceLinkedIn(valor) {
  if (!valor) return '';

  try {
    const url = new URL(valor);
    const dominio = url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com');
    const esPerfil = /^\/in\/[^/]+\/?$/.test(url.pathname);
    return url.protocol === 'https:' && dominio && esPerfil && !url.username && !url.password && !url.port
      ? url.href
      : '';
  } catch {
    return '';
  }
}

export const contactoOficial = {
  email: 'techportafolio1@gmail.com',
  especialidad: 'Diseño web y soluciones TI'
};

export const perfil = {
  nombre: 'Alex Rivera',
  rol: 'Desarrollador de interfaces y soluciones TI',
  carrera: 'Tecnología en Sistemas de Información',
  institucion: 'Institución Universitaria Antonio José Camacho',
  biografia: 'Perfil de demostración orientado a convertir registros dispersos y procesos manuales en interfaces que faciliten el trabajo diario.',
  github: 'https://github.com/Gabimaru23-A/TechPortfolio',
  linkedin: enlaceLinkedIn(import.meta.env?.VITE_LINKEDIN_URL),
  avatar: 'images/avatar.svg'
};

export const biografia = [
  { titulo: 'Formación tecnológica', texto: 'Interés en sistemas de información, programación e interfaces web.' },
  { titulo: 'Soluciones empresariales', texto: 'Exploración de herramientas para organizar inventarios, registrar solicitudes y consultar información digital.' },
  { titulo: 'Aprendizaje y calidad', texto: 'Práctica en documentación, validación de formularios y revisión de flujos con teclado y en pantallas pequeñas.' }
];

export const tecnologias = [
  {
    nombre: 'React',
    imagen: 'icons/react.svg',
    descripcion: 'Reutiliza las fichas del catálogo en Inicio y Proyectos. Actualiza la lista al aplicar filtros o cambiar de página.'
  },
  {
    nombre: 'JavaScript',
    imagen: 'icons/javascript.svg',
    descripcion: 'Lee los proyectos desde JSON, combina los criterios de búsqueda y valida cada campo del formulario antes del envío.'
  },
  {
    nombre: 'CSS',
    imagen: 'icons/css.svg',
    descripcion: 'Ajusta tarjetas y menús a cada pantalla, distingue los errores de formulario y mantiene visible el foco del teclado.'
  }
];

export const herramientasIA = [
  { nombre: 'ChatGPT', descripcion: 'Ayudó a concretar los requisitos de las cinco vistas y a plantear casos de uso para el catálogo y el formulario.' },
  { nombre: 'Codex', descripcion: 'Apoyó la revisión de componentes React, el ajuste de validaciones y las pruebas de navegación y envío simulado.' }
];

export const experiencias = [
  { id: 1, cargo: 'Auxiliar de soporte TI', empresa: 'NovaTec Soluciones (ficticia)', periodo: 'Ene 2024 – Jun 2024', descripcion: 'Clasificación de solicitudes de soporte, actualización del inventario de equipos y registro de incidencias.' },
  { id: 2, cargo: 'Practicante de desarrollo web', empresa: 'Ágora Digital (ficticia)', periodo: 'Jul 2024 – Dic 2024', descripcion: 'Creación de tarjetas y formularios en React, con ajustes para pantallas pequeñas y navegación por teclado.' },
  { id: 3, cargo: 'Asistente de calidad de software', empresa: 'Prisma QA (ficticia)', periodo: 'Ene 2025 – Jun 2025', descripcion: 'Preparación de casos de prueba para formularios y documentación de errores con sus pasos de reproducción.' }
];

export const testimonios = [
  { nombre: 'María G.', cargo: 'Coordinación de proyectos (ficticia)', texto: 'La organización del catálogo facilita encontrar soluciones por categoría y tecnología.' },
  { nombre: 'Daniel R.', cargo: 'Analista TI (ficticio)', texto: 'Las fichas de proyecto reúnen la información necesaria para una revisión rápida.' },
  { nombre: 'Laura P.', cargo: 'Diseño de producto (ficticia)', texto: 'La presentación visual resulta clara tanto en computador como en teléfono.' },
  { nombre: 'Andrés C.', cargo: 'Soporte técnico (ficticio)', texto: 'El panel lateral permite revisar características sin perder el listado.' },
  { nombre: 'Valentina S.', cargo: 'Gestión tecnológica (ficticia)', texto: 'El formulario ofrece indicaciones concretas para corregir los datos.' }
];
