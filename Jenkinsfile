pipeline {
    agent any

    environment {
        GIT_SSL_NO_VERIFY = "1"
        DOCKER_TAG = ''
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(2)
    }

    stages {
        stage('Configure Environment') {
            steps {
                script {
                    bat '''
                        git config --system http.sslBackend schannel
                        git config --global http.sslVerify false
                        git config --global --add safe.directory *
                    '''
                    bat 'git --version'
                    bat 'docker --version'
                }
            }
        }

        stage('Checkout Code') {
            steps {
                retry(3) {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: 'main']],
                        extensions: [
                            [$class: 'CloneOption', timeout: 30],
                            [$class: 'CleanBeforeCheckout']
                        ],
                        gitTool:
