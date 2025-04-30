pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE_NAME = "my-docker-image"
        DOCKER_TAG = "latest"
        // Temporary SSL workaround
        GIT_SSL_NO_VERIFY = "1"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(2) // Retry entire pipeline if failed
    }

    stages {
        stage('Checkout') {
            steps {
                retry(3) {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: 'main']],
                        extensions: [
                            [$class: 'CloneOption', timeout: 30],
                        ],
                        userRemoteConfigs: [[
                            url: 'https://github.com/PaulAllen000/scrumboard.git'
                        ]]
                    ])
                }
            }
        }

        stage('Configure Environment') {
            steps {
                script {
                    // Permanent Git SSL configuration for Windows
                    bat """
                        git config --system http.sslBackend schannel
                        git config --global http.sslVerify false
                        git config --global --add safe.directory *
                    """
                    // Verify tools
                    bat 'git --version'
                    bat 'docker --version'
                    bat 'node --version'
                    bat 'npm --version'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            bat 'npm install --legacy-peer-deps'
                            // Install Angular CLI if needed
                            bat 'npm install -g @angular/cli'
                        } catch (e) {
                            error "Dependency installation failed: ${e}"
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
    steps {
        dir('.') { // Explicitly ensure we are in the root directory
            script {
                try {
                    // Debugging: Print current directory and contents
                    bat 'cd'
                    bat 'dir'

                    // Build Docker image from the root where Dockerfile is located
                    bat """
                        docker build ^
                            --build-arg NODE_ENV=production ^
                            -t ${env.DOCKER_IMAGE_NAME}:${env.DOCKER_TAG} .
                    """
                } catch (e) {
                    error "Docker build failed: ${e}"
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
                            // Run tests with proper configuration
                            bat """
                                set NODE_OPTIONS=--openssl-legacy-provider
                                npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
                            """
                        } catch (e) {
                            archiveArtifacts artifacts: '**/test-results.xml,**/coverage/**/*'
                            error "Tests failed: ${e}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                node {
                    // Archive test results and logs
                    junit '**/test-results.xml'
                    archiveArtifacts artifacts: '**/npm-debug.log,**/test-results/**/*', allowEmptyArchive: true
                    cleanWs()
                }
            }
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
        }
        success {
            echo "Successfully built Docker image: ${env.DOCKER_IMAGE_NAME}:${env.DOCKER_TAG}"
        }
    }
}
