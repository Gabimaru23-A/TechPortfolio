import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  entornoLocal: [async ({ context, page, baseURL }, use) => {
    const origen = new URL(baseURL).origin;
    const excepciones = [];
    page.on('pageerror', error => excepciones.push(error.message));
    await context.route('**/*', route => {
      const destino = new URL(route.request().url());
      return destino.origin === origen ? route.continue() : route.abort();
    });
    await use();
    expect(excepciones).toEqual([]);
  }, { auto: true }]
});

export { expect };
