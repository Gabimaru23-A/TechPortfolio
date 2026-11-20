import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filtrarProyectos, paginar, validarContacto, crearEnlaceCorreo } from '../src/utils/logic.js';

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

const contactoValido = {
  nombre: 'Ana', apellidos: 'Muñoz', correo: 'ana@empresa.com.co', telefono: '3105551234', descripcion: 'Interfaz web'
};

test('nombre y apellidos admiten tildes y ñ hasta 20 letras', () => {
  assert.deepEqual(validarContacto({ ...contactoValido, nombre: 'A\u0301'.repeat(20) }), {});
  assert.ok(validarContacto({ ...contactoValido, nombre: 'Á'.repeat(21) }).nombre);
  for (const apellido of ['De León', 'Muñoz8', 'Muñoz!', ' Muñoz', '\u0301Muñoz']) {
    assert.ok(validarContacto({ ...contactoValido, apellidos: apellido }).apellidos);
  }
});

test('formulario acepta correos empresariales, personales y con alias', () => {
  for (const correo of ['ana@empresa.com.co', 'ana+ventas@equipo.empresa.co', 'ana@gmail.com', 'ana@hotmail.com']) {
    assert.deepEqual(validarContacto({ ...contactoValido, correo }), {});
  }
});

test('formulario rechaza correos con formato incompleto o incorrecto', () => {
  for (const correo of ['ana@', 'ana@empresa', 'ana..ventas@empresa.co', 'ana@-empresa.co', 'ana@empresa..co', 'ana @empresa.co']) {
    assert.equal(validarContacto({ ...contactoValido, correo }).correo, 'Escribe un correo con formato válido.');
  }
});

test('formulario exige teléfono numérico y una descripción con contenido', () => {
  assert.deepEqual(validarContacto({ ...contactoValido, telefono: '001234', descripcion: 'Consulta' }), {});
  assert.ok(validarContacto({ ...contactoValido, telefono: '+57 3105551234' }).telefono);
  assert.equal(validarContacto({ ...contactoValido, descripcion: ' \n ' }).descripcion, 'Escribe la descripción del proyecto.');
});

test('formulario inválido informa los cinco campos', () => {
  const errores=validarContacto({nombre:'',apellidos:'123',correo:'correo-mal',telefono:'a123',descripcion:' '});
  assert.deepEqual(Object.keys(errores).sort(),['apellidos','correo','descripcion','nombre','telefono']);
});

test('borrador codifica destinatario, asunto y mensaje con caracteres reservados y saltos de línea', () => {
  const enlace = crearEnlaceCorreo(' contacto+web@empresa.co ', { ...contactoValido, descripcion: 'Inventario & finanzas?\nSegunda línea.' });
  const [destinatario, query] = enlace.split('?');
  const campos = new URLSearchParams(query);

  assert.equal(destinatario, 'mailto:contacto%2Bweb@empresa.co');
  assert.equal(campos.get('subject'), 'Contacto TechPortfolio - Ana Muñoz');
  assert.equal(campos.get('body'), 'Nombre: Ana Muñoz\r\nCorreo: ana@empresa.com.co\r\nTeléfono: 3105551234\r\n\r\nDescripción del proyecto:\r\nInventario & finanzas?\r\nSegunda línea.');
  assert.deepEqual([...campos.keys()], ['subject', 'body']);
});

test('borrador requiere un destinatario configurado y válido', () => {
  assert.equal(crearEnlaceCorreo('', contactoValido), '');
  assert.equal(crearEnlaceCorreo('correo-incompleto', contactoValido), '');
});
