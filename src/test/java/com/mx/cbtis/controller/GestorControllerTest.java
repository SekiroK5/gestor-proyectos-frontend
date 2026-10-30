package com.mx.cbtis.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.ModelAndView;

import com.mx.cbtis.modelo.Comentarios;
import com.mx.cbtis.modelo.Proyectos;
import com.mx.cbtis.modelo.Tareas;
import com.mx.cbtis.modelo.Usuario;

/**
 * Pruebas del controlador del frontend. La API del backend se simula con MockRestServiceServer,
 * asi se valida que cada accion llama al endpoint correcto, envia los datos esperados y procesa la respuesta.
 */
class GestorControllerTest {

	private static final String API = "http://api-prueba:8081";
	private static final MediaType JSON = MediaType.APPLICATION_JSON;

	private MockRestServiceServer api;
	private GestorController controller;
	private ExtendedModelMap modelo;

	@BeforeEach
	void preparar() {
		RestTemplate template = new RestTemplate();
		api = MockRestServiceServer.bindTo(template).build();
		controller = new GestorController(template, API);
		modelo = new ExtendedModelMap();
	}

	private Proyectos proyecto(int id, String nombre) {
		return new Proyectos(id, nombre, "Descripcion", "2026-10-01", "2026-11-30", "En proceso", "/Images/blanco.png");
	}

	private Tareas tarea(int id) {
		return new Tareas(id, "Tarea " + id, "Descripcion", "2026-11-01", "Pendientes", "warning", 197);
	}

	// ---------- vistas simples ----------

	@Test
	@DisplayName("Las vistas estaticas regresan el nombre de su template")
	void vistasEstaticas() {
		assertEquals("home", controller.getHome());
		assertEquals("tutorial", controller.getTutorial());
		assertEquals("manual", controller.getManual());
		assertEquals("login", controller.getLogin());
	}

	@Test
	@DisplayName("register e inicio preparan un objeto vacio para el formulario")
	void vistasConFormulario() {
		assertEquals("register", controller.getRegister(modelo));
		assertInstanceOf(Usuario.class, modelo.getAttribute("usuario"));
		assertEquals("inicio", controller.getInicio(modelo));
		assertInstanceOf(Proyectos.class, modelo.getAttribute("proyectos"));
	}

	@Test
	@DisplayName("/tarea prepara una tarea vacia y usa la vista de proyecto")
	void vistaTarea() {
		assertEquals("proyecto", controller.getTarea(modelo));
		assertInstanceOf(Tareas.class, modelo.getAttribute("tareas"));
	}

	// ---------- usuarios ----------

	@Test
	@DisplayName("saveUsuario envia el usuario a /addUsuario y redirige al login")
	void guardarUsuario() {
		api.expect(requestTo(API + "/addUsuario")).andExpect(method(HttpMethod.POST))
			.andExpect(jsonPath("$.correo_electronico").value("ana@cbtis75.edu.mx"))
			.andRespond(withSuccess("1", JSON));
		Usuario u = new Usuario(null, "Ana", "ana@cbtis75.edu.mx", "1234", "Estudiante", "#FFFFFF");

		ModelAndView mav = controller.setSaveUsuario(u);

		assertEquals("redirect:/login", mav.getViewName());
		api.verify();
	}

	@Test
	@DisplayName("verificarLogin regresa el usuario que responde /getUsuarioLogin")
	void loginCorrecto() {
		api.expect(requestTo(API + "/getUsuarioLogin"))
			.andExpect(jsonPath("$.contrasena").value("1234"))
			.andRespond(withSuccess("{\"id_usuario\":131,\"nombre\":\"Ana Paola\"}", JSON));

		ResponseEntity<Usuario> r = controller.verificarUsuario(new Usuario(null, null, "ana@cbtis75.edu.mx", "1234", null, null));

		assertEquals(HttpStatus.OK, r.getStatusCode());
		assertEquals("Ana Paola", r.getBody().getNombre());
		api.verify();
	}

	@Test
	@DisplayName("verificarLogin propaga el aviso de usuario inexistente (nombre 000)")
	void loginIncorrecto() {
		api.expect(requestTo(API + "/getUsuarioLogin")).andRespond(withSuccess("{\"nombre\":\"000\"}", JSON));

		ResponseEntity<Usuario> r = controller.verificarUsuario(new Usuario());

		assertEquals("000", r.getBody().getNombre());
	}

