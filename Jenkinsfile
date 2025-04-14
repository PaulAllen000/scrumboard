pipeline {
    agent any
    environment {
        DOCKER_IMAGE_NAME = "my-docker-image"
        DOCKER_TAG = "latest"
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Configure Environment') {
            steps {
                script {
                    // Git configuration commands to avoid SSL issues
                    bat "git config --system http.sslBackend schannel"
                    bat "git config --global http.sslVerify false"
                    bat "git config --global --add safe.directory *"
                    bat "git --version"
                    bat "docker --version"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    // Run npm install with --legacy-peer-deps to bypass the dependency conflict
                    bat 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build Docker image
                    echo "Building Docker Image"
                    bat "docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ."
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            // Run tests after npm install
                            bat 'npm test'
                        } catch (e) {
                            error "Tests failed: ${e}"
                        }
                    }
                }
            }
        }

        stage('Post Actions') {
            steps {
                junit '**/test-*.xml'  // Collect test results if applicable
                archiveArtifacts artifacts: '**/build/libs/*.jar', allowEmptyArchive: true
                cleanWs()  // Clean up workspace after job completes
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed. Check the logs for details."
        }
    }
}
