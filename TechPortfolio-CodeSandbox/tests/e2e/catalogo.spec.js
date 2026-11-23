import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.js';

const proyectos = JSON.parse(readFileSync(new URL('../../public/data/proyectos.json', import.meta.url), 'utf8'));
const primeraPagina = proyectos.slice(0, 10);
const segundaPagina = proyectos.slice(10);

function tarjetas(page) {
  return page.getByRole('article').getByRole('heading', { level: 3 });
}

test('carga doce registros y permite navegar entre las páginas de diez y dos', async ({ page }) => {
  await page.goto('/#/proyectos');
  const paginacion = page.getByRole('navigation', { name: 'Paginación de proyectos' });
  const paginaDos = paginacion.getByRole('button', { name: 'Página 2' });
  const anterior = paginacion.getByRole('button', { name: 'Página anterior' });
  const siguiente = paginacion.getByRole('button', { name: 'Página siguiente' });
  const titulo = page.getByRole('heading', { name: 'Proyectos disponibles' });
  await expect(page.getByRole('status')).toHaveText('12 resultados');
  await expect(tarjetas(page)).toHaveText(primeraPagina.map(proyecto => proyecto.nombre));
  await expect(anterior).toBeDisabled();
  await siguiente.click();
  await expect(tarjetas(page)).toHaveText(segundaPagina.map(proyecto => proyecto.nombre));
  await expect(paginaDos).toHaveAttribute('aria-current', 'page');
  await expect(titulo).toBeFocused();
  await expect(siguiente).toBeDisabled();
  await anterior.click();
  await expect(tarjetas(page)).toHaveCount(10);
  await paginaDos.click();
  await expect(tarjetas(page)).toHaveCount(2);
  await paginacion.getByRole('button', { name: 'Página 1' }).click();
  await expect(tarjetas(page)).toHaveCount(10);
});

test('aplica filtros individuales y combinados, muestra el vacío y permite limpiar', async ({ page }) => {
  await page.goto('/#/proyectos');
  const categoria = page.getByRole('combobox', { name: 'Categoría', exact: true });
  const tecnologia = page.getByRole('textbox', { name: 'Tecnología', exact: true });
  const filtrar = page.getByRole('button', { name: 'Filtrar', exact: true });
  const limpiar = page.getByRole('button', { name: 'Limpiar filtros' });
  const paginacion = page.getByRole('navigation', { name: 'Paginación de proyectos' });
  await paginacion.getByRole('button', { name: 'Página 2' }).click();
  await categoria.selectOption('Soporte TI');
  await expect(tarjetas(page)).toHaveCount(2);
  await filtrar.click();
  await expect(tarjetas(page)).toHaveText(['Mesa de ayuda', 'Registro de incidencias', 'Registro de mantenimiento']);
  await limpiar.click();
  await expect(categoria).toHaveValue('Todas');
  await expect(tarjetas(page)).toHaveCount(10);
  await expect(paginacion.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

  await tecnologia.fill('  rEaCt ');
  await tecnologia.press('Enter');
  await expect(tarjetas(page)).toHaveText([
    'TechPortfolio — Portafolio React', 'Mesa de ayuda', 'Panel de indicadores', 'Control de préstamos', 'Catálogo de productos'
  ]);
  await categoria.selectOption('Soporte TI');
  await filtrar.click();
  await expect(tarjetas(page)).toHaveText(['Mesa de ayuda']);
  await tecnologia.fill('tecnología inexistente');
  await filtrar.click();
  await expect(page.getByRole('status').filter({ hasText: 'No se encontraron proyectos' })).toBeVisible();
  await expect(tarjetas(page)).toHaveCount(0);
  await expect(paginacion).toBeHidden();
  await limpiar.click();
  await expect(tecnologia).toHaveValue('');
  await expect(page.getByRole('status')).toHaveText('12 resultados');
  await expect(tarjetas(page)).toHaveCount(10);
});

test('las doce fichas coinciden con sus tarjetas, permiten los tres cierres y devuelven el foco', async ({ page }) => {
  await page.goto('/#/proyectos');
  for (const [indice, proyecto] of proyectos.entries()) {
    if (indice === primeraPagina.length) {
      await page.getByRole('button', { name: 'Página siguiente' }).click();
    }
    const tarjeta = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: proyecto.nombre, level: 3, exact: true })
    });
    const abrir = tarjeta.getByRole('button', { name: `Ver detalle de ${proyecto.nombre}`, exact: true });
    await expect(tarjeta).toContainText(proyecto.categoria);
    await expect(tarjeta).toContainText(proyecto.tecnologia);
    await expect(tarjeta).toContainText(proyecto.estado);
    await expect(tarjeta.locator('time')).toHaveAttribute('datetime', proyecto.fecha);
    if (indice === 0) await abrir.press('Enter');
    else await abrir.click();
    const dialogo = page.getByRole('dialog', { name: proyecto.nombre, exact: true });
    const cerrar = dialogo.getByRole('button', { name: 'Cerrar detalle' });
    await expect(page).toHaveURL(url => url.hash === `#/proyectos?proyecto=${proyecto.id}`);
    await expect(dialogo).toBeVisible();
    await expect(cerrar).toBeFocused();
    await expect(dialogo.locator('dd')).toHaveText([
      proyecto.categoria, proyecto.tecnologia, proyecto.estado, proyecto.fecha, proyecto.descripcion,
      proyecto.enlace ? 'Abrir enlace del proyecto' : 'Enlace no disponible'
    ]);
    const imagen = dialogo.getByRole('img', { name: `Ilustración de ${proyecto.nombre}` });
    await expect(imagen).toBeVisible();
    await expect.poll(() => imagen.evaluate(elemento => elemento.naturalWidth)).toBeGreaterThan(0);
    if (proyecto.enlace) {
      await expect(dialogo.getByRole('link')).toHaveAttribute('href', proyecto.enlace);
      await page.keyboard.press('Tab');
      await expect(dialogo.getByRole('link')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(cerrar).toBeFocused();
    } else {
      await expect(dialogo.getByRole('link')).toHaveCount(0);
    }
    switch (indice % 3) {
      case 0: await cerrar.click(); break;
      case 1: await page.keyboard.press('Escape'); break;
      case 2: await page.mouse.click(4, 120); break;
    }
    await expect(dialogo).toBeHidden();
    await expect(page).toHaveURL(url => url.hash === '#/proyectos');
    await expect(abrir).toBeFocused();
  }
});