	@Test
	@DisplayName("verificarLogin lanza excepcion si la API falla (el JS muestra el aviso de conexion)")
	void loginApiCaida() {
		api.expect(requestTo(API + "/getUsuarioLogin")).andRespond(withServerError());

		assertThrows(HttpServerErrorException.class, () -> controller.verificarUsuario(new Usuario()));
	}

	@Test
	@DisplayName("consultarUsuarios regresa la lista y la agrega al modelo")
	void consultarUsuarios() {
		api.expect(requestTo(API + "/buscarUsuarios")).andExpect(method(HttpMethod.POST))
			.andRespond(withSuccess("[{\"id_usuario\":131},{\"id_usuario\":172}]", JSON));

		ResponseEntity<Object> r = controller.consultarUsuarios(modelo);

		assertEquals(2, ((List<?>) r.getBody()).size());
		assertSame(r.getBody(), modelo.getAttribute("listaUsuarios"));
	}

	// ---------- proyectos ----------

	@Test
	@DisplayName("saveProyecto envia el proyecto a /addProyecto y regresa a inicio")
	void guardarProyecto() {
		api.expect(requestTo(API + "/addProyecto"))
			.andExpect(jsonPath("$.nombre").value("Proyecto P3"))
			.andRespond(withSuccess("1", JSON));

		assertEquals("redirect:/inicio", controller.setSaveProyecto(proyecto(0, "Proyecto P3")).getViewName());
		api.verify();
	}

	@Test
	@DisplayName("consultarProyectos regresa los proyectos de la API")
	void consultarProyectos() {
		api.expect(requestTo(API + "/buscarProyectos"))
			.andRespond(withSuccess("[{\"id_proyecto\":197,\"nombre\":\"My API Rest\"}]", JSON));

		ResponseEntity<Object> r = controller.consultarProyectos(modelo);

		List<?> lista = (List<?>) r.getBody();
		assertEquals(1, lista.size());
		assertEquals("My API Rest", ((Proyectos) lista.get(0)).getNombre());
		assertSame(lista, modelo.getAttribute("listaProyectos"));
	}

	@Test
	@DisplayName("consultarProyectos lanza excepcion si la API falla (el JS muestra el mensaje en la vista)")
	void consultarProyectosApiCaida() {
		api.expect(requestTo(API + "/buscarProyectos")).andRespond(withServerError());

		assertThrows(HttpServerErrorException.class, () -> controller.consultarProyectos(modelo));
	}

	@Test
	@DisplayName("actualizarProyecto consulta el proyecto por id en /buscarProyecto")
	void actualizarProyecto() {
		api.expect(requestTo(API + "/buscarProyecto?id_proyecto=197")).andExpect(method(HttpMethod.GET))
			.andRespond(withSuccess("{\"id_proyecto\":197,\"nombre\":\"My API Rest\"}", JSON));

		ResponseEntity<Object> r = controller.updateProyecto(proyecto(197, null));

		assertEquals("My API Rest", ((Proyectos) r.getBody()).getNombre());
	}

	@Test
	@DisplayName("actualizarProyecto con un id inexistente propaga el 404 de la API")
	void actualizarProyectoInexistente() {
		api.expect(requestTo(API + "/buscarProyecto?id_proyecto=99999")).andRespond(withStatus(HttpStatus.NOT_FOUND));

		assertThrows(HttpClientErrorException.NotFound.class, () -> controller.updateProyecto(proyecto(99999, null)));
	}

	@Test
	@DisplayName("eliminarProyecto llama a DELETE /deleteProyecto con el id")
	void eliminarProyecto() {
		api.expect(requestTo(API + "/deleteProyecto")).andExpect(method(HttpMethod.DELETE))
			.andExpect(jsonPath("$.id_proyecto").value(197))
			.andRespond(withSuccess("1", JSON));

		assertEquals("redirect:/inicio", controller.eliminarProyecto(proyecto(197, "My API Rest")).getViewName());
		api.verify();
	}

	// ---------- tareas ----------

	@Test
	@DisplayName("La vista de proyecto carga los usuarios y prepara tarea y comentario vacios")
	void vistaProyecto() {
		api.expect(requestTo(API + "/buscarUsuarios")).andRespond(withSuccess("[{\"nombre\":\"Ana\"}]", JSON));

		assertEquals("proyecto", controller.getProyecto(modelo));
		assertEquals(1, ((List<?>) modelo.getAttribute("listaUsuarios")).size());
		assertInstanceOf(Tareas.class, modelo.getAttribute("tarea"));
		assertInstanceOf(Comentarios.class, modelo.getAttribute("comentarios"));
	}

