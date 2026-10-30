// Utilidades comunes para cargar las vistas reales (templates de Thymeleaf) y los scripts del frontend en jsdom.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', 'main', 'resources');

function cargarVista(nombre) {
	const html = fs.readFileSync(path.join(RAIZ, 'templates', nombre), 'utf8');
	const cuerpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
	document.body.innerHTML = cuerpo.replace(/<script[\s\S]*?<\/script>/gi, '');
}

function prepararGlobales() {
	const $ = require('jquery');
	global.$ = global.jQuery = window.$ = window.jQuery = $;
	$.fn.modal = jest.fn();
	// Bootstrap real no se carga en jsdom: el Toast solo marca el elemento como visible.
	global.bootstrap = {
		Toast: jest.fn(function (elemento) {
			this.show = () => elemento.classList.add('show');
		})
	};
	return $;
}

function cargarScript(nombre) {
	let modulo;
	jest.isolateModules(() => {
		modulo = require(path.join(RAIZ, 'static', 'js', nombre));
	});
	return modulo;
}

// jQuery dispara ready() y sus callbacks en ciclos posteriores del event loop.
const esperar = () => new Promise(r => setTimeout(r, 50));

module.exports = { cargarVista, prepararGlobales, cargarScript, esperar };
