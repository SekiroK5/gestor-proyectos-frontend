# Documento técnico – Actualización a Java 21 y pipelines de CI

Proyecto: **Gestor de Proyectos** (dos microservicios Spring Boot y una base de datos PostgreSQL).

| Repositorio | Contenido |
|---|---|
| https://github.com/SekiroK5/gestor-proyectos-backend | API REST (`Ejercicio5MyAPIGestor`), scripts de base de datos, infraestructura de CI en Docker y pipelines de backend y de base de datos |
| https://github.com/SekiroK5/gestor-proyectos-frontend | Interfaz web (`Ejercicio5Cliente`) y pipeline de frontend |

## 1. Migración a Java 21

### 1.1 POM originales y actualizados

Cada repositorio conserva los dos archivos en `docs/pom/`: `pom-original.xml` (tal como estaba en el proyecto original) y `pom-actualizado.xml` (copia del `pom.xml` vigente).

| Aspecto | Backend original | Backend actualizado | Frontend original | Frontend actualizado |
|---|---|---|---|---|
| Spring Boot | 2.7.17 | 3.5.16 | 3.2.5 | 3.5.16 |
| `java.version` | 11 | **21** | 17 | **21** |
| Persistencia | `javax.persistence` + driver MariaDB | `jakarta.persistence` + driver PostgreSQL | – | – |
| maven-surefire-plugin | (implícito) | 3.5.4 explícito | (implícito) | 3.5.4 explícito |
| jacoco-maven-plugin | – | 0.8.14 | – | 0.8.14 |
| sonar-maven-plugin | – | 5.5.0.6356 | – | 5.5.0.6356 |

**Justificación de las versiones**

- **Spring Boot 3.5.16**: última versión de la rama 3.x, compatible oficialmente con Java 17–24 y probada aquí con Java 21. Pasar de 2.7 a 3.x obliga a cambiar `javax.persistence` por `jakarta.persistence` en las entidades.
- **JaCoCo 0.8.14**: soporta class files de Java 21 (desde 0.8.11).
- **Surefire 3.5.4**: versión explícita para no depender de la que trae el parent y garantizar JUnit 5 en Java 21.
- **SonarScanner 5.5.0.6356**: versión pedida en la práctica.
- Se declaran versiones corregidas de Jackson (2.21.7), Tomcat (10.1.59), Log4j (2.25.5) y el driver de PostgreSQL (42.7.12) por los hallazgos de Trivy (sección 4).

### 1.2 Cambios en el código

| Microservicio | Cambio | Motivo |
|---|---|---|
| Backend | Los endpoints reciben DTOs (`dto/*Dto`, records de Java) y los repositorios se inyectan por constructor | Hallazgos de SonarQube (incidencia 10). |
| Backend | Driver `postgresql` en lugar de `mariadb-java-client` | `application.properties` apunta a PostgreSQL; con el driver de MariaDB la API no arrancaba. |
| Backend | `GenerationType.IDENTITY` en las 5 entidades | Con `AUTO`, Hibernate 6 crea secuencias propias que ignoran la columna identity y generan ids repetidos. |
| Backend | Búsquedas por id regresan 404 y las bajas validan `existsById` | Antes respondían 200 con un objeto vacío y "1" al borrar un id inexistente. |
| Backend | Conexión configurable con `DB_URL`, `DB_USER`, `DB_PASSWORD`; propiedad `spring.datasource.driver-class-name` | Permite apuntar a la base de Docker desde Jenkins; la propiedad anterior (`dbcp2.driver-class-name`) no tenía efecto. |
| Frontend | `RestTemplate` inyectado (`config/RestConfig`) y URL de la API en `api.url` / `API_URL` | Antes se creaba un `RestTemplate` y se escribía `http://localhost:8081` en cada método; así no se podía probar ni configurar por entorno. |
| Frontend | Correcciones de la práctica 2 (aviso de error en login, mensaje al fallar la carga de proyectos, id del fondo al editar, validación del rol) | Fallas encontradas por las pruebas automáticas. |

