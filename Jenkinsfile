pipeline {
    agent any
    
    environment {
        IMAGE_NAME = "mm0krani/scrum-board"  
        DOCKER_TAG = "${env.BUILD_ID}-${env.GIT_COMMIT.take(7)}"  
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    extensions: [],
                    userRemoteConfigs: [[
                        url: 'https://github.com/PaulAllen000/scrumboard.git'
                    ]]
                ])
            }
        }
        
        stage('Clean and Install Dependencies') {
            steps {
                script {
                    try {
                        // Clean npm cache
                        bat 'npm cache clean --force'
                        
                        // Install root dependencies
                        bat 'npm install'
                        
                        // Install UI dependencies with legacy peer deps
                        dir('scrum-ui') {
                            bat 'npm install --legacy-peer-deps || npm install --force'
                        }
                    } catch (e) {
                        echo "Dependency installation failed: ${e}"
                        archiveArtifacts artifacts: '**/npm-debug.log'
                        error 'Failed to install dependencies'
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            bat 'npm test'
                        } catch (e) {
                            junit '**/test-results.xml'  // Archive test results if configured
                            error 'Tests failed'
                        }
                    }
                }
            }
        }    
        
        stage('Build Docker Image') {
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
        
        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        try {
                            bat "echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin"
                            bat "docker push ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
                        } catch (e) {
                            echo "Docker push failed: ${e}"
                            error 'Failed to push Docker image'
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
            archiveArtifacts artifacts: '**/npm-debug.log', allowEmptyArchive: true
        }
        success {
            echo "Pipeline succeeded! Image: ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
        }
    }
}
