# TechPortfolio — Portafolio profesional de soluciones TI

Proyecto individual de **Interfaces en React 711-2026**, creado con React y Vite para usarse en CodeSandbox.

## Ejecutar en CodeSandbox

1. Importar el repositorio de GitHub (o subir el contenido de este ZIP como proyecto).
2. Ejecutar `npm install` cuando sea necesario.
3. Ejecutar `npm run dev` y abrir la vista previa del servidor Vite.
4. También se puede verificar con `npm run build`.

## Cinco vistas

- `/#/` — Inicio, banner, perfil, tres aspectos de biografía, dos CTA y enlaces sociales.
- `/#/proyectos` — 12 fichas de demostración, 10 por página, filtros por categoría (selector) y tecnología (texto), sidebar de ocho atributos.
- `/#/tecnologias` — tres tecnologías con imagen, estudios, dos espacios de IA y timeline de tres experiencias.
- `/#/contacto` — formulario con validación, cinco testimonios ilustrativos y mensaje de agradecimiento.
- `/#/propuesta` — dos secciones de propuesta de valor y footer.

## Implementación React y JavaScript

- Componentes y Props: `ProjectCard`, `PageHeading`, `Layout`, páginas y otros componentes reutilizables.
- `useState`: menú, formulario, filtros, paginación y proyecto seleccionado.
- `useEffect`: carga asíncrona con `fetch`, cierre del sidebar con Escape y navegación.
- `useContext`: selección de proyecto y apertura/cierre del sidebar.
- Arreglos/objetos, eventos y Promesas: `filter`, `map`, `slice`, `Set`, `onClick`, `onChange`, `onSubmit` y `fetch` con `.then`.

El catálogo está en `public/data/proyectos.json`, con 12 registros. Las tarjetas muestran los 5 atributos **nombre, categoría, tecnología, estado, fecha**; el sidebar presenta esos cinco y también **descripción, imagen, enlace**. El `id` es una clave técnica adicional, no uno de los ocho atributos de negocio.

## Importante: personalización responsable

**Los proyectos son conceptos de demostración, no aplicaciones que se afirme haber desarrollado.** Los testimonios son **ejemplos de maquetación**, no opiniones verificadas. Las tres experiencias laborales están **sin completar**; deben reemplazarse por experiencias reales o consultarse al profesor si se aceptan experiencias académicas. La segunda herramienta de IA está pendiente de indicar con evidencia de uso.

En `src/App.jsx` cambia `PERFIL.nombre`, `PERFIL.linkedin` y `PERFIL.email`, y confirma tus datos académicos. Sustituye las propuestas del JSON por trabajos tuyos cuando tengas evidencias.

El formulario valida nombre/apellidos (solo letras, máximo 20 caracteres), correo, teléfono (solo números) y descripción obligatoria. Usa `mailto:` para preparar el correo en el cliente del visitante: **no envía mensajes automáticamente**. Debes configurar el destinatario y confirmar el envío desde la aplicación de correo.

## Entregables

Repositorio GitHub con README, diapositivas con agenda, introducción, maquetación, línea de diseño, cinco vistas, demo y conclusiones; sustentación de diez minutos con cuatro de demostración. Entregar el código y las diapositivas el domingo anterior a la sustentación y enviar las evidencias por correo institucional.