	@Test
	@DisplayName("obtenerTareas pide a /getTarea las tareas del proyecto")
	void obtenerTareas() {
		api.expect(requestTo(API + "/getTarea")).andExpect(jsonPath("$.id_proyecto").value(197))
			.andRespond(withSuccess("[{\"id_tarea\":199,\"id_proyecto\":197}]", JSON));

		ResponseEntity<List<Tareas>> r = controller.obtenerTareas(tarea(0), modelo);

		assertEquals(199, r.getBody().get(0).getId_tarea());
		assertSame(r.getBody(), modelo.getAttribute("tareas"));
	}

	@Test
	@DisplayName("saveTarea envia la tarea a /addTareas y regresa a la vista de proyecto")
	void guardarTarea() {
		api.expect(requestTo(API + "/addTareas")).andExpect(jsonPath("$.nombre").value("Tarea 5"))
			.andRespond(withSuccess("1", JSON));

		assertEquals("redirect:/proyecto", controller.setSaveTareas(tarea(5)).getViewName());
		api.verify();
	}

	@Test
	@DisplayName("verificarTarea y cambiosTareas regresan la respuesta de /addTareas")
	void verificarYCambiarTarea() {
		api.expect(requestTo(API + "/addTareas")).andRespond(withSuccess("1", JSON));
		api.expect(requestTo(API + "/addTareas")).andExpect(jsonPath("$.lista").value("Pendientes"))
			.andRespond(withSuccess("1", JSON));

		assertEquals(1, controller.verificarTarea(tarea(5)).getBody());
		assertEquals(1, controller.cambiosTareas(tarea(5)).getBody());
		api.verify();
	}

	@Test
	@DisplayName("actualizarTarea consulta la tarea por id en /buscarTarea")
	void actualizarTarea() {
		api.expect(requestTo(API + "/buscarTarea?id_tarea=199"))
			.andRespond(withSuccess("{\"id_tarea\":199,\"estado\":\"danger\"}", JSON));

		ResponseEntity<Object> r = controller.updateTarea(tarea(199));

		assertEquals("danger", ((Tareas) r.getBody()).getEstado());
	}

	@Test
	@DisplayName("eliminarTarea llama a DELETE /deleteTareas")
	void eliminarTarea() {
		api.expect(requestTo(API + "/deleteTareas")).andExpect(method(HttpMethod.DELETE))
			.andExpect(jsonPath("$.id_tarea").value(199))
			.andRespond(withSuccess("1", JSON));

		assertEquals("redirect:/proyecto", controller.eliminarTarea(tarea(199)).getViewName());
		api.verify();
	}

	@Test
	@DisplayName("consultarTareas regresa todas las tareas")
	void consultarTareas() {
		api.expect(requestTo(API + "/buscarTareas")).andRespond(withSuccess("[{\"id_tarea\":1},{\"id_tarea\":2}]", JSON));

		assertEquals(2, ((List<?>) controller.consultarTareas().getBody()).size());
	}

	// ---------- comentarios ----------

	@Test
	@DisplayName("saveComentario envia el comentario a /addComentario")
	void guardarComentario() {
		api.expect(requestTo(API + "/addComentario"))
			.andExpect(content().json("{\"texto_comentario\":\"Listo\",\"id_tarea\":199}"))
			.andRespond(withSuccess("1", JSON));

		assertEquals("proyecto", controller.setSaveComentario(new Comentarios(null, "Ana", 199, "Listo", "2026-10-30 10:00")));
		api.verify();
	}

	@Test
	@DisplayName("obtenerComentarios pide a /getComentario los comentarios de la tarea")
	void obtenerComentarios() {
		api.expect(requestTo(API + "/getComentario")).andExpect(jsonPath("$.id_tarea").value(199))
			.andRespond(withSuccess("[{\"id_comentario\":201,\"texto_comentario\":\"hola\"}]", JSON));

		ResponseEntity<List<Comentarios>> r = controller.obtenerComentarios(new Comentarios(null, null, 199, null, null), modelo);

		assertEquals("hola", r.getBody().get(0).getTexto_comentario());
		assertSame(r.getBody(), modelo.getAttribute("comentarios"));
	}

	@Test
	@DisplayName("consultarComentarios regresa todos los comentarios")
	void consultarComentarios() {
		api.expect(requestTo(API + "/buscarComentarios")).andRespond(withSuccess("[{\"id_comentario\":201}]", JSON));

		assertEquals(1, ((List<?>) controller.consultarComentarios().getBody()).size());
	}
}
