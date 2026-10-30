const { cargarVista, prepararGlobales, cargarScript, esperar } = require('./apoyo');

describe('register.js y formulario de registro', () => {
	let getRandomColor, form;

	beforeEach(() => {
		cargarVista('register.html');
		prepararGlobales();
		({ getRandomColor } = cargarScript('register.js'));
		form = document.querySelector('form');
	});

	const llenar = ({ nombre = 'Usuario Prueba', email = 'prueba@cbtis75.edu.mx', pass = '1234', rol = 'Estudiante' } = {}) => {
		document.querySelector('input[type=text]').value = nombre;
		document.getElementById('exampleInputEmail1').value = email;
		document.getElementById('exampleInputPassword1').value = pass;
		document.querySelector('select').value = rol;
	};

	test('getRandomColor asigna un color hexadecimal a la imagen del usuario', () => {
		getRandomColor();
		expect(document.getElementById('imagenUsuario').value).toMatch(/^#[0-9A-F]{6}$/);
	});

	test('el formulario es válido con todos los datos completos', () => {
		llenar();
		expect(form.checkValidity()).toBe(true);
	});

	test('el formulario es inválido si faltan datos obligatorios', () => {
		llenar({ nombre: '', pass: '' });
		expect(form.checkValidity()).toBe(false);
	});

	test('el formulario es inválido si el correo no tiene formato válido', () => {
		llenar({ email: 'correo-sin-arroba' });
		expect(form.checkValidity()).toBe(false);
	});

	test('el formulario es inválido si no se selecciona un rol', () => {
		llenar();
		document.querySelector('select').selectedIndex = 0; // "Seleccione una opción"
		expect(form.checkValidity()).toBe(false);
	});

	const enviar = () => {
		const evento = new Event('submit', { cancelable: true });
		form.dispatchEvent(evento);
		return evento;
	};

	test('al enviar con datos inválidos se cancela el envío y se marcan los errores', async () => {
		await esperar();
		llenar({ email: '' });
		const evento = enviar();
		expect(evento.defaultPrevented).toBe(true);
		expect(form.classList.contains('was-validated')).toBe(true);
	});

	test('al enviar con datos válidos el formulario sí se envía', async () => {
		await esperar();
		llenar();
		const evento = enviar();
		expect(evento.defaultPrevented).toBe(false);
	});
});
