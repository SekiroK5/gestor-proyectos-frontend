# Imagen del microservicio frontend (interfaz web Thymeleaf del Gestor de Proyectos) sobre Java 21.
# Etapa 1: compila con Maven y JDK 21. Las pruebas (JUnit y Jest) se ejecutan en el pipeline de Jenkins.
FROM maven:3.9.11-eclipse-temurin-21 AS compilacion
WORKDIR /app
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src/main ./src/main
RUN mvn -B -ntp -DskipTests -Djacoco.skip=true package

# Etapa 2: solo el JRE de Java 21 y el .jar, ejecutado con un usuario sin privilegios.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system gestor && useradd --system --gid gestor --no-create-home gestor
COPY --from=compilacion /app/target/Ejercicio5Cliente-0.0.1-SNAPSHOT.jar app.jar
USER gestor
EXPOSE 8080
# La direccion de la API se configura con API_URL (ver deploy/docker-compose.yml del repositorio backend).
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080' || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
