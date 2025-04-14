pipeline {
    agent any

    environment {
        DOCKER_TAG = ''
        // Temporary SSL workaround if needed
        GIT_SSL_NO_VERIFY = "1" 
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(3) // Retry the entire pipeline if failed
    }

    stages {
        stage('Verify Environment') {
            steps {
                script {
                    // Verify Git is available
                    bat 'git --version'
                    
                    // Temporary SSL fix if certificate issues persist
                    bat 'git config --global http.sslVerify false'
                }
            }
        }

        stage('Checkout') {
            steps {
                retry(3) {
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
        }

        stage('Build') {
            steps {
                script {
                    def commitHash = bat(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.DOCKER_TAG = "my-app:${commitHash}"
                    echo "Docker tag: ${env.DOCKER_TAG}"
                }
            }
        }

        stage('Test') {
            steps {
                dir('scrum-ui') {
                    script {
                        try {
                            bat 'npm install'
                            bat 'npm test'
                        } catch (e) {
                            echo "Tests failed: ${e}"
                            archiveArtifacts artifacts: '**/test-results.xml,**/coverage/**/*'
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
                        bat "docker build -t ${env.DOCKER_TAG} ."
                    } catch (e) {
                        echo "Docker build failed: ${e}"
                        archiveArtifacts artifacts: 'docker-build.log'
                        error 'Failed to build Docker image'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                node { // Required for cleanWs on Windows
                    cleanWs()
                    archiveArtifacts artifacts: '**/npm-debug.log,**/karma.log,**/docker-build.log', allowEmptyArchive: true
                }
            }
        }
        failure {
            echo "Pipeline failed. Check archived logs for details."
            // Optional: Add notification here
        }
        success {
            echo "Successfully built Docker image: ${env.DOCKER_TAG}"
        }
    }
}