## 2. Pruebas y cobertura

| Microservicio | Pruebas | Métodos | Líneas | Herramienta |
|---|---|---|---|---|
| Backend | 54 (JUnit 5 + MockMvc + Mockito) | **100 %** (111/111) | 100 % | JaCoCo |
| Frontend Java | 30 (JUnit 5 + MockRestServiceServer) | **100 %** (96/96) | 100 % | JaCoCo |
| Frontend JavaScript | 24 (Jest + jsdom) | 86 % de funciones | 94.5 % | Istanbul (lcov) |

Las pruebas validan resultados (códigos HTTP, cuerpo de la respuesta, datos enviados a la API, llamadas al repositorio), no solo que el código se ejecute.

**Exclusiones de cobertura justificadas**

- `Ejercicio5MyApiGestorApplication` y `Ejercicio5ClienteApplication`: solo contienen `main()` con `SpringApplication.run(...)`. El arranque del contexto sí se prueba con `contextLoads`, pero el `main` no es lógica evaluable.
- En el frontend, `proyecto.js` y `pplmproyecto.js` (vista de tareas) quedan fuera del cálculo de cobertura de Sonar: dependen de la sesión del navegador y de Bootstrap en tiempo real, y se cubren con las pruebas de integración (Playwright) de la práctica 2.
- Ramas: 84 % en el backend. Antes eran 71 % por la validación `!objeto.equals(null)`, que nunca podía ser falsa; se eliminó al atender el hallazgo java:S2159 de SonarQube (incidencia 10).

## 3. Integración continua en Docker

`ci/docker-compose.yml` (repo backend) levanta:

| Servicio | Imagen | Uso |
|---|---|---|
| `jenkins` | `gestor-jenkins:jdk21` (de `ci/jenkins/Dockerfile`, basada en `jenkins/jenkins:lts-jdk21`) | Jenkins sobre **JDK 21.0.13**, con psql, Node.js, sqlfluff y Trivy |
| `sonarqube` | `sonarqube:26.10.0.133078-community` | Análisis de calidad del código |
| `gestor-db` | `postgres:16` | Base `dbgestor` con `database/schema.sql` y `database/datos.sql` |

Configuración en Jenkins:

- **JDK**: herramienta `JDK 21` → `/opt/java/openjdk` (Java 21 del contenedor).
- **Maven**: herramienta `Maven 3.9.11` (instalación automática desde Apache), compatible con Java 21.
- **SonarQube**: servidor `SonarQube` → `http://sonarqube:9000`, credencial `sonar-token` (Secret text).

### 3.1 Pipelines

| Job | Jenkinsfile | Etapas |
|---|---|---|
| `gestor-backend` | `Jenkinsfile` (backend) | Entorno (java/mvn) → Compilar → Pruebas y cobertura (JUnit + JaCoCo) → Análisis SonarQube → Escaneo Trivy → Empaquetar |
| `gestor-frontend` | `Jenkinsfile` (frontend) | Entorno → Compilar → Pruebas Java y cobertura → Pruebas JavaScript (Jest) → Análisis SonarQube → Escaneo Trivy → Empaquetar |
| `gestor-base-datos` | `database/Jenkinsfile` (backend) | Análisis del SQL (sqlfluff) → Análisis de configuración (Trivy) → Crear base de prueba → Aplicar esquema y datos → Verificar integridad → Compatibilidad con el backend (Hibernate `validate` con Java 21) → Respaldo |

### 3.2 Escaneo de vulnerabilidades sin carpetas `target`

- Trivy: `trivy fs --skip-dirs target --skip-dirs "**/target"` (y `node_modules` en el frontend). El código fuente, el `pom.xml` y los Dockerfile sí se analizan.
- SonarQube: `sonar.exclusions=**/target/**` (y `node_modules` en el frontend).
- En el frontend SonarQube analiza el código Java; el JavaScript se valida con las pruebas de Jest del mismo pipeline (incidencia 8).

## 4. Incidencias encontradas y cómo se atendieron

