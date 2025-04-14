pipeline {
    agent any

    tools {
        git 'GitOnD'
    }

    environment {
        IMAGE_NAME = "paulallen000/scrum-board"
        DOCKER_TAG = "${env.BUILD_ID}-${env.GIT_COMMIT.take(7)}"
        NODE_OPTIONS = "--openssl-legacy-provider"
    }

    options {
        skipDefaultCheckout() // Pour éviter le checkout automatique avant config SSL
    }

    stages {
        stage('Préparer Git SSL') {
            steps {
                bat 'git config --global http.sslCAInfo "D:/Git/mingw64/ssl/certs/ca-bundle.crt"'
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node.js') {
            steps {
                script {
                    bat """
                    node --version
                    npm --version
                    """
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            bat """
                            rd /s /q node_modules
                            npm cache clean --force
                            npm install --legacy-peer-deps
                            """
                        } catch (e) {
                            echo "Dependency installation failed: ${e}"
                            archiveArtifacts artifacts: 'npm-debug.log', allowEmptyArchive: true
                            error 'Failed to install dependencies'
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
                            bat "npx jest --coverage"
                            junit 'coverage/junit.xml' // Optional: if jest-junit is used
                            archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                        } catch (e) {
                            echo "Tests failed: ${e}"
                            archiveArtifacts artifacts: '**/jest.log', allowEmptyArchive: true
                            error 'Tests failed'
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            when {
                expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
            }
            steps {
                script {
                    try {
                        bat "docker build -t ${env.IMAGE_NAME}:${env.DOCKER_TAG} ."
                    } catch (e) {
                        echo "Docker build failed: ${e}"
                        error 'Failed to build Docker image'
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            archiveArtifacts artifacts: '**/npm-debug.log,**/karma.log', allowEmptyArchive: true
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
        }
    }
}
