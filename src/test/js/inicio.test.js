const { cargarVista, prepararGlobales, cargarScript, esperar } = require('./apoyo');

const proyectos = [
	{ id_proyecto: 197, nombre: 'My API Rest', descripcion: 'Api del gestor', fecha_inicio: '2024-05-31', fecha_finalizacion: '2024-06-29', estado_proyecto: 'En proceso', fondo: '/Images/animacion1.gif' },
	{ id_proyecto: 210, nombre: 'Proyecto Front', descripcion: 'Vistas', fecha_inicio: '2026-10-01', fecha_finalizacion: '2026-11-30', estado_proyecto: 'Finalizado', fondo: '/Images/azulReal.png' }
];

describe('inicio.js - consulta de proyectos al cargar la vista', () => {
	let $;
	beforeEach(() => {
		cargarVista('inicio.html');
		$ = prepararGlobales();
	});

	test('pide los proyectos a /consultarProyectos y crea una tarjeta por cada uno', async () => {
		const ajax = jest.spyOn($, 'ajax').mockImplementation(o => o.success(proyectos));
		cargarScript('inicio.js');
		await esperar();
		expect(ajax.mock.calls[0][0].url).toBe('/consultarProyectos');
		const tarjetas = document.querySelectorAll('#cardContainer .card');
		expect(tarjetas).toHaveLength(2);
		expect(tarjetas[0].textContent).toContain('My API Rest');
		expect(tarjetas[1].textContent).toContain('Estado del proyecto: Finalizado');
		expect(tarjetas[1].querySelector('a.btn').getAttribute('href')).toBe('/proyecto?id_proyecto=210');
	});

	test('si no hay proyectos el contenedor queda vacío', async () => {
		jest.spyOn($, 'ajax').mockImplementation(o => o.success([]));
		cargarScript('inicio.js');
		await esperar();
		expect(document.querySelectorAll('#cardContainer .card')).toHaveLength(0);
	});

	test('si el backend falla se muestra un mensaje en la vista', async () => {
		jest.spyOn($, 'ajax').mockImplementation(o => o.error({ status: 500 }));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		cargarScript('inicio.js');
		await esperar();
		expect(document.getElementById('cardContainer').textContent).toContain('No fue posible cargar los proyectos');
	});
});

describe('inicio.js - acciones sobre proyectos', () => {
	let $, f, ajax;
	beforeEach(() => {
		cargarVista('inicio.html');
		$ = prepararGlobales();
		ajax = jest.spyOn($, 'ajax').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		f = cargarScript('inicio.js');
		ajax.mockClear();
	});

	test('asignarFondo pone fondo blanco si no se eligió uno', () => {
		document.getElementById('fondo').value = '';
		f.asignarFondo();
		expect(document.getElementById('fondo').value).toBe('/Images/blanco.png');
	});

	test('asignarFondo respeta el fondo elegido', () => {
		f.guardarRutaImagen('/Images/degradado9.png');
		f.asignarFondo();
		expect(document.getElementById('fondo').value).toBe('/Images/degradado9.png');
	});

	test('asignarFondoEditar pone fondo blanco al editar sin fondo', () => {
		document.getElementById('editar_fondo').value = '';
		f.asignarFondoEditar();
		expect(document.getElementById('editar_fondo').value).toBe('/Images/blanco.png');
	});

	test('actualizarProyecto consulta el proyecto y llena el formulario de edición', () => {
		ajax.mockImplementation(o => o.success(proyectos[1]));
		f.actualizarProyecto(210);
		expect(ajax.mock.calls[0][0].url).toBe('/actualizarProyecto');
		expect(JSON.parse(ajax.mock.calls[0][0].data)).toEqual({ id_proyecto: 210 });
		expect(document.getElementById('id').value).toBe('210');
		expect(document.getElementById('editarNombre').value).toBe('Proyecto Front');
		expect(document.getElementById('editar_estado_proyecto').value).toBe('Finalizado');
		expect($.fn.modal).toHaveBeenCalledWith('show');
	});

	test('obtenerInfo prepara el mensaje de confirmación y guarda el id', () => {
		f.obtenerInfo(197, 'hiddenId', 'My API Rest');
		// jsdom no calcula innerText, se lee la propiedad tal como la asigna el script.
		expect(document.getElementById('textAlerta').innerText).toContain('My API Rest');
		expect(document.getElementById('hiddenId').value).toBe('197');
	});

	test('botonEliminar envía el id guardado a /eliminarProyecto', () => {
		document.getElementById('hiddenId').value = '197';
		f.botonEliminar();
		const o = ajax.mock.calls[0][0];
		expect(o.url).toBe('/eliminarProyecto');
		expect(o.type).toBe('POST');
		expect(JSON.parse(o.data)).toEqual({ id_proyecto: '197' });
	});
});
