pipeline {
    agent any
    
    environment {
        IMAGE_NAME = "paulallen000/scrum-board"  
        DOCKER_TAG = "${env.BUILD_ID}-${env.GIT_COMMIT.take(7)}"
        NODE_OPTIONS = "--openssl-legacy-provider"
        NODE_VERSION = "18.16.1" // LTS version supported by Angular
    }
    
    stages {
        stage('Setup Node.js') {
            steps {
                script {
                    // Install and use correct Node version
                    bat """
                    nvm install ${env.NODE_VERSION}
                    nvm use ${env.NODE_VERSION}
                    node --version
                    npm --version
                    """
                }
            }
        }
        
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
                        bat """
                        npm cache clean --force
                        cd scrum-ui
                        npm install --legacy-peer-deps
                        npm install @angular/cli @angular-devkit/build-angular karma karma-jasmine karma-chrome-launcher jasmine-core --save-dev
                        cd ..
                        """
                        
                        dir('scrum-ui') {
                            bat 'npx ng version || echo "Angular CLI verification failed"'
                        }
                    } catch (e) {
                        echo "Dependency installation failed: ${e}"
                        archiveArtifacts artifacts: 'scrum-ui/npm-debug.log'
                        error 'Failed to install dependencies'
                    }
                }
            }
        }
        
        stage('Verify Test Configuration') {
            steps {
                dir('scrum-ui') {
                    script {
                        bat 'npx ng config projects.scrum-ui.architect.test || echo "Check project configuration"'
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
                            archiveArtifacts artifacts: 'npm-debug.log,karma.log,src/test.ts'
                            error 'Tests failed'
                        }
                    }
                }
            }
        }
        
        stage('Prepare for Docker Build') {
            when {
                expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
            }
            steps {
                script {
                    bat """
                    mkdir dist || echo "Directory exists"
                    copy scrum-ui\\dist\\* .\\dist\\ || echo "No dist files found"
                    """
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
                        archiveArtifacts artifacts: 'docker-build.log'
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
            archiveArtifacts artifacts: 'scrum-ui/npm-debug.log,scrum-ui/karma.log,docker-build.log', allowEmptyArchive: true
        }
        success {
            echo "Pipeline succeeded! Image: ${env.IMAGE_NAME}:${env.DOCKER_TAG}"
            // Optional: Add success notification
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
            emailext body: 'Pipeline failed: ${BUILD_URL}', 
                    subject: 'Pipeline Failed: ${JOB_NAME}', 
                    to: 'dev-team@example.com'
        }
    }
}
