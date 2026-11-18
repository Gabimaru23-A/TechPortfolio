# TechPortfolio — Portafolio profesional de soluciones TI

Proyecto individual de **Interfaces en React 711-2026**, creado con React y Vite para usarse en CodeSandbox.

## Ejecutar en CodeSandbox

1. Importar el repositorio de GitHub y trabajar en la carpeta `TechPortfolio-CodeSandbox`.
2. Ejecutar `npm install` para instalar las dependencias.
3. Ejecutar `npm run dev` y abrir la vista previa del servidor Vite.
4. También se puede verificar con `npm run build`.

## Cinco vistas

- `/#/` — Inicio y biografía con perfil académico, intereses y enlaces a Proyectos y Contacto.
- `/#/proyectos` — 12 propuestas académicas, 10 por página, filtros combinables por categoría y tecnología, y panel lateral con ocho atributos.
- `/#/tecnologias` — tres tecnologías, estudios, dos herramientas de IA y tres espacios para registrar experiencia.
- `/#/contacto` — formulario validado para preparar un borrador de correo y cinco testimonios ilustrativos.
- `/#/propuesta` — servicios que puedo aportar y método de trabajo.

## Implementación React y JavaScript

- Las vistas están en `src/pages/` y comparten componentes mediante Props, entre ellos `PageHeading`, `FeatureCard` y `ProjectCard`.
- `useState` controla el menú, el formulario, los filtros, la página y el proyecto seleccionado.
- `useEffect` carga el catálogo con `fetch`, sincroniza el diálogo lateral y actualiza el foco al navegar.
- `useContext` comparte la selección entre las tarjetas y el panel lateral.
- La carga encadena Promesas con `.then` y `.catch`, y usa `AbortController` para cancelar la solicitud al salir de la vista.

El catálogo está en `public/data/proyectos.json`. Las tarjetas muestran **nombre, categoría, tecnología, estado y fecha**. El panel lateral añade **descripción, imagen y enlace**. El campo `id` identifica cada registro internamente. El panel se puede cerrar con su botón, con Escape o con un clic en el fondo cuando queda visible.

## Datos del perfil y fichas

El catálogo presenta propuestas académicas y los testimonios son ejemplos de maquetación. Las experiencias laborales quedan pendientes de registrar con datos reales. La foto de Inicio es una imagen ilustrativa generada para el portafolio.

Los datos personales y enlaces se editan en `src/perfil.js`. Agrega `email` para precargar el destinatario del borrador y `linkedin` para mostrar ese enlace en el sitio.

El formulario valida nombre y apellidos, correo, teléfono y descripción. El enlace `mailto:` abre el borrador en la aplicación de correo del visitante, donde se puede completar el destinatario y enviar el mensaje.

## Entregables

Repositorio GitHub con README, diapositivas con agenda, introducción, maquetación, línea de diseño, cinco vistas, demo y conclusiones; sustentación de diez minutos con cuatro de demostración. Entregar el código y las diapositivas el domingo anterior a la sustentación y enviar las evidencias por correo institucional.