| # | Origen | Hallazgo | Clasificación | Atención |
|---|---|---|---|---|
| 1 | Jenkins (BD #1) | El pipeline pedía la JDK `JDK21`, pero Jenkins ya tenía `JDK 21` sin ruta | Configuración | Se configuró `JDK 21` → `/opt/java/openjdk` y se usó ese nombre en los Jenkinsfile. |
| 2 | sqlfluff (BD #2) | `verificacion.sql`: columnas sin alias (AL03), formato de `UNION` (LT09, LT11) | Calidad de código | Se reescribió la consulta de resumen; BD #4 pasa sin observaciones. |
| 3 | Trivy config (BD #3) | Dockerfile de Jenkins: `RUN cd` en vez de `WORKDIR` (DS-0013, MEDIUM) y sin `HEALTHCHECK` (DS-0026, LOW) | Mala configuración real | Se usó `WORKDIR` y se agregó `HEALTHCHECK`; el contenedor ahora reporta *healthy*. |
| 4 | Maven / Trivy | Maven Central respondió 429 (Too Many Requests) porque Trivy descargaba los POM en cada escaneo | Problema de infraestructura | Trivy corre con `--offline-scan` usando el repositorio local de Maven que llena la etapa de pruebas. |
| 5 | Trivy (backend #1) | 19 vulnerabilidades: Tomcat 10.1.55 (4 CRITICAL), Jackson 2.21.4 (5 HIGH, 5 MEDIUM), driver PostgreSQL 42.7.11 (HIGH), Log4j 2.24.3 (MEDIUM) | Vulnerabilidades reales en dependencias | Tomcat 10.1.59, Jackson 2.21.7, PostgreSQL 42.7.12, Log4j 2.25.5. |
| 6 | Trivy (frontend) | 88 vulnerabilidades por Spring Boot 3.2.5 (Tomcat 10.1.20, Thymeleaf 3.1.2, Spring 6.1.6, Jackson 2.15.4…) | Vulnerabilidades reales | Actualización a Spring Boot 3.5.16 más las mismas versiones corregidas. |
| 7 | Trivy | CVE-2026-47884 y CVE-2026-47890 en `spring-webmvc` 6.2.19 (CRITICAL), corregidas solo en Spring 7.0.9 | **No aplica (justificado)** | 47884 requiere usar `XsltView` y 47890 requiere SSE con fragmentos de vista; ninguno de los dos microservicios los usa (la API responde JSON y el frontend usa Thymeleaf normal). Migrar a Spring Boot 4 se deja como trabajo futuro. |
| 8 | SonarQube (frontend #1–#3) | El analizador de JavaScript de Sonar (Node.js) no arrancaba o agotaba la memoria de Docker, que llegó a dejar de responder | Infraestructura (memoria) | El equipo tiene 7.3 GB de RAM. Se limitó la memoria de SonarQube, Jenkins usa un solo ejecutor, los contenedores se reinician solos y el frontend analiza en Sonar solo el código Java; el JavaScript queda cubierto por Jest (24 pruebas, 94.5 % de líneas). |
| 9 | Revisión de datos | El volcado original de la base tenía nombres, correos y contraseñas reales en texto plano | Exposición de datos personales | No se subió a los repositorios públicos; `database/datos.sql` usa datos ficticios. |
| 10 | SonarQube (backend #4) | 33 hallazgos: 18 vulnerabilidades java:S4684 (entidades JPA como `@RequestBody`, riesgo de *mass assignment*), 10 bugs java:S2159 (`!obj.equals(null)` siempre verdadero) y 5 code smells java:S6813 (inyección por atributo) | Reales | DTOs como records para la entrada de cada endpoint, inyección por constructor y eliminación de las comparaciones inútiles. El frontend quedó en 0 hallazgos. |

## 5. Cómo reproducir

```bash
# en el repo backend
cd ci
docker network create jenkins-ci   # solo la primera vez
docker compose up -d
```

Jenkins queda en http://localhost:8080 y SonarQube en http://localhost:9000. Los tres jobs apuntan a la rama `main` de los repositorios de GitHub.
