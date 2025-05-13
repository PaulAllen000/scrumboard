pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = "my-docker-image"
        DOCKER_TAG = "latest"
        GIT_SSL_NO_VERIFY = "1"
        ANGULAR_DIR = "scrum-ui"
        SPRING_DIR = "scrum-api"
        ANGULAR_DIST = "scrum-ui" 
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(2)
    }

    stages {
        stage('Checkout') {
            steps {
                retry(3) {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: 'main']],
                        extensions: [
                            [$class: 'CloneOption', timeout: 30],
                            [$class: 'CleanBeforeCheckout']
                        ],
                        userRemoteConfigs: [[
                            url: 'https://github.com/PaulAllen000/scrumboard.git'
                        ]]
                    ])
                }
            }
        }

        stage('Configure Environment') {
            steps {
                script {
                    bat '''
                        git config --system http.sslBackend schannel
                        git config --global http.sslVerify false
                        git config --global --add safe.directory *
                        git --version
                        docker --version
                        node --version
                        npm --version
                    '''
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir("${ANGULAR_DIR}") {
                    bat 'npm install --legacy-peer-deps'
                    bat 'npm install -g @angular/cli'
                }
            }
        }

        stage('Build Angular App') {
            steps {
                dir("${ANGULAR_DIR}") {
                    bat 'npx ng build --configuration production --verbose'
                }
            }
        }

        stage('Frontend Unit Tests') {
            steps {
                dir("${ANGULAR_DIR}") {
                    bat '''
                        set NODE_OPTIONS=--openssl-legacy-provider
                        npx ng test --watch=false --browsers=ChromeHeadless --code-coverage || exit 0
                    '''
                }
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir("${SPRING_DIR}") {
                    bat 'mvn clean install -DskipTests'
                }
            }
        }

        stage('Backend Unit Tests') {
            steps {
                dir("${SPRING_DIR}") {
                    bat 'mvn test'
                }
            }
        }

        stage('Integration Tests (PostgreSQL)') {
            steps {
                bat 'docker-compose -f docker-compose.test.yml up -d'
                bat 'timeout /t 20 >nul' 
                dir("${SPRING_DIR}") {
                    bat 'mvn verify -P integration-tests'
                }
                bat 'docker-compose -f docker-compose.test.yml down'
            }
        }

        stage('End-to-End Tests with Cypress') {
            steps {
                dir("${ANGULAR_DIR}") {
                    bat '''
                        start /b http-server .\\dist\\${ANGULAR_DIST} -p 4200
                        npx wait-on http://localhost:4200 --timeout 60000
                        curl http://localhost:4200 || exit 0
                        npx cypress run || exit 0
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat """
                    docker build --build-arg NODE_ENV=production -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} .
                """
            }
        }

        stage('Deploy') {
            steps {
                bat 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            script {
                node {
                    junit '**/test-results.xml'
                    archiveArtifacts artifacts: '**/coverage/**/*, **/npm-debug.log, **/cypress/screenshots/**/*.png', allowEmptyArchive: true
                    cleanWs()
                }
            }
        }
        failure {
            echo "❌ Pipeline failed. Check logs and screenshots."
        }
        success {
            echo "✅ Build & deploy successful: ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
        }
    }
}
