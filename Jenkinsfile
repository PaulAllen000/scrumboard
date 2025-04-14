pipeline {
    agent any

    environment {
        // Environment variables
        DOCKER_TAG = ''
        GIT_SSL_NO_VERIFY = "1"  // Temporary SSL workaround
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(2) // Retry entire pipeline if failed
    }

    stages {
        stage('Configure Git') {
            steps {
                script {
                    // Permanent Git SSL configuration for Windows
                    bat '''
                        git config --system http.sslBackend schannel
                        git config --global http.sslVerify false
                        git config --global --add safe.directory *
                    '''
                }
            }
        }

        stage('Checkout Code') {
            steps {
                retry(3) {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: 'main']],
                        extensions: [[$class: 'CloneOption', timeout: 30]],
                        gitTool: 'Default',
                        userRemoteConfigs: [[
                            url: 'https://github.com/PaulAllen000/scrumboard.git',
                            credentialsId: ''
                        ]]
                    ])
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    // Get short commit hash for Docker tag
                    def commitHash = bat(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.DOCKER_TAG = "my-app:${commitHash}"
                    echo "Generated Docker tag: ${env.DOCKER_TAG}"
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
                            error "Tests failed: ${e}"
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
                        bat "docker build -t ${env.DOCKER_TAG} ."
                    } catch (e) {
                        error "Docker build failed: ${e}"
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
            echo "Successfully built Docker image: ${env.DOCKER_TAG}"
        }
    }
}
