# Matriz de requisitos del proyecto

| Criterio | Ubicación | Cómo comprobarlo |
| --- | --- | --- |
| Header, navbar y footer | `components/Layout.jsx` | Navegar las cinco vistas |
| Banner, biografía y CTA | `pages/Inicio.jsx` | Abrir Inicio y usar ambos botones |
| Tres elementos biográficos | `data/site.js` y `pages/Inicio.jsx` | Contar tres tarjetas |
| Dos redes sociales | `components/Layout.jsx`, `pages/Inicio.jsx` | Abrir GitHub y LinkedIn (enlace genérico) |
| 10 proyectos por página | `pages/Proyectos.jsx`, `utils/logic.js` | Primera página 10; segunda 2 |
| Cinco propiedades por tarjeta | `components/ProjectCard.jsx` | Nombre, categoría, tecnología, estado, fecha |
| Ocho propiedades en sidebar | `components/ProjectSidebar.jsx` | Abrir Ver detalle |
| Dos filtros | `components/ProjectFilters.jsx` | Categoría y tecnología |
| Filtrar / limpiar | `components/ProjectFilters.jsx` | Aplicar y limpiar filtros |
| Tres tarjetas con imágenes | `pages/Tecnologias.jsx` | Ver logotipos SVG |
| Dos herramientas IA | `data/site.js`, `pages/Tecnologias.jsx` | ChatGPT y Codex |
| Tres experiencias | `data/site.js`, `pages/Tecnologias.jsx` | Timeline (datos ficticios) |
| Cinco campos y validaciones | `pages/Contacto.jsx`, `utils/logic.js` | Probar inválidos y válidos |
| Enviar correo | `pages/Contacto.jsx` | Abre borrador mailto (requiere confirmar envío) |
| Mensaje de agradecimiento | `pages/Contacto.jsx` | Completar correctamente |
| Cinco testimonios | `data/site.js`, `pages/Contacto.jsx` | Cinco tarjetas ficticias |
| Propuesta de valor, 2 secciones | `pages/Propuesta.jsx` | Revisar ambas secciones |
| Props, useState, useEffect, useContext | `src/pages`, `components`, `context` | Inspeccionar imports y usos |
| Promesas, arreglos y objetos | `pages/Proyectos.jsx`, `utils/logic.js` | Inspeccionar y probar |
| README y GitHub | `README.md` | Ver documentación e historial Git |

Nota: los contenidos personales ficticios permiten verificar la interfaz, pero no acreditan experiencias laborales reales. La compilación visual debe comprobarse en el ordenador con `npm run build`.
