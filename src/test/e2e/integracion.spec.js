// Casos de integracion INT-01 a INT-09: la prueba maneja la interfaz real y comprueba en el backend (API 8081)
// que cada operacion llego al endpoint y quedo reflejada en la base de datos. Se ejecutan en orden (workers: 1).
const { test, expect } = require('@playwright/test');
const path = require('path');

const API = 'http://localhost:8081';
const EVIDENCIAS = path.join(__dirname, '..', '..', '..', 'target', 'evidencias');
const USUARIO = { nombre: 'Usuario Integracion P2', correo: 'integracion.p2@cbtis75.edu.mx', pass: 'P2-2026' };
const PROYECTO = 'Proyecto Integracion P2';
const TEMPORAL = 'Proyecto Temporal P2';

let page;
const peticiones = [];
const erroresJs = [];

async function captura(nombre) {
	await page.screenshot({ path: path.join(EVIDENCIAS, nombre + '.png') });
}

async function proyectosApi(request) {
	return (await request.post(API + '/buscarProyectos')).json();
}

function registrarPeticiones() {
	peticiones.length = 0;
	erroresJs.length = 0;
}

function mostrarPeticiones() {
	for (const p of peticiones) console.log('   ' + p);
	for (const e of erroresJs) console.log('   [error JS] ' + e);
}

async function login(correo, pass) {
	await page.goto('/login');
	await page.fill('#exampleInputEmail1', correo);
	await page.fill('#exampleInputPassword1', pass);
	await page.getByRole('button', { name: /Iniciar ses/ }).click();
}

async function abrirMenu(nombre) {
	const tarjeta = page.locator('#cardContainer .card', { hasText: nombre });
	await tarjeta.locator('button[data-bs-toggle=dropdown]').click();
	return tarjeta;
}

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	page.on('response', r => {
		const u = new URL(r.url());
		if (u.port === '8080' && !/\.(css|js|png|gif|ico)$/.test(u.pathname)) {
			peticiones.push(`${r.request().method()} ${u.pathname}${u.search} -> ${r.status()}`);
		}
	});
	page.on('pageerror', e => erroresJs.push(e.message));
});

test.afterAll(async () => {
	await page.close();
});

test('INT-02 Registro de usuario desde el formulario', async ({ request }) => {
	registrarPeticiones();
	await page.goto('/register');
	await page.fill('input[name=nombre]', USUARIO.nombre);
	await page.fill('#exampleInputEmail1', USUARIO.correo);
	await page.fill('#exampleInputPassword1', USUARIO.pass);
	await page.selectOption('select[name=rol]', 'Estudiante');
	await captura('INT-02_formulario');
	await page.getByRole('button', { name: 'Registrar' }).click();
	await expect(page).toHaveURL(/\/login$/);
	mostrarPeticiones();

	const usuarios = await (await request.post(API + '/buscarUsuarios')).json();
	const u = usuarios.find(x => x.correo_electronico === USUARIO.correo);
	expect(u, 'el usuario debe existir en la tabla usuario').toBeTruthy();
	expect(u.rol).toBe('Estudiante');
	console.log(`   BD: usuario ${u.id_usuario} registrado con rol ${u.rol}`);
});

test('INT-01 Consulta: login y carga de proyectos en la vista de inicio', async ({ request }) => {
	registrarPeticiones();
	await login(USUARIO.correo, USUARIO.pass);
	await expect(page).toHaveURL(/\/inicio$/);
	const esperados = await proyectosApi(request);
	await expect(page.locator('#cardContainer .card')).toHaveCount(esperados.length);
	await expect(page.locator('#cardContainer')).toContainText('My API Rest');
	await captura('INT-01_inicio');
	mostrarPeticiones();
	console.log(`   La vista muestra ${esperados.length} proyecto(s), igual que /buscarProyectos de la API`);
});

test('INT-03 Registro de proyecto desde el modal Agregar', async ({ request }) => {
	await page.goto('/inicio');
	registrarPeticiones();
	await page.click('#agregar');
	await page.fill('#nombre', PROYECTO);
	await page.fill('#descripcion', 'Creado desde la interfaz en la practica 2');
	await page.fill('#fecha_inicio', '2026-10-17');
	await page.fill('#fecha_finalizacion', '2026-12-05');
	await page.selectOption('#estado_proyecto', 'En proceso');
	await captura('INT-03_modal');
	await page.click('#staticBackdrop #guardar');
	await expect(page.locator('#cardContainer .card', { hasText: PROYECTO })).toHaveCount(1);
	await captura('INT-03_tarjeta');
	mostrarPeticiones();

	const p = (await proyectosApi(request)).find(x => x.nombre === PROYECTO);
	expect(p, 'el proyecto debe existir en la tabla proyectos').toBeTruthy();
	expect(p.fondo).toBe('/Images/blanco.png');
	console.log(`   BD: proyecto ${p.id_proyecto} creado con estado "${p.estado_proyecto}"`);
});

