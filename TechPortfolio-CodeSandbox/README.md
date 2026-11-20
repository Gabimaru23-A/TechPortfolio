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
| Contacto | `#/contacto` | Validación de cinco campos, envío mediante EmailJS, borrador alternativo y cinco testimonios ficticios. |

El parámetro `proyecto` permite enlazar directamente a una ficha, por ejemplo `#/proyectos?proyecto=TP-003`. El diálogo se puede cerrar con su botón, con Escape o pulsando fuera del panel. Al cerrar, el foco vuelve al botón de la ficha cuando está disponible.

## Configuración de enlaces y contacto

El correo oficial es **techportafolio1@gmail.com**. La configuración pública está en `src/data/site.js`. Contacto y el pie de página lo muestran como enlace de correo.

### Activar el envío directo

1. En EmailJS, abre **Email Services**, añade Gmail y autoriza la cuenta oficial desde el panel del proveedor. Copia el **Service ID**. [Conectar un servicio](https://www.emailjs.com/docs/tutorial/adding-email-service/)
2. En **Email Templates**, crea una plantilla de contacto. En **To Email**, escribe `techportafolio1@gmail.com` como valor fijo. En **From Email**, usa la dirección del servicio autorizado. En **Reply-To**, escribe `{{correo}}`. Deja **Cc** y **Bcc** vacíos. Guarda y copia el **Template ID**. [Crear una plantilla](https://www.emailjs.com/docs/tutorial/creating-email-template/)

   Usa el asunto `Nueva solicitud TechPortfolio — {{nombre_completo}}` y este cuerpo en el editor HTML:

   ```html
   <p>Nombre completo: {{nombre_completo}}</p>
   <p>Correo del solicitante: {{correo}}</p>
   <p>Teléfono: {{telefono}}</p>
   <p>Descripción:</p>
   <div style="white-space: pre-wrap">{{descripcion}}</div>
   <p>Origen: Formulario de contacto TechPortfolio</p>
   <p>Fecha de solicitud (UTC): {{fecha_solicitud}}</p>
   ```

   La fecha de solicitud proviene del navegador. Consulta la cabecera del mensaje en Gmail para confirmar cuándo se recibió.

3. Copia `.env.example` a `.env.local` y rellena `VITE_EMAILJS_SERVICE_ID` y `VITE_EMAILJS_TEMPLATE_ID`. En **Account**, copia la **Public Key** a `VITE_EMAILJS_PUBLIC_KEY`. `VITE_LINKEDIN_URL` sigue siendo opcional y admite una URL HTTPS de perfil bajo `/in/`.
4. Reinicia Vite. Para habilitar el envío en el sitio publicado, configura esas variables públicas antes de ejecutar `npm run build` y publica la nueva compilación.

El formulario exige cinco campos. Nombres y apellidos admiten hasta 20 letras sin espacios, incluidas tildes y ñ. El correo admite dominios empresariales y personales. El teléfono requiere solo dígitos y la descripción debe tener contenido.

Con los tres identificadores configurados, **Enviar solicitud** llama a EmailJS desde el navegador. Durante la petición se bloquea otro envío. El formulario se limpia después de la confirmación del proveedor. Si falta configuración, ofrece un borrador `mailto:`. Si falla la petición, conserva los campos y también permite abrir un borrador. [API de envío de EmailJS](https://www.emailjs.com/docs/rest-api/send/)

### Seguridad y prueba de recepción

Los valores `VITE_*` son visibles en el navegador. Mantén las contraseñas y claves privadas fuera de esas variables y de Git. Fija el destinatario en la plantilla, conserva las llaves dobles para escapar el contenido y limita los orígenes permitidos a tu sitio y al origen local durante las pruebas. Las validaciones y el bloqueo del botón protegen la interacción normal, mientras que el control de abuso y la cuota dependen del proveedor. EmailJS procesa los datos para entregar la solicitud. [Variables de plantilla](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/) · [Orígenes permitidos](https://www.emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist/)

Con el servicio autorizado, abre Contacto y envía una solicitud con datos de prueba y una descripción identificable. Comprueba la confirmación en la página, el registro de EmailJS y la recepción en la bandeja del correo oficial (incluida la carpeta de spam). Verifica asunto, contenido y dirección de respuesta. Si una petición vence o se interrumpe, consulta el registro antes de repetirla. La confirmación de EmailJS indica aceptación por el proveedor. La comprobación de recepción requiere acceso a la bandeja.

## Estructura y manejo de datos

| Ubicación | Contenido |
| --- | --- |
| `src/pages/` | Las cinco vistas de la aplicación. |
| `src/components/` | Navegación, encabezados, filtros, tarjetas, paginación y panel lateral. |
| `src/context/PortfolioContext.jsx` | Carga asíncrona del catálogo con `fetch`, cancelación al desmontar y recuperación ante errores. |
| `src/data/site.js` | Configuración pública y contenido del perfil, la formación, la experiencia y los testimonios. |
| `src/utils/logic.js` | Funciones compartidas de filtrado, paginación, validación y codificación del borrador. |
| `src/utils/email.js` | Configuración pública y envío de solicitudes a EmailJS. |
| `src/style.css` | Identidad visual, foco visible y diseños adaptables. |
| `public/` | Catálogo JSON, fotografías, ilustraciones e iconos locales. |
| `tests/` | Pruebas de estructura y lógica con el ejecutor de Node.js. |

Inicio y Proyectos consumen el mismo `public/data/proyectos.json` mediante `useContext`. Las tarjetas muestran nombre, categoría, tecnología, estado y fecha. El panel añade la descripción, la ilustración y el enlace cuando existe. Cada ficha indica si representa una propuesta conceptual.

`useState` mantiene los filtros, la paginación, el estado del menú y el formulario. `useEffect` coordina tareas como la carga del catálogo y la gestión de navegación y del diálogo. `useRef` mantiene las referencias necesarias para mover o recuperar el foco. Las props reciben los datos y los eventos de los componentes reutilizables.

## Pruebas automatizadas

`npm test` comprueba las rutas, el catálogo, la validación de contactos, la creación del borrador y la integración con EmailJS mediante respuestas simuladas.
