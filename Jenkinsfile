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
        
        stage('Install Dependencies') {
            steps {
                script {
                    try {
                        // Clean and install all dependencies
                        bat """
                        npm cache clean --force
                        npm install
                        
                        cd scrum-ui
                        npm install --legacy-peer-deps
                        npm install @angular/cli @angular-devkit/build-angular --save-dev
                        npm install karma karma-jasmine karma-chrome-launcher --save-dev
                        cd ..
                        """
                    } catch (e) {
                        echo "Dependency installation failed: ${e}"
                        archiveArtifacts artifacts: 'scrum-ui/npm-debug.log'
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
                            // Run tests with proper configuration
                            bat """
                            set NODE_OPTIONS=--openssl-legacy-provider
                            npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
                            """
                            junit '**/test-results.xml'
                            archiveArtifacts artifacts: 'coverage/**/*'
                        } catch (e) {
                            echo "Tests failed: ${e}"
                            archiveArtifacts artifacts: 'npm-debug.log,karma.log'
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
                            bat """
                            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                            docker push ${env.IMAGE_NAME}:${env.DOCKER_TAG}
                            """
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
            archiveArtifacts artifacts: 'scrum-ui/npm-debug.log,scrum-ui/karma.log', allowEmptyArchive: true
        }
        success {
            echo "Pipeline succeeded! Image: ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
        }
    }
}
