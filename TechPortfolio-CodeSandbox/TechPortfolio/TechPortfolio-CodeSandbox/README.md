# TechPortfolio — React + Vite

Portafolio profesional de soluciones TI desarrollado como proyecto individual de **Interfaces en React 711-2026**.

> El sitio funciona como aplicación completa de cinco vistas. Algunos textos del perfil, las experiencias y los testimonios son **ficticios** y están identificados como tales para probar la interfaz. Las 12 fichas son propuestas conceptuales, no aplicaciones independientes terminadas.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre la URL local que muestre Vite. Para verificar pruebas y compilación:

```bash
npm test
npm run build
```

Si partes del repositorio, la aplicación está en la carpeta `TechPortfolio-CodeSandbox`.

## Estructura del proyecto

- `src/pages/Inicio.jsx`: banner, presentación, biografía, redes y CTA.
- `src/pages/Proyectos.jsx`: catálogo de 12 proyectos, carga con Promesas, filtros y paginación.
- `src/pages/Tecnologias.jsx`: stack con imágenes, estudios, IA y timeline de tres experiencias.
- `src/pages/Contacto.jsx`: validación de cinco campos, agradecimiento y cinco testimonios.
- `src/pages/Propuesta.jsx`: dos secciones de propuesta de valor.
- `src/components/`: navbar/footer, tarjetas, filtros, paginación y sidebar.
- `src/context/PortfolioContext.jsx`: proyecto seleccionado compartido con `useContext`.
- `src/data/site.js`: contenido de perfil, experiencias y testimonios.
- `public/data/proyectos.json`: catálogo de 12 registros con ocho atributos comerciales (más ID interno).
- `src/utils/logic.js`: lógica comprobable de filtros, paginación y validaciones.
- `tests/logic.test.mjs`: pruebas con Node.js.
- `docs/`: matriz de requisitos y guion de sustentación.

## Requisitos React y JavaScript

- **Props:** componentes de tarjeta, filtros y paginación.
- **useState:** formulario, filtros, página, carga y sidebar.
- **useEffect:** recuperación asíncrona del JSON, encabezados y diálogo lateral.
- **useContext:** estado compartido del proyecto seleccionado.
- **Arreglos y objetos:** funciones `filter`, `map`, `slice`, `Set` y objetos JSON.
- **Promesas:** `fetch(...).then(...).catch(...)`.
- **Eventos:** cambios de campo, clics, envío de formularios y cierre de diálogo.

## Catalogación y formulario

Las tarjetas muestran **nombre, categoría, tecnología, estado y fecha**. El sidebar añade **descripción, imagen y enlace**, ocho campos en total. Los dos filtros se aplican conjuntamente y la paginación muestra **10 registros por página**.

El formulario exige nombre, apellidos (máximo 20 letras), correo válido, teléfono numérico y descripción. `mailto:` abre un **borrador**; no constituye envío automático y no requiere backend. **Para enviar correos reales, configura `perfil.email` en `src/data/site.js`**. No guardamos los datos enviados.

## Personalización final

Sustituye el perfil de ejemplo, las tres experiencias ficticias y los cinco testimonios ficticios por datos verificables. El botón LinkedIn abre su sitio principal y debe reemplazarse por el perfil correcto. Si el profesor no acepta tres experiencias ficticias, utiliza experiencias reales o solicita autorización para presentar proyectos académicos equivalentes.

## Entrega académica

El documento del curso pide GitHub con README, diapositivas y sustentación oral de 10 minutos (4 de demo). Las diapositivas deben incluir agenda, introducción, maquetación, línea de diseño, las cinco vistas, demo y conclusiones.