test('restaura el proyecto por URL directa, recarga e historial', async ({ page }) => {
  await page.goto('/#/proyectos?proyecto=TP-012');
  await page.reload();
  const dialogo = page.getByRole('dialog', { name: 'Dispositivos de red' });
  await expect(dialogo).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  const abrir = page.getByRole('button', { name: 'Ver detalle de Dispositivos de red' });
  await expect(abrir).toBeFocused();
  await expect(tarjetas(page)).toHaveCount(2);
  await abrir.click();
  await expect(dialogo).toBeVisible();
  await page.goBack();
  await expect(dialogo).toBeHidden();
  await expect(abrir).toBeFocused();
  await page.goForward();
  await expect(dialogo).toBeVisible();
  await page.goto('/#/proyectos?proyecto=TP-inexistente');
  await expect(page.getByText('La ficha solicitada no está disponible en el catálogo.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Inicio y Proyectos recuperan la carga mediante su botón de reintento', async ({ page, context }) => {
  let fallar = true;
  await context.route('**/data/proyectos.json', route => (
    fallar ? route.fulfill({ status: 503 }) : route.continue()
  ));
  for (const [ruta, etiqueta, rol, cantidad] of [
    ['/#/', 'Volver a intentar', 'link', 3],
    ['/#/proyectos', 'Reintentar', 'button', 10]
  ]) {
    fallar = true;
    const respuesta = await page.goto(ruta);
    if (!respuesta) await page.reload();
    await expect(page.getByRole('alert')).toContainText('No pudimos cargar el catálogo');
    fallar = false;
    await page.getByRole('button', { name: etiqueta, exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole(rol, { name: /^Ver detalle de/ })).toHaveCount(cantidad);
  }
});

test.describe('catálogo móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('abre el detalle al tocar una tarjeta y cierra al tocar el fondo', async ({ page }) => {
    await page.goto('/#/proyectos');
    const abrir = page.getByRole('button', { name: 'Ver detalle de Mesa de ayuda' });
    await abrir.tap();
    const dialogo = page.getByRole('dialog', { name: 'Mesa de ayuda' });
    await expect(dialogo).toBeInViewport();
    const dimensiones = await dialogo.boundingBox();
    expect(dimensiones.x).toBeGreaterThan(4);
    expect(dimensiones.x + dimensiones.width).toBeLessThanOrEqual(390);
    await page.touchscreen.tap(4, 100);
    await expect(dialogo).toBeHidden();
    await expect(abrir).toBeFocused();
  });
});
