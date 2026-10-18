pipeline {
    agent {
        label 'ubuntu'
    }

    environment {
        DOCKER_REGISTRY = "varutik332"
        BACKEND_IMAGE   = "${DOCKER_REGISTRY}/remindercal-backend"
        FRONTEND_IMAGE  = "${DOCKER_REGISTRY}/remindercal-frontend"
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        K8S_NAMESPACE   = "remindercal"
    }

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

        stage('Build & Push Docker Images') {
            agent { label 'ubuntu' }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                            # Build & Push Backend
                            docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend
                            docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                            docker push ${BACKEND_IMAGE}:latest

                            # Build & Push Frontend
                            docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontEnd
                            docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                            docker push ${FRONTEND_IMAGE}:latest

                            docker logout
                        '''
                    }
                }
                stash includes: 'k8s/**', name: 'k8s-manifests'
            }
        }

        stage('Inject Secrets & Deploy to K3s') {
            agent { label 'linux' }
            steps {
                unstash 'k8s-manifests'

                withCredentials([
                    file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE'),
                    string(credentialsId: 'postgres-user', variable: 'PG_USER'),
                    string(credentialsId: 'postgres-password', variable: 'PG_PASS'),
                    string(credentialsId: 'postgres-db', variable: 'PG_DB'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SEC'),
                    string(credentialsId: 'grafana-admin-password', variable: 'GRAFANA_PW')
                ]) {
                    script {
                        try {
                            sh '''
                                export KUBECONFIG=$KUBECONFIG_FILE

                                # Ensure kubectl is available
                                if ! command -v kubectl &> /dev/null; then
                                    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
                                    chmod +x kubectl && sudo mv kubectl /usr/local/bin/
                                fi

                                # 1. Ensure Namespace Exists
                                kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                                # 2. Sync Secrets
                                DB_URL="postgresql+asyncpg://${PG_USER}:${PG_PASS}@postgres:5432/${PG_DB}"

                                kubectl create secret generic rcal-app-secrets \
                                    --namespace=${K8S_NAMESPACE} \
                                    --from-literal=POSTGRES_USER="${PG_USER}" \
                                    --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
                                    --from-literal=POSTGRES_DB="${PG_DB}" \
                                    --from-literal=DATABASE_URL="${DB_URL}" \
                                    --from-literal=JWT_SECRET="${JWT_SEC}" \
                                    --from-literal=GF_SECURITY_ADMIN_PASSWORD="${GRAFANA_PW}" \
                                    --dry-run=client -o yaml | kubectl apply -f -

                                # 3. Replace Image Tags
                                sed -i "s|REGISTRY_PLACEHOLDER|${DOCKER_REGISTRY}|g" k8s/backend.yaml k8s/frontend.yaml
                                sed -i "s|TAG_PLACEHOLDER|${IMAGE_TAG}|g" k8s/backend.yaml k8s/frontend.yaml

                                # 4. Apply Manifests with Rollout Validation
                                kubectl apply -f k8s/database.yaml
                                
                                kubectl apply -f k8s/backend.yaml
                                kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=90s

                                kubectl apply -f k8s/frontend.yaml
                                kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=90s

                                kubectl apply -f k8s/monitoring.yaml
                            '''
                        } catch (Exception e) {
                            currentBuild.result = 'FAILURE'
                            echo "❌ Deployment failed! Initiating automated rollback..."
                            sh '''
                                export KUBECONFIG=$KUBECONFIG_FILE
                                kubectl rollout undo deployment/backend -n ${K8S_NAMESPACE} || true
                                kubectl rollout undo deployment/frontend -n ${K8S_NAMESPACE} || true
                            '''
                            error("Pipeline aborted: Deployment failed and was automatically rolled back. Error: ${e.message}")
                            }
                    }
                    }
                }
            }
        }



           post{
               always {
                 node('ubuntu') {
                      sh 'docker image prune -f || true'
                    }
                }
            }

}