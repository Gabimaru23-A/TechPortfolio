# Guion de sustentación — 10 minutos

## 0:00–1:00 Introducción y problema
Presentar TechPortfolio como portafolio de soluciones TI para organizar información de perfil, proyectos y contacto. Justificar el uso de React.

## 1:00–2:00 Maquetación y diseño
Mostrar navegación, distribución visual, componentes reutilizables, adaptación responsive y colores corporativos.

## 2:00–3:00 React y JavaScript
Explicar Props de tarjetas, `useState` de filtros, `useEffect` para `fetch`, `useContext` para sidebar y Promesas de carga.

## 3:00–4:00 Modelo de datos y alcance
Mostrar `proyectos.json`: 12 fichas, cinco propiedades en tarjetas y ocho en detalle. Aclarar que son propuestas conceptuales.

## 4:00–8:00 Demostración funcional (4 minutos)
1. Inicio (30 s): banner, biografía, redes y CTA.
2. Proyectos (90 s): primera página con 10, segunda con 2, filtrar por React y categoría, limpiar, abrir/cerrar sidebar.
3. Stack (45 s): tres logos, dos herramientas IA y tres entradas del timeline (ficticias).
4. Contacto (55 s): enviar formulario vacío, ver errores; completar datos válidos, ver agradecimiento y abrir borrador de correo sin prometer envío automático.
5. Propuesta de valor (20 s): dos secciones, footer y navegación.

## 8:00–10:00 Conclusiones y preguntas
Justificar ausencia de backend y base de datos: no son requeridos para el catálogo y contacto se implementa con `mailto:`. Confirmar que contenido de perfil/testimonios/experiencias es ficticio para pruebas.

## Preguntas frecuentes
- **¿Qué es un componente?** Una parte reutilizable de la interfaz que React renderiza según propiedades y estado.
- **¿Qué son las Props?** Entradas que recibe un componente desde su padre.
- **¿Por qué useState?** Para actualizar filtros, páginas y valores de formulario.
- **¿Para qué useEffect?** Para cargar información al montar una vista o sincronizar efectos externos.
- **¿Cómo se usa useContext?** Para compartir el proyecto seleccionado entre tarjeta y sidebar sin cadenas largas de Props.
- **¿Dónde hay Promesas?** En `fetch` de `public/data/proyectos.json`.
- **¿Cómo se pagina?** Se filtra primero y luego se divide el arreglo en grupos de diez con `slice`.
- **¿Se envía el correo automáticamente?** No: abre un borrador con `mailto:` y el usuario confirma el envío.
- **¿Los testimonios son reales?** No: están identificados como ficticios para evaluación funcional.
