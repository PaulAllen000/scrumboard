pipeline {
    agent any

    environment {
        DOCKER_TAG = ''
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                script {
                    // Exemple : générer un tag Docker en fonction du commit
                    def commitHash = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.DOCKER_TAG = "my-app:${commitHash}"
                    echo "Docker tag: ${env.DOCKER_TAG}"
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                // Exemple : sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image with tag ${env.DOCKER_TAG}"
                // Exemple : sh "docker build -t ${env.DOCKER_TAG} ."
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
