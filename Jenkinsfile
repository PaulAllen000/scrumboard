pipeline {
    agent any
    
    environment {
        IMAGE_NAME = "your-dockerhub-username/myapp"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/PaulAllen000/scrumboard.git'
            }
        }
        
        stage('Build') {
            steps {
        bat 'npm install' 
        bat 'npm install --only=dev' 
            }
        }
        
        stage('Test') {
            steps {
                bat 'npm test'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                bat "docker build -t ${IMAGE_NAME}:${env.BUILD_ID} ."
            }
        }
        
        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS%"
                    bat "docker push ${IMAGE_NAME}:${env.BUILD_ID}"
                }
            }
        }
    }
}
