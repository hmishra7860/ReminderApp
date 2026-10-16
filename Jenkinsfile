pipeline {
    agent any

    environment {
        // Replace with your Docker Hub username or private registry URL (e.g., "myuser" or "registry.example.com/myuser")
        DOCKER_REGISTRY = "varutik332"
        BACKEND_IMAGE   = "${DOCKER_REGISTRY}/remindercal-backend"
        FRONTEND_IMAGE  = "${DOCKER_REGISTRY}/remindercal-frontend"
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        K8S_NAMESPACE   = "remindercal"
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Lint Backend') {
            steps {
                sh '''
                    docker run --rm -v $(pwd)/backend:/app -w /app python:3.12-slim \
                    sh -c "pip install ruff --quiet && ruff check ."
                '''
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                            # Build & Push Backend
                            docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend
                            docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                            docker push ${BACKEND_IMAGE}:latest

                            # Build & Push Frontend (note the camelCase directory frontEnd)
                            docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontEnd
                            docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                            docker push ${FRONTEND_IMAGE}:latest

                            docker logout
                        '''
                    }
                }
            }
        }

        stage('Inject Secrets & Deploy to K3s') {
            steps {
                withCredentials([
                    file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE'),
                    string(credentialsId: 'postgres-user', variable: 'PG_USER'),
                    string(credentialsId: 'postgres-password', variable: 'PG_PASS'),
                    string(credentialsId: 'postgres-db', variable: 'PG_DB'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SEC'),
                    string(credentialsId: 'smtp-host', variable: 'SMTP_H'),
                    string(credentialsId: 'smtp-port', variable: 'SMTP_P'),
                    string(credentialsId: 'smtp-user', variable: 'SMTP_U'),
                    string(credentialsId: 'smtp-pass', variable: 'SMTP_PW'),
                    string(credentialsId: 'from-email', variable: 'FROM_EM'),
                    string(credentialsId: 'grafana-admin-password', variable: 'GRAFANA_PW')
                ]) {
                    sh '''
                        export KUBECONFIG=$KUBECONFIG_FILE

                        # 1. Ensure Namespace Exists
                        kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                        # 2. Construct DATABASE_URL dynamically and sync Kubernetes Secret from Jenkins Credentials
                        DB_URL="postgresql+asyncpg://${PG_USER}:${PG_PASS}@postgres:5432/${PG_DB}"

                        kubectl create secret generic rcal-app-secrets \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=POSTGRES_USER="${PG_USER}" \
                            --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
                            --from-literal=POSTGRES_DB="${PG_DB}" \
                            --from-literal=DATABASE_URL="${DB_URL}" \
                            --from-literal=JWT_SECRET="${JWT_SEC}" \
                            --from-literal=SMTP_HOST="${SMTP_H}" \
                            --from-literal=SMTP_PORT="${SMTP_P}" \
                            --from-literal=SMTP_USER="${SMTP_U}" \
                            --from-literal=SMTP_PASS="${SMTP_PW}" \
                            --from-literal=FROM_EMAIL="${FROM_EM}" \
                            --from-literal=GF_SECURITY_ADMIN_PASSWORD="${GRAFANA_PW}" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        # 3. Replace image placeholders in manifests with current build tag
                        sed -i "s|REGISTRY_PLACEHOLDER|${DOCKER_REGISTRY}|g" k8s/backend.yaml k8s/frontend.yaml
                        sed -i "s|TAG_PLACEHOLDER|${IMAGE_TAG}|g" k8s/backend.yaml k8s/frontend.yaml

                        # 4. Apply Modular Kubernetes Manifests in Order
                        kubectl apply -f k8s/database.yaml
                        kubectl rollout status deployment/postgres -n ${K8S_NAMESPACE} --timeout=90s

                        kubectl apply -f k8s/backend.yaml
                        kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=90s

                        kubectl apply -f k8s/frontend.yaml
                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=90s

                        kubectl apply -f k8s/monitoring.yaml
                    '''
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