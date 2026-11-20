# TechPortfolio

Portafolio web de soluciones TI desarrollado con React, JavaScript, Vite y CSS. Presenta un perfil de demostración, un catálogo de doce proyectos y un formulario para preparar borradores de correo.

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
| Contacto | `#/contacto` | Validación de cinco campos, borrador de correo y cinco testimonios ficticios. |

El parámetro `proyecto` permite enlazar directamente a una ficha, por ejemplo `#/proyectos?proyecto=TP-003`. El diálogo se puede cerrar con su botón, con Escape o pulsando fuera del panel. Al cerrar, el foco vuelve al botón de la ficha cuando está disponible.

## Configuración de enlaces y contacto

Copia `.env.example` a `.env.local`. Define solo los datos públicos que corresponda configurar:

- `VITE_CONTACT_EMAIL` recibe la dirección destinataria del formulario. También se puede definir en `perfil.email` en `src/data/site.js`.
- `VITE_LINKEDIN_URL` recibe la URL HTTPS de un perfil de LinkedIn bajo `/in/`. Si está vacía o tiene otro formato, el sitio indica que el perfil está pendiente de configuración.

Reinicia Vite después de cambiar estas variables. Los valores con prefijo `VITE_` se incluyen en el código del navegador y deben ser datos públicos.

El formulario admite hasta 20 letras en el nombre y los apellidos, incluidas letras acentuadas y ñ. También exige un correo con formato válido, un teléfono de solo dígitos y una descripción con contenido. Muestra errores por campo y conserva los datos ingresados.

Con un destinatario configurado y datos válidos, el formulario ofrece **Abrir borrador de correo**. El enlace `mailto:` incluye destinatario, asunto y cuerpo. El visitante revisa y envía el mensaje desde su cliente de correo. Si falta el destinatario, el formulario muestra un aviso de configuración. La aplicación no almacena mensajes.

## Estructura y manejo de datos

| Ubicación | Contenido |
| --- | --- |
| `src/pages/` | Las cinco vistas de la aplicación. |
| `src/components/` | Navegación, encabezados, filtros, tarjetas, paginación y panel lateral. |
| `src/context/PortfolioContext.jsx` | Carga asíncrona del catálogo con `fetch`, cancelación al desmontar y recuperación ante errores. |
| `src/data/site.js` | Configuración pública y contenido del perfil, la formación, la experiencia y los testimonios. |
| `src/utils/logic.js` | Funciones compartidas de filtrado, paginación, validación y codificación del borrador. |
| `src/style.css` | Identidad visual, foco visible y diseños adaptables. |
| `public/` | Catálogo JSON, fotografías, ilustraciones e iconos locales. |
| `tests/` | Pruebas de estructura y lógica con el ejecutor de Node.js. |

Inicio y Proyectos consumen el mismo `public/data/proyectos.json` mediante `useContext`. Las tarjetas muestran nombre, categoría, tecnología, estado y fecha. El panel añade la descripción, la ilustración y el enlace cuando existe. Cada ficha indica si representa una propuesta conceptual.

`useState` mantiene los filtros, la paginación, el estado del menú y el formulario. `useEffect` coordina tareas como la carga del catálogo y la gestión de navegación y del diálogo. `useRef` mantiene las referencias necesarias para mover o recuperar el foco. Las props reciben los datos y los eventos de los componentes reutilizables.

## Pruebas automatizadas

`npm test` comprueba las rutas y los recursos locales, la estructura del catálogo, los filtros combinados, la paginación, la validación de contactos y la creación del enlace `mailto:`, incluida su codificación.
