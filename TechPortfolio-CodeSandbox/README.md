# TechPortfolio

Portafolio web de soluciones TI desarrollado con React, JavaScript, Vite y CSS. Presenta un perfil de demostración, un catálogo de doce proyectos y un formulario de solicitudes con EmailJS.

## Instalación y ejecución

Requiere Node.js 22 o superior y npm. Desde la raíz del repositorio:

```bash
cd TechPortfolio-CodeSandbox
npm ci
npm run dev
```

Abre la URL que indica Vite. Para verificar el proyecto y previsualizar la compilación:

```bash
npm test
npm run build
npm run preview
```

Vite escribe la compilación en `dist/`. El sitio funciona en un servidor estático y admite publicación desde un subdirectorio. Las rutas usan `HashRouter` y se pueden recargar sin configurar redirecciones en el servidor.

## Vistas

| Vista | Ruta | Funcionalidad |
| --- | --- | --- |
| Inicio | `#/` | Presentación, tres elementos de biografía, competencias y tres destacados del catálogo. |
| Proyectos | `#/proyectos` | Doce fichas, filtros combinables de categoría y tecnología, diez fichas por página, detalle lateral y reintento de carga. |
| Tecnologías | `#/tecnologias` | Uso de React, JavaScript y CSS, herramientas de IA, formación de ejemplo y tres experiencias ficticias. |
| Propuesta de valor | `#/propuesta` | Soluciones tecnológicas, proceso de trabajo y enlace al formulario. |
| Contacto | `#/contacto` | Cinco campos obligatorios, empresa opcional, envío mediante EmailJS y cinco testimonios ficticios. |

El parámetro `proyecto` permite enlazar directamente a una ficha, por ejemplo `#/proyectos?proyecto=TP-003`. El diálogo se puede cerrar con su botón, con Escape o pulsando fuera del panel. Al cerrar, el foco vuelve al botón de la ficha cuando está disponible.

## Configuración de enlaces y contacto

El correo oficial es **techportafolio1@gmail.com**. La configuración pública está en `src/data/site.js`. Contacto y el pie de página lo muestran como enlace de correo.

### Activar el envío directo

El SDK [@emailjs/browser](https://www.emailjs.com/docs/sdk/send/) usa la plantilla existente `template_72768ef`. La plantilla envía la confirmación a `{{email}}` y la copia CC a `techportafolio1@gmail.com`.

1. En el panel de EmailJS, abre **Email Services**, selecciona el servicio autorizado y copia su **Service ID**. Abre **Account → General** y copia la **Public Key**.
2. Edita `TechPortfolio-CodeSandbox/.env.local`, junto a `package.json`. Si el archivo no existe, créalo a partir de `.env.example`. Asigna el Service ID a `VITE_EMAILJS_SERVICE_ID` y la Public Key a `VITE_EMAILJS_PUBLIC_KEY`. La variable antigua `VITE_CONTACT_EMAIL` no configura el servicio. `VITE_LINKEDIN_URL` sigue siendo opcional.
3. Reinicia Vite. Para habilitar el envío en el sitio publicado, configura las dos variables de EmailJS en el entorno de compilación, ejecuta `npm run build` y publica la nueva compilación.

El formulario conserva los cinco campos obligatorios y añade **Empresa** como campo opcional. La plantilla recibe exactamente `nombre`, `apellidos`, `email`, `telefono`, `descripcion` y `empresa`. Si Empresa está vacía se envía `No aplica`.

Durante la petición se bloquean envíos duplicados y se muestra el estado de carga. La confirmación y la limpieza del formulario requieren una respuesta satisfactoria de EmailJS. Si falla la petición, se conservan los campos. Si faltan los valores de configuración, el botón queda deshabilitado y el correo oficial permanece visible.

### Seguridad y prueba de recepción

Las variables con prefijo `VITE_` son visibles en el navegador. Usa solo el Service ID y la Public Key, mantén el CC fijo en la plantilla y limita en EmailJS los orígenes autorizados. [Orígenes permitidos](https://www.emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist/)

Con el servicio configurado, envía una solicitud desde Contacto usando una dirección propia. Comprueba que la confirmación muestre el nombre y los apellidos correctamente y que la bandeja oficial reciba por CC los seis datos. Prueba una vez con Empresa y otra dejándola vacía. La respuesta del SDK confirma la aceptación por el proveedor y la entrega se comprueba en ambas bandejas.


## Estructura y manejo de datos

| Ubicación | Contenido |
| --- | --- |
| `src/pages/` | Las cinco vistas de la aplicación. |
| `src/components/` | Navegación, encabezados, filtros, tarjetas, paginación y panel lateral. |
| `src/context/PortfolioContext.jsx` | Carga asíncrona del catálogo con `fetch`, cancelación al desmontar y recuperación ante errores. |
| `src/data/site.js` | Configuración pública y contenido del perfil, la formación, la experiencia y los testimonios. |
| `src/utils/logic.js` | Funciones compartidas de filtrado, paginación y validación. |
| `src/utils/email.js` | Configuración pública y envío de solicitudes a EmailJS. |
| `src/style.css` | Identidad visual, foco visible y diseños adaptables. |
| `public/` | Catálogo JSON, fotografías, ilustraciones e iconos locales. |
| `tests/` | Pruebas de estructura y lógica con el ejecutor de Node.js. |

Inicio y Proyectos consumen el mismo `public/data/proyectos.json` mediante `useContext`. Las tarjetas muestran nombre, categoría, tecnología, estado y fecha. El panel añade la descripción, la ilustración y el enlace cuando existe. Cada ficha indica si representa una propuesta conceptual.

`useState` mantiene los filtros, la paginación, el estado del menú y el formulario. `useEffect` coordina tareas como la carga del catálogo y la gestión de navegación y del diálogo. `useRef` mantiene las referencias necesarias para mover o recuperar el foco. Las props reciben los datos y los eventos de los componentes reutilizables.

## Pruebas automatizadas

`npm test` comprueba las rutas, el catálogo, la validación de contactos y el contrato del formulario con EmailJS.
