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
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                script {
                    // Verify Node.js version (should be configured in Jenkins Global Tools)
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
                            npm cache clean --force
                            npm install --legacy-peer-deps
                            """
                    } catch (e) {
                        echo "Dependency installation failed: ${e}"
                        archiveArtifacts artifacts: 'npm-debug.log'
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
                            bat """
                            set NODE_OPTIONS=--openssl-legacy-provider
                            npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
                            """
                            junit '**/test-results.xml'
                            archiveArtifacts artifacts: 'coverage/**/*'
                    } catch (e) {
                        echo "Tests failed: ${e}"
                        archiveArtifacts artifacts: '**/karma.log,**/src/test.ts', allowEmptyArchive: true
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
