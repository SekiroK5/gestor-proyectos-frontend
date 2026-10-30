# Gestor de Proyectos - Frontend

Interfaz web del Gestor de Proyectos (Spring Boot, Thymeleaf, jQuery y Bootstrap) sobre **Java 21**.
Consume la API del backend configurada en `API_URL` (por defecto `http://localhost:8081`).

## Ejecutar

```bash
./mvnw spring-boot:run
```

## Pruebas

```bash
./mvnw verify          # pruebas Java + reporte JaCoCo (target/site/jacoco)
npm ci && npm run test:cobertura   # pruebas JavaScript con Jest (target/js-coverage)
npx playwright test    # pruebas de integracion (requiere frontend y backend arriba)
```

## Integracion continua

`Jenkinsfile`: compilacion con JDK 21, pruebas Java y JavaScript, SonarQube y Trivy. POM original y actualizado en `docs/pom/`.
