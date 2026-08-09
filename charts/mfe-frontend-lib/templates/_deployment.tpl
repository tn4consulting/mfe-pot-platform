{{- define "mfe-frontend-lib.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app.kubernetes.io/name: {{ .Values.frontend.name }}
    app.kubernetes.io/component: frontend
spec:
  replicas: {{ .Values.frontend.replicaCount | default 1 }}
  # See mfe-backend-lib's identical block for the rationale -- same
  # zero-downtime-rolling-update reasoning applies to the frontend
  # Deployment.
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.frontend.name }}
      app.kubernetes.io/component: frontend
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ .Values.frontend.name }}
        app.kubernetes.io/component: frontend
    spec:
      # See mfe-backend-lib's identical block for the rationale -- soft,
      # harmless no-op below replicas: 2 or on a single-node cluster.
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app.kubernetes.io/name: {{ .Values.frontend.name }}
                    app.kubernetes.io/component: frontend
                topologyKey: kubernetes.io/hostname
      containers:
        - name: {{ .Values.frontend.name }}
          image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
          imagePullPolicy: {{ .Values.frontend.image.pullPolicy | default "IfNotPresent" }}
          ports:
            - containerPort: {{ .Values.frontend.containerPort | default 80 }}
          envFrom:
            - configMapRef:
                name: {{ .Values.frontend.name }}-env
          readinessProbe:
            httpGet:
              path: /
              port: {{ .Values.frontend.containerPort | default 80 }}
            initialDelaySeconds: 2
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: {{ .Values.frontend.containerPort | default 80 }}
            initialDelaySeconds: 5
            periodSeconds: 10
{{- end -}}
