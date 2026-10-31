// Pipeline del frontend: compila con Java 21, ejecuta las pruebas de Java (JaCoCo) y de JavaScript (Jest),
// analiza el codigo en SonarQube y busca vulnerabilidades con Trivy sin revisar target ni node_modules.
pipeline {
    agent any

    tools {
        jdk 'JDK 21'
        maven 'Maven 3.9.11'
    }

    environment {
        TRIVY_CACHE_DIR = '/var/jenkins_home/.cache/trivy'
        // Trivy lee las dependencias del repositorio local de Maven (~/.m2) en lugar de pedirlas a Maven Central.
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    stages {
        stage('Entorno') {
            steps {
                sh 'java -version'
                sh 'mvn -v'
                sh 'node --version && npm --version'
            }
        }

        stage('Compilar') {
            steps {
                sh 'mvn -B -ntp clean compile'
            }
        }

        stage('Pruebas Java y cobertura') {
            steps {
                sh 'mvn -B -ntp verify'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                    recordCoverage(tools: [[parser: 'JACOCO', pattern: 'target/site/jacoco/jacoco.xml']],
                                   sourceDirectories: [[path: 'src/main/java']])
                    archiveArtifacts artifacts: 'target/site/jacoco/**', allowEmptyArchive: true
                }
            }
        }

        stage('Pruebas JavaScript') {
            steps {
                sh 'npm ci --no-audit --no-fund'
                sh 'npx jest --ci --coverage --reporters=default --reporters=jest-junit'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'target/jest-junit.xml'
                    archiveArtifacts artifacts: 'target/js-coverage/**', allowEmptyArchive: true
                }
            }
        }

        stage('Analisis SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    // El analizador de JS/CSS de Sonar corre en Node.js; se limita su memoria porque el equipo tiene poca RAM.
                    withEnv(['MAVEN_OPTS=-Xmx512m']) {
                        sh 'mvn -B -ntp sonar:sonar -Dsonar.javascript.node.maxspace=512'
                    }
                }
            }
        }

        stage('Escaneo de vulnerabilidades') {
            steps {
                sh 'trivy fs --offline-scan --skip-version-check --scanners vuln,secret,misconfig --skip-dirs target --skip-dirs node_modules --skip-dirs "**/target" --format table --output trivy-frontend.txt .'
                sh 'trivy fs --offline-scan --skip-version-check --scanners vuln,secret,misconfig --skip-dirs target --skip-dirs node_modules --skip-dirs "**/target" --format json --output trivy-frontend.json .'
                sh 'cat trivy-frontend.txt'
                script {
                    def graves = sh(returnStatus: true,
                        script: 'trivy fs --offline-scan --skip-version-check --scanners vuln,secret --skip-dirs target --skip-dirs node_modules --skip-dirs "**/target" --severity HIGH,CRITICAL --exit-code 1 --quiet .')
                    if (graves != 0) {
                        unstable('Trivy encontro vulnerabilidades HIGH o CRITICAL, revisar trivy-frontend.txt')
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-frontend.*', allowEmptyArchive: true
                }
            }
        }

        stage('Empaquetar') {
            steps {
                sh 'mvn -B -ntp -DskipTests package'
                archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
            }
        }
    }
}
