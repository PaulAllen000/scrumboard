pipeline {
    agent any
    
    environment {
        IMAGE_NAME = "paulallen000/scrum-board"  
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
        
        stage('Install Dependencies') {
            steps {
                bat 'npm install'
                
                dir('scrum-ui') {
                    bat 'npm install'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('scrum-ui') {
                    bat 'npm test'
                }
            }
        }    
        
        stage('Build Docker Image') {
            steps {
                script {
                    bat "docker build -t ${env.IMAGE_NAME}:${env.DOCKER_TAG} ."
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
                    bat "echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin"
                    bat "docker push ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline succeeded! Image: ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
