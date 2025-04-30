pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = "my-docker-image"
        DOCKER_TAG = "latest"
        GIT_SSL_NO_VERIFY = "1"
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
                            [$class: 'CloneOption', timeout: 30]
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
                    bat """
                        git config --system http.sslBackend schannel
                        git config --global http.sslVerify false
                        git config --global --add safe.directory *
                    """
                    bat 'git --version'
                    bat 'docker --version'
                    bat 'node --version'
                    bat 'npm --version'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            bat 'npm install --legacy-peer-deps'
                            bat 'npm install -g @angular/cli'
                        } catch (e) {
                            error "Dependency installation failed: ${e}"
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('.') {
                    script {
                        try {
                            bat 'cd'
                            bat 'dir'
                            bat """
                                docker build ^
                                    --build-arg NODE_ENV=production ^
                                    -t ${env.DOCKER_IMAGE_NAME}:${env.DOCKER_TAG} .
                            """
                        } catch (e) {
                            error "Docker build failed: ${e}"
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            // Run Jest tests with CI configuration
                            bat 'npm run test:ci'
                        } catch (e) {
                            archiveArtifacts artifacts: '**/coverage/**/*'
                            error "Tests failed: ${e}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                node {
                    // Archive JUnit test results for Jenkins
                    junit 'scrum-ui/junit.xml'
                    archiveArtifacts artifacts: '**/npm-debug.log,**/test-results/**/*,**/coverage/**/*', allowEmptyArchive: true
                    cleanWs()
                }
            }
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
        }
        success {
            echo "Successfully built Docker image: ${env.DOCKER_IMAGE_NAME}:${env.DOCKER_TAG}"
        }
    }
}
