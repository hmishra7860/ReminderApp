pipeline {
    agent any

    stages {
        stage('Checkout Source') {
            agent { label 'ubuntu' }
            steps {
                checkout scm
            }
        }

        stage('Lint Backend') {
            agent { label 'ubuntu' }
            steps {
                sh '''
                    echo "🔍 Running Ruff linter on backend code..."
                    docker run --rm -v $(pwd)/backend:/app -w /app python:3.12-slim \
                    sh -c "pip install ruff --quiet && ruff check . --ignore B008 --fix"
                '''
            }
        }

        stage('Test Backend') {
            agent { label 'ubuntu' }
            steps {
                script {
                    // Spin up an ephemeral PostgreSQL database container for testing
                    sh '''
                        echo "🐘 Starting temporary PostgreSQL test container..."
                        docker run -d --name test_postgres \
                            -e POSTGRES_DB=remindercal_test \
                            -e POSTGRES_USER=rcal \
                            -e POSTGRES_PASSWORD=rcalpass \
                            postgres:16-alpine

                        # Give Postgres a few seconds to initialize
                        sleep 5
                    '''

                    try {
                        // Run pytest inside a python container linked to the test database
                        // Run pytest inside a python container linked to the test database
                        sh '''
                            echo "🧪 Running Pytest unit & integration tests..."
                            docker run --rm --link test_postgres:postgres \
                                -v $(pwd)/backend:/app -w /app \
                                -e DATABASE_URL="postgresql+asyncpg://rcal:rcalpass@postgres:5432/remindercal_test" \
                                python:3.12-slim \
                                sh -c "pip install -r requirements.txt pytest pytest-asyncio httpx --quiet && python -m pytest tests/ -v --tb=short"
                        '''
                    } finally {
                        // Ensure the temporary test database container is always cleaned up
                        sh 'docker stop test_postgres && docker rm test_postgres || true'
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
    }
}
