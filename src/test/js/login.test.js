const { cargarVista, prepararGlobales, cargarScript } = require('./apoyo');

describe('login.js - validarLogin()', () => {
	let $, validarLogin;

	beforeEach(() => {
		localStorage.clear();
		cargarVista('login.html');
		$ = prepararGlobales();
		({ validarLogin } = cargarScript('login.js'));
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	const llenar = (email, pass) => {
		$('#exampleInputEmail1').val(email);
		$('#exampleInputPassword1').val(pass);
	};
	const visible = id => document.getElementById(id).classList.contains('show');

	test('muestra alerta si email y contraseña están vacíos', () => {
		const ajax = jest.spyOn($, 'ajax');
		llenar('', '');
		validarLogin();
		expect(visible('alerta1')).toBe(true);
		expect(ajax).not.toHaveBeenCalled();
	});

	test('muestra alerta si falta el email', () => {
		llenar('', '1234');
		validarLogin();
		expect(visible('alerta2')).toBe(true);
	});

	test('muestra alerta si el email no tiene formato válido', () => {
		llenar('correo-invalido', '1234');
		validarLogin();
		expect(visible('alerta3')).toBe(true);
	});

	test('muestra alerta si falta la contraseña', () => {
		llenar('ana@cbtis75.edu.mx', '');
		validarLogin();
		expect(visible('alerta4')).toBe(true);
	});

	test('con datos válidos envía la petición POST a /verificarLogin', () => {
		const ajax = jest.spyOn($, 'ajax').mockImplementation(() => {});
		llenar('ana@cbtis75.edu.mx', '1234');
		validarLogin();
		expect(ajax).toHaveBeenCalledTimes(1);
		const opciones = ajax.mock.calls[0][0];
		expect(opciones.url).toBe('/verificarLogin');
		expect(opciones.type).toBe('POST');
		expect(JSON.parse(opciones.data)).toEqual({ correo_electronico: 'ana@cbtis75.edu.mx', contrasena: '1234' });
	});

	test('si el backend responde nombre "000" avisa que el usuario no existe', () => {
		jest.spyOn($, 'ajax').mockImplementation(o => o.success({ nombre: '000' }));
		llenar('ana@cbtis75.edu.mx', 'mal');
		validarLogin();
		expect(visible('alerta5')).toBe(true);
		expect(localStorage.getItem('usuario')).toBeNull();
	});

	test('si el login es correcto guarda el usuario en localStorage', () => {
		const usuario = { id_usuario: 131, nombre: 'Ana Paola', correo_electronico: 'ana@cbtis75.edu.mx' };
		jest.spyOn($, 'ajax').mockImplementation(o => o.success(usuario));
		llenar('ana@cbtis75.edu.mx', '1234');
		validarLogin();
		expect(JSON.parse(localStorage.getItem('usuario'))).toEqual(usuario);
	});

	test('si el backend falla (error 500) se informa al usuario', () => {
		jest.spyOn($, 'ajax').mockImplementation(o => o.error && o.error({ status: 500 }));
		llenar('ana@cbtis75.edu.mx', '1234');
		validarLogin();
		expect(document.getElementById('alerta6')).not.toBeNull();
		expect(visible('alerta6')).toBe(true);
	});
});
