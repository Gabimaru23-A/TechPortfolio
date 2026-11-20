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

export const perfil = {
  nombre: 'Alex Rivera',
  rol: 'Desarrollador de interfaces y soluciones TI',
  carrera: 'Tecnología en Sistemas de Información',
  institucion: 'Institución Universitaria Antonio José Camacho',
  biografia: 'Perfil de demostración orientado a convertir registros dispersos y procesos manuales en interfaces que faciliten el trabajo diario.',
  github: 'https://github.com/Gabimaru23-A/TechPortfolio',
  linkedin: enlaceLinkedIn(import.meta.env?.VITE_LINKEDIN_URL),
  email: '',
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
    descripcion: 'Comparte los datos del catálogo entre Inicio y Proyectos y actualiza las tarjetas cuando cambian los filtros o la página activa.'
  },
  {
    nombre: 'JavaScript',
    imagen: 'icons/javascript.svg',
    descripcion: 'Carga las fichas desde un archivo JSON, combina los filtros del catálogo y valida cada campo antes de preparar el borrador de contacto.'
  },
  {
    nombre: 'CSS',
    imagen: 'icons/css.svg',
    descripcion: 'Adapta las cuadrículas y el menú al ancho disponible, da estilo a los estados de error y hace visible el foco de teclado.'
  }
];

export const herramientasIA = [
  { nombre: 'ChatGPT', descripcion: 'Apoyo para desglosar los requisitos de las cinco vistas y redactar escenarios de uso del catálogo y el formulario.' },
  { nombre: 'Codex', descripcion: 'Apoyo en la revisión de componentes, la corrección de validaciones y la ejecución de pruebas del proyecto.' }
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