test('INT-04 Actualizacion de un proyecto desde el modal Editar', async ({ request }) => {
	await page.goto('/inicio');
	registrarPeticiones();
	await abrirMenu(PROYECTO);
	await page.locator('#cardContainer .card', { hasText: PROYECTO }).getByText('Editar').click();
	await expect(page.locator('#editarNombre')).toHaveValue(PROYECTO);
	await page.fill('#editarDescripcion', 'Descripcion modificada desde el frontend');
	await page.selectOption('#editar_estado_proyecto', 'Finalizado');
	await captura('INT-04_modal');
	await page.click('#modalEditar #guardar');
	const tarjeta = page.locator('#cardContainer .card', { hasText: PROYECTO });
	await expect(tarjeta).toContainText('Estado del proyecto: Finalizado');
	await captura('INT-04_tarjeta');
	mostrarPeticiones();

	expect(erroresJs, 'la edicion no debe generar errores de JavaScript').toEqual([]);
	const p = (await proyectosApi(request)).find(x => x.nombre === PROYECTO);
	expect(p.estado_proyecto).toBe('Finalizado');
	expect(p.descripcion).toBe('Descripcion modificada desde el frontend');
	console.log(`   BD: proyecto ${p.id_proyecto} actualizado a "${p.estado_proyecto}"`);
});

test('INT-05 Eliminacion de un proyecto desde la tarjeta', async ({ request }) => {
	await page.goto('/inicio');
	await page.click('#agregar');
	await page.fill('#nombre', TEMPORAL);
	await page.fill('#descripcion', 'Proyecto que se elimina en la prueba');
	await page.fill('#fecha_inicio', '2026-10-17');
	await page.fill('#fecha_finalizacion', '2026-10-31');
	await page.selectOption('#estado_proyecto', 'En proceso');
	await page.click('#staticBackdrop #guardar');
	await expect(page.locator('#cardContainer .card', { hasText: TEMPORAL })).toHaveCount(1);
	const id = (await proyectosApi(request)).find(x => x.nombre === TEMPORAL).id_proyecto;

	registrarPeticiones();
	await abrirMenu(TEMPORAL);
	await page.locator('#cardContainer .card', { hasText: TEMPORAL }).getByText('Eliminar').click();
	await expect(page.locator('#textAlerta')).toContainText(TEMPORAL);
	await captura('INT-05_confirmacion');
	await page.click('#alerta');
	await expect(page.locator('#cardContainer .card', { hasText: TEMPORAL })).toHaveCount(0);
	await captura('INT-05_vista');
	mostrarPeticiones();

	const r = await request.get(`${API}/buscarProyecto?id_proyecto=${id}`);
	expect(r.status(), 'el proyecto ya no debe existir en la BD').toBe(404);
	console.log(`   BD: el proyecto ${id} ya no existe (buscarProyecto responde ${r.status()})`);
});

test('INT-06 Error controlado: login con contrasena incorrecta', async () => {
	registrarPeticiones();
	await login(USUARIO.correo, 'incorrecta');
	await expect(page.locator('#alerta5')).toBeVisible();
	await expect(page).toHaveURL(/\/login$/);
	await page.waitForTimeout(700); // termina la animacion del aviso antes de la captura
	await captura('INT-06_login_incorrecto');
	mostrarPeticiones();
});

test('INT-07 Error controlado: el backend falla durante el login', async () => {
	registrarPeticiones();
	await page.route('**/verificarLogin', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500,"error":"Internal Server Error"}' }));
	await login(USUARIO.correo, USUARIO.pass);
	await expect(page.locator('#alerta6')).toBeVisible({ timeout: 4000 });
	await page.waitForTimeout(700); // termina la animacion del aviso antes de la captura
	await captura('INT-07_backend_caido');
	await page.unroute('**/verificarLogin');
	mostrarPeticiones();
});

test('INT-08 Error controlado: falla la consulta de proyectos', async () => {
	registrarPeticiones();
	await page.route('**/consultarProyectos', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500}' }));
	await page.goto('/inicio');
	await expect(page.locator('#cardContainer')).toContainText('No fue posible cargar los proyectos', { timeout: 4000 });
	await captura('INT-08_error_proyectos');
	await page.unroute('**/consultarProyectos');
	mostrarPeticiones();
});

test('INT-09 Validacion: registro sin seleccionar rol', async ({ request }) => {
	registrarPeticiones();
	const correo = 'sin.rol.p2@cbtis75.edu.mx';
	await page.goto('/register');
	await page.fill('input[name=nombre]', 'Usuario Sin Rol');
	await page.fill('#exampleInputEmail1', correo);
	await page.fill('#exampleInputPassword1', 'P2-2026');
	await page.getByRole('button', { name: 'Registrar' }).click();
	await page.waitForTimeout(1000);
	await captura('INT-09_sin_rol');
	mostrarPeticiones();

	const usuarios = await (await request.post(API + '/buscarUsuarios')).json();
	const guardado = usuarios.find(x => x.correo_electronico === correo);
	expect(guardado, 'no debe guardarse un usuario sin rol').toBeUndefined();
	await expect(page).toHaveURL(/\/register$/);
});
