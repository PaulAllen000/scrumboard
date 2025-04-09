pipeline {
    agent any
    
    environment {
        IMAGE_NAME = "paulallen000/scrum-board"  
        DOCKER_TAG = "${env.BUILD_ID}-${env.GIT_COMMIT.take(7)}"
        NODE_OPTIONS = "--openssl-legacy-provider"
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
        
        stage('Setup Node Environment') {
            steps {
                script {
                    // Verify Node.js is installed
                    bat 'node --version'
                    bat 'npm --version'
                }
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
                            bat 'npm install --legacy-peer-deps'
                            // Fix potential security vulnerabilities
                            bat 'npm audit fix --force || true'
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
                            // Set OpenSSL legacy provider and run tests
                            bat 'set NODE_OPTIONS=--openssl-legacy-provider && npm test'
                            // Archive test results if JUnit reporter is configured
                            junit '**/test-results.xml'
                        } catch (e) {
                            echo "Tests failed: ${e}"
                            archiveArtifacts artifacts: '**/karma-*.log'
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
        
        stage('Push Docker Image') {
            when {
                expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
            }
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
            archiveArtifacts artifacts: '**/npm-debug.log,**/karma-*.log', allowEmptyArchive: true
        }
        success {
            echo "Pipeline succeeded! Image: ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
        }
    }
}
