# TechPortfolio

Portafolio web de soluciones TI desarrollado con React, JavaScript, Vite y CSS. Presenta un perfil de demostración, un catálogo de doce proyectos y un formulario de solicitudes con Supabase y EmailJS.

## Instalación y ejecución

Requiere Node.js 22 o superior y npm. Desde la raíz del repositorio:

```bash
cd TechPortfolio-CodeSandbox
npm ci
npm run dev
```

Abre la URL que indica Vite. Si abriste la raíz del repositorio en VS Code, puedes usar **Terminal → Ejecutar tarea → TechPortfolio: iniciar Vite** para arrancar el servidor desde la carpeta de la aplicación. Después de cambiar `.env.local`, detén la tarea y vuelve a ejecutarla.

Para verificar el proyecto y previsualizar la compilación:

```bash
npm test
npm run build
npm run preview
```

Vite escribe la compilación en `dist/`. El sitio funciona en un servidor estático y admite publicación desde un subdirectorio. Las rutas usan `HashRouter` y se pueden recargar sin configurar redirecciones en el servidor.

## Despliegue en GitHub Pages

El sitio público está disponible en [TechPortfolio](https://gabimaru23-a.github.io/TechPortfolio/).

GitHub Actions instala las dependencias, ejecuta `npm test` y publica `TechPortfolio-CodeSandbox/dist` al actualizar el código en `main`. La compilación usa el modo `github-pages`, que configura Vite con la base `/TechPortfolio/`. Los enlaces directos a las vistas conservan ese prefijo, por ejemplo [Proyectos](https://gabimaru23-a.github.io/TechPortfolio/#/proyectos). [Workflow de publicación](https://github.com/Gabimaru23-A/TechPortfolio/actions/workflows/pages.yml)

Para revisar esa compilación localmente, ejecuta desde esta carpeta:

```bash
npm run build -- --mode github-pages
npm run preview -- --mode github-pages
```

- En **Settings → Pages → Build and deployment → Source**, GitHub Pages usa **GitHub Actions**. [Ajustes de Pages](https://github.com/Gabimaru23-A/TechPortfolio/settings/pages)
- Tras activar Supabase, añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en **Settings → Secrets and variables → Actions → Variables → Repository variables**. Si ambas están vacías, Contacto ofrece el correo oficial y deshabilita el registro hasta que el backend esté disponible. Para mostrar LinkedIn, agrega `VITE_LINKEDIN_URL` con la URL HTTPS de un perfil real bajo `/in/`. Aplica cambios en las variables desde **Actions → Publicar TechPortfolio en GitHub Pages → Run workflow**, seleccionando `main`. [Variables de Actions](https://github.com/Gabimaru23-A/TechPortfolio/settings/variables/actions)

## Vistas

| Vista | Ruta | Funcionalidad |
| --- | --- | --- |
| Inicio | `#/` | Presentación, tres elementos de biografía, competencias y tres destacados del catálogo. |
| Proyectos | `#/proyectos` | Doce fichas, filtros combinables de categoría y tecnología, diez fichas por página, detalle lateral y reintento de carga. |
| Tecnologías | `#/tecnologias` | Uso de React, JavaScript y CSS, herramientas de IA, formación de ejemplo y tres experiencias ficticias. |
| Propuesta de valor | `#/propuesta` | Soluciones tecnológicas, proceso de trabajo y enlace al formulario. |
| Contacto | `#/contacto` | Registro, verificación por correo, seguimiento y cinco testimonios ficticios. |

El parámetro `proyecto` permite enlazar directamente a una ficha, por ejemplo `#/proyectos?proyecto=TP-003`. El diálogo se puede cerrar con su botón, con Escape o pulsando fuera del panel. Al cerrar, el foco vuelve al botón de la ficha cuando está disponible.

## Configuración de enlaces y contacto

El correo oficial es **techportafolio1@gmail.com**. La configuración pública está en `src/data/site.js`. Contacto y el pie de página lo muestran como enlace de correo.

### Migraciones y Edge Functions

Desde `TechPortfolio-CodeSandbox`, usa la CLI de Supabase 3 con una cuenta autorizada. Revisa el historial y la simulación antes de aplicar las migraciones pendientes.

```bash
npx supabase@3.4.0 login
npx supabase@3.4.0 link --project-ref zuezuzibfkodtjnvlhzw
npx supabase@3.4.0 migration list --remote
npx supabase@3.4.0 db push --remote --dry-run --skip-vault
npx supabase@3.4.0 db push --remote --skip-vault
npx supabase@3.4.0 functions deploy solicitudes --use-api
npx supabase@3.4.0 functions deploy notificar-solicitudes --use-api
```

Las dos primeras migraciones crean el registro y protegen la cola. La tercera registra las invocaciones de Cron y permite consumir cada una una sola vez. `solicitudes` valida la clave publicable, la sesión emitida por Supabase Auth y el correo confirmado del titular. `notificar-solicitudes` autoriza la firma del trabajo programado. Ambas usan `SUPABASE_URL` y las claves de servidor que inyecta la plataforma. Para añadir orígenes locales aparte del puerto `5173`, define la lista completa en `SOLICITUDES_ALLOWED_ORIGINS` bajo **Edge Functions → Secrets**. [Despliegue de Edge Functions](https://supabase.com/docs/guides/functions/deploy) · [Variables de Edge Functions](https://supabase.com/docs/guides/functions/secrets)

### Configurar la verificación por correo

1. En **Supabase → Authentication → URL Configuration**, usa `https://gabimaru23-a.github.io/TechPortfolio/` como **Site URL**. En **Redirect URLs** agrega esa misma URL y `http://localhost:5173/`. Ambas figuran en `supabase/config.toml`. Conserva **Confirm email** habilitado y permite el registro en **Sign In / Providers → Email**. [Enlaces de acceso de Supabase](https://supabase.com/docs/guides/auth/auth-email-passwordless)
2. En **Authentication → Email → SMTP Settings**, configura un servidor SMTP propio para enviar enlaces a visitantes externos y habilitar la edición de plantillas en un proyecto gratuito. El servicio de prueba de Supabase está limitado a cuentas del equipo. Los valores `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` se configuran en `.env.local` y en GitHub Actions. [SMTP de Supabase Auth](https://supabase.com/docs/guides/auth/auth-smtp) · [Despliegue en GitHub Pages](#despliegue-en-github-pages)
3. En **Authentication → Email Templates**, pega el contenido de [confirmar-correo.html](supabase/templates/confirmar-correo.html) en **Confirm signup**, para usuarios nuevos, y en **Magic Link**, para usuarios existentes. Puedes usar el asunto **Confirma tu correo en TechPortfolio** en ambas. La plantilla usa el hash temporal en el fragmento de la URL y permite confirmar desde otro navegador o dispositivo. TechPortfolio también acepta los enlaces predeterminados `{{ .ConfirmationURL }}` en el navegador que los solicitó mediante PKCE. [Plantillas de Auth](https://supabase.com/docs/guides/auth/auth-email-templates) · [Flujo PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

El visitante solicita el enlace con **Confirmar mi correo**. Al volver, TechPortfolio retira los parámetros de autenticación de la URL y abre Contacto. El borrador se cifra en IndexedDB y se puede recuperar durante una hora en el mismo navegador. En otro dispositivo, el enlace con hash muestra el correo confirmado y permite completar el formulario. El navegador conserva la sesión en memoria. El verificador PKCE se guarda con caducidad para que el retorno funcione en otra pestaña.

La solicitud se registra cuando el visitante pulsa **Enviar solicitud** después de confirmar su correo. PostgreSQL asigna un UUID y encola un único correo de recepción en EmailJS. Para consultar el estado, el visitante confirma el correo asociado y usa el UUID de seguimiento. La respuesta contiene el estado y su fecha. Las solicitudes nuevas también quedan vinculadas al identificador de Supabase Auth. Las filas previas conservan la consulta con el código y el correo confirmado.

### Autorizar EmailJS y programar los avisos

1. En **EmailJS → Account → Security → API Settings**, activa **Allow EmailJS API for non-browser applications** y **Use Private Key**. Verifica en la cuenta que un navegador con la clave publicable anterior carezca de permiso para enviar. La aplicación publicada usa exclusivamente el servidor para enviar, incluidas las confirmaciones. [Autorización de EmailJS](https://www.emailjs.com/docs/sdk/options/#privatekey) · [REST de EmailJS](https://www.emailjs.com/docs/rest-api/send/)
2. En **EmailJS → Email Templates → `template_72768ef`**, configura **To Email** con `{{email}}`, **Subject** con `{{asunto}}` y **Cc** y **Reply-To** con `techportafolio1@gmail.com`. Incluye `{{codigo}}` y `{{estado}}` en el cuerpo. Usa la sección condicional para que únicamente la confirmación incluya los detalles. [Variables dinámicas de EmailJS](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/)

   ```html
   <p>Hola, {{nombre}} {{apellidos}}.</p>
   <p>Código de seguimiento: {{codigo}}</p>
   <p>Estado: {{estado}}</p>
   {{#es_confirmacion}}
   <p>Correo: {{email}}</p>
   <p>Teléfono: {{telefono}}</p>
   <p>Empresa: {{empresa}}</p>
   <p>Descripción: {{descripcion}}</p>
   {{#fecha}}<p>Confirmación emitida el {{fecha}}.</p>{{/fecha}}
   {{/es_confirmacion}}
   {{^es_confirmacion}}
   <p>Consulta las novedades en <a href="https://gabimaru23-a.github.io/TechPortfolio/#/contacto">Contacto de TechPortfolio</a> con tu código de seguimiento y tu correo verificado.</p>
   {{/es_confirmacion}}
   ```

3. En **Supabase → Edge Functions → Secrets**, añade `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` y `NOTIFICACIONES_JOB_TOKEN`. Genera el último con 32 bytes aleatorios y guarda el mismo valor en **Supabase → Vault → Create secret** con el nombre `techportfolio_notificaciones_job_token`. Mantén los secretos en Supabase. [Configuración de secretos](https://supabase.com/docs/guides/functions/secrets) · [Vault](https://supabase.com/docs/guides/database/vault)
4. Habilita `pg_cron`, `pg_net` y `pgcrypto` en **Supabase → Database → Extensions**. Con las migraciones aplicadas y el despachador desplegado, ejecuta el siguiente comando desde `TechPortfolio-CodeSandbox`. El archivo actualiza el trabajo existente `techportfolio-notificaciones` para que se ejecute cada minuto. En una instalación nueva, crea primero ese trabajo en **Integrations → Cron → Jobs**. [SQL de configuración](supabase/cron/notificaciones.sql) · [Cron](https://supabase.com/docs/guides/cron/quickstart)

   ```bash
   npx supabase@3.4.0 db query --remote --file supabase/cron/notificaciones.sql
   ```

`pg_net` envía la petición después de confirmar la transacción, así que PostgreSQL solo encola la llamada. El trabajo usa el secreto de Vault para firmar el UUID de la invocación con HMAC-SHA256. La cola de red recibe el UUID y su firma. La Edge Function acepta cada invocación una vez y durante 90 segundos. El historial de Cron registra un error si falta el token de Vault. [Invocar Edge Functions desde Cron](https://supabase.com/docs/guides/functions/schedule-functions) · [Respuestas de pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)

En **Supabase → SQL Editor**, esta consulta relaciona una ejecución con su respuesta HTTP. Un `200` con `procesadas: 0` confirma la autorización y una cola vacía de avisos disponibles.

```sql
select i.creada_en, i.usada_en, r.status_code, r.timed_out, r.error_msg, r.content
from public.invocaciones_notificaciones i
left join net._http_response r on r.id = i.peticion_id
order by i.creada_en desc
limit 10;
```

Desde **Table Editor → public → solicitudes**, el equipo autorizado puede cambiar `estado` a `recibida`, `en_revision`, `en_progreso`, `resuelta` o `cerrada`. El trabajo reserva y procesa un aviso por ejecución. La cola registra `enviada_en` cuando EmailJS lo acepta. Los rechazos explícitos se reintentan hasta seis intentos. Si la entrega es indeterminada o hay una reserva interrumpida, confirma el resultado en **EmailJS → Email History** antes de liberar la reserva o volver a programar el aviso desde **Supabase → Table Editor → notificaciones_solicitud**.

### Prueba de extremo a extremo

1. Usa en Contacto una dirección propia distinta del correo en CC, confirma el enlace recibido y pulsa **Enviar solicitud**. Compara el UUID de pantalla con `codigo` en **Supabase → Table Editor → solicitudes** y con el código en las dos bandejas.
2. Cambia `estado` a `en_revision` en Supabase, revisa `enviada_en` y comprueba que el aviso muestre el mismo UUID y el estado nuevo. Repite la consulta con el correo titular y comprueba que otro correo verificado reciba el mismo resultado que un código desconocido.

## Estructura y manejo de datos

| Ubicación | Contenido |
| --- | --- |
| `src/pages/` | Las cinco vistas de la aplicación. |
| `src/components/` | Navegación, encabezados, filtros, tarjetas, paginación y panel lateral. |
| `src/context/PortfolioContext.jsx` | Carga asíncrona del catálogo con `fetch`, cancelación al desmontar y recuperación ante errores. |
| `src/data/site.js` | Configuración pública y contenido del perfil, la formación, la experiencia y los testimonios. |
| `src/utils/logic.js` | Funciones compartidas de filtrado, paginación y validación. |
| `supabase/` | Migraciones, permisos, validación y funciones de registro, seguimiento y envío servidor a servidor. |
| `src/style.css` | Identidad visual, foco visible y diseños adaptables. |
| `public/` | Catálogo JSON, fotografías, ilustraciones e iconos locales. |
| `tests/` | Pruebas de estructura y lógica con el ejecutor de Node.js. |

Inicio y Proyectos consumen el mismo `public/data/proyectos.json` mediante `useContext`. Las tarjetas muestran nombre, categoría, tecnología, estado y fecha. El panel añade la descripción, la ilustración y el enlace cuando existe. Cada ficha indica si representa una propuesta conceptual.

`useState` mantiene los filtros, la paginación, el estado del menú y el formulario. `useEffect` coordina tareas como la carga del catálogo y la gestión de navegación y del diálogo. `useRef` mantiene las referencias necesarias para mover o recuperar el foco. Las props reciben los datos y los eventos de los componentes reutilizables.

## Pruebas automatizadas

`npm test` comprueba rutas, catálogo, validación, migraciones y la firma de Cron con PostgreSQL local mediante PGlite. Las pruebas de registro, consulta y despacho usan identidades simuladas y un transporte de correo interceptado.

Los recorridos de navegador usan Playwright y arrancan Vite en `127.0.0.1:4175`.

```bash
npx playwright install chromium
npm run test:e2e
```

Si ya tienes Chrome o Edge instalado, puedes ejecutar la suite con `PLAYWRIGHT_CHANNEL` configurado como `chrome` o `msedge`, respectivamente. La suite cubre navegación, catálogo, verificación por correo, registro, consulta de estado y menú móvil. Simula Supabase y bloquea las conexiones externas. Los resultados y las trazas de fallos se guardan en `test-results/`.
