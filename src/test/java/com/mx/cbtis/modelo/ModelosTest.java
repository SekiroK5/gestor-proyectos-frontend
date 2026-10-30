package com.mx.cbtis.modelo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Los modelos del frontend reciben el JSON de la API; se valida que constructores,
 * getters y setters conserven exactamente los valores asignados.
 */
class ModelosTest {

	@Test
	@DisplayName("Usuario: constructor y setters")
	void usuario() {
		Usuario u = new Usuario(131, "Ana Paola", "ana@cbtis75.edu.mx", "1234", "Estudiante", "#A1B2C3");
		assertEquals(131, u.getId_usuario());
		assertEquals("Ana Paola", u.getNombre());
		assertEquals("ana@cbtis75.edu.mx", u.getCorreo_electronico());
		assertEquals("1234", u.getContrasena());
		assertEquals("Estudiante", u.getRol());
		assertEquals("#A1B2C3", u.getImagen_usuario());

		Usuario v = new Usuario();
		assertNull(v.getNombre());
		v.setId_usuario(7);
		v.setNombre("Liliana");
		v.setCorreo_electronico("lili@cbtis75.edu.mx");
		v.setContrasena("abcd");
		v.setRol("Docente");
		v.setImagen_usuario("#000000");
		assertEquals(7, v.getId_usuario());
		assertEquals("Liliana", v.getNombre());
		assertEquals("lili@cbtis75.edu.mx", v.getCorreo_electronico());
		assertEquals("abcd", v.getContrasena());
		assertEquals("Docente", v.getRol());
		assertEquals("#000000", v.getImagen_usuario());
	}

	@Test
	@DisplayName("Proyectos: constructor y setters")
	void proyectos() {
		Proyectos p = new Proyectos(197, "My API Rest", "Api", "2024-05-31", "2024-06-29", "En proceso", "/Images/a.gif");
		assertEquals(197, p.getId_proyecto());
		assertEquals("My API Rest", p.getNombre());
		assertEquals("Api", p.getDescripcion());
		assertEquals("2024-05-31", p.getFecha_inicio());
		assertEquals("2024-06-29", p.getFecha_finalizacion());
		assertEquals("En proceso", p.getEstado_proyecto());
		assertEquals("/Images/a.gif", p.getFondo());

		Proyectos q = new Proyectos();
		assertNull(q.getId_proyecto());
		q.setId_proyecto(5);
		q.setNombre("Front");
		q.setDescripcion("Vistas");
		q.setFecha_inicio("2026-10-01");
		q.setFecha_finalizacion("2026-11-30");
		q.setEstado_proyecto("Finalizado");
		q.setFondo("/Images/blanco.png");
		assertEquals(5, q.getId_proyecto());
		assertEquals("Front", q.getNombre());
		assertEquals("Vistas", q.getDescripcion());
		assertEquals("2026-10-01", q.getFecha_inicio());
		assertEquals("2026-11-30", q.getFecha_finalizacion());
		assertEquals("Finalizado", q.getEstado_proyecto());
		assertEquals("/Images/blanco.png", q.getFondo());
	}

	@Test
	@DisplayName("Tareas: constructor y setters")
	void tareas() {
		Tareas t = new Tareas(199, "Base de datos", "Tablas", "2024-06-13", "terminado", "danger", 197);
		assertEquals(199, t.getId_tarea());
		assertEquals("Base de datos", t.getNombre());
		assertEquals("Tablas", t.getDescripcion());
		assertEquals("2024-06-13", t.getFecha_vencimiento());
		assertEquals("terminado", t.getLista());
		assertEquals("danger", t.getEstado());
		assertEquals(197, t.getId_proyecto());

		Tareas s = new Tareas();
		assertNull(s.getId_tarea());
		s.setId_tarea(3);
		s.setNombre("Pruebas");
		s.setDescripcion("JUnit");
		s.setFecha_vencimiento("2026-11-01");
		s.setLista("Pendientes");
		s.setEstado("warning");
		s.setId_proyecto(5);
		assertEquals(3, s.getId_tarea());
		assertEquals("Pruebas", s.getNombre());
		assertEquals("JUnit", s.getDescripcion());
		assertEquals("2026-11-01", s.getFecha_vencimiento());
		assertEquals("Pendientes", s.getLista());
		assertEquals("warning", s.getEstado());
		assertEquals(5, s.getId_proyecto());
	}

	@Test
	@DisplayName("Comentarios: constructor y setters")
	void comentarios() {
		Comentarios c = new Comentarios(201, "Perla", 199, "Subirlo YA!!!", "2024-06-26 13:48:00");
		assertEquals(201, c.getId_comentario());
		assertEquals("Perla", c.getId_usuario());
		assertEquals(199, c.getId_tarea());
		assertEquals("Subirlo YA!!!", c.getTexto_comentario());
		assertEquals("2024-06-26 13:48:00", c.getFecha_hora());

		Comentarios d = new Comentarios();
		assertNull(d.getId_comentario());
		d.setId_comentario(9);
		d.setId_usuario("Liliana");
		d.setId_tarea(3);
		d.setTexto_comentario("Listo");
		d.setFecha_hora("2026-10-30 10:00:00");
		assertEquals(9, d.getId_comentario());
		assertEquals("Liliana", d.getId_usuario());
		assertEquals(3, d.getId_tarea());
		assertEquals("Listo", d.getTexto_comentario());
		assertEquals("2026-10-30 10:00:00", d.getFecha_hora());
	}

	@Test
	@DisplayName("Asignaciones: constructor y setters")
	void asignaciones() {
		Asignaciones a = new Asignaciones(21, 131, 199, "2026-10-17");
		assertEquals(21, a.getId_asignacion());
		assertEquals(131, a.getId_usuario());
		assertEquals(199, a.getId_tarea());
		assertEquals("2026-10-17", a.getFecha_asignacion());

		Asignaciones b = new Asignaciones();
		assertNull(b.getId_asignacion());
		b.setId_asignacion(22);
		b.setId_usuario(172);
		b.setId_tarea(3);
		b.setFecha_asignacion("2026-10-30");
		assertEquals(22, b.getId_asignacion());
		assertEquals(172, b.getId_usuario());
		assertEquals(3, b.getId_tarea());
		assertEquals("2026-10-30", b.getFecha_asignacion());
	}
}
