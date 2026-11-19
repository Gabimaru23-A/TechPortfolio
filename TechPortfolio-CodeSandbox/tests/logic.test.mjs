import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filtrarProyectos, paginar, limpiarValorContacto, validarContacto } from '../src/utils/logic.js';

const items = JSON.parse(readFileSync(new URL('../public/data/proyectos.json', import.meta.url), 'utf8'));

test('el catálogo cuenta con 12 proyectos y ocho atributos visibles', () => {
  assert.equal(items.length, 12);
  for (const p of items) {
    for (const campo of ['nombre','categoria','tecnologia','estado','fecha','descripcion','imagen','enlace']) {
      assert.ok(Object.hasOwn(p,campo), `${p.id} sin ${campo}`);
    }
  }
});

test('la paginación muestra 10 proyectos en primera página y 2 en segunda', () => {
  assert.equal(paginar(items,1).visibles.length, 10);
  assert.equal(paginar(items,2).visibles.length, 2);
  assert.equal(paginar(items,1).totalPages, 2);
});

test('los dos filtros se pueden combinar', () => {
  const result = filtrarProyectos(items,{cat:'Desarrollo web',tech:'react'});
  assert.ok(result.length > 0);
  assert.ok(result.every(p => p.categoria==='Desarrollo web' && p.tecnologia.toLowerCase().includes('react')));
});

test('un filtro sin coincidencias devuelve un arreglo vacío', () => {
  assert.equal(filtrarProyectos(items,{cat:'Todas',tech:'tecnologia-inexistente'}).length,0);
});

test('el limpiador admite letras con tildes y rechaza caracteres y números', () => {
  assert.equal(limpiarValorContacto('nombre','Ana María123!'),'Ana María');
  assert.equal(limpiarValorContacto('telefono','+57 (310) 555-1234'),'573105551234');
  assert.equal(limpiarValorContacto('apellidos','A'.repeat(27)).length,20);
});

test('formulario válido no tiene errores', () => {
  assert.deepEqual(validarContacto({nombre:'Ana',apellidos:'María López',correo:'ana@example.com',telefono:'3105551234',descripcion:'Necesito una interfaz web.'}),{});
});

test('formulario inválido informa los cinco campos', () => {
  const errores=validarContacto({nombre:'',apellidos:'123',correo:'correo-mal',telefono:'a123',descripcion:' '});
  assert.deepEqual(Object.keys(errores).sort(),['apellidos','correo','descripcion','nombre','telefono']);
});
