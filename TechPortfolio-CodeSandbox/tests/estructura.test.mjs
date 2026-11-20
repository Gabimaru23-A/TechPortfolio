import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { perfil, tecnologias, herramientasIA, experiencias, testimonios, biografia } from '../src/data/site.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const catalogo = JSON.parse(readFileSync(join(root,'public/data/proyectos.json'),'utf8'));

test('todas las cinco vistas existen y tienen rutas definidas',()=>{
  const app = readFileSync(join(root,'src/App.jsx'),'utf8');
  for (const [ruta,nombre] of [['/','Inicio'],['/proyectos','Proyectos'],['/tecnologias','Tecnologias'],['/contacto','Contacto'],['/propuesta','Propuesta']]){
    assert.ok(existsSync(join(root,'src/pages',nombre+'.jsx')));
    assert.ok(app.includes(`path="${ruta}"`),`Ruta faltante ${ruta}`);
  }
});

test('el catálogo tiene ilustraciones válidas para sus doce fichas',()=>{
  for (const item of catalogo){
    assert.ok(item.nombre.length>2 && item.descripcion.length>10);
    assert.ok(existsSync(join(root,'public',item.imagen)),`${item.id}: imagen ausente ${item.imagen}`);
  }
});

test('están presentes las tres tecnologías con imagen, dos IA y tres experiencias',()=>{
  assert.ok(tecnologias.length>=3);
  for (const tec of tecnologias) assert.ok(existsSync(join(root,'public',tec.imagen)));
  assert.ok(herramientasIA.length>=2);
  assert.ok(experiencias.length>=3);
  assert.ok(biografia.length>=3);
});

test('el contacto tiene cinco testimonios y las redes usan destinos verificados o configuración explícita',()=>{
  assert.ok(testimonios.length>=5);
  assert.equal(perfil.github, 'https://github.com/Gabimaru23-A/TechPortfolio');
  assert.equal(perfil.linkedin, '');
  const config = readFileSync(join(root, '.env.example'), 'utf8');
  assert.match(config, /^VITE_LINKEDIN_URL=$/m);
});
