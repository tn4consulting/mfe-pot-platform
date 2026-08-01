{{- define "mfe-backend-lib.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app.kubernetes.io/name: {{ .Values.backend.name }}
    app.kubernetes.io/component: backend
spec:
  replicas: {{ .Values.backend.replicaCount | default 1 }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.backend.name }}
      app.kubernetes.io/component: backend
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ .Values.backend.name }}
        app.kubernetes.io/component: backend
    spec:
      containers:
        - name: {{ .Values.backend.name }}
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          imagePullPolicy: {{ .Values.backend.image.pullPolicy | default "IfNotPresent" }}
          ports:
            - containerPort: {{ .Values.backend.containerPort }}
          envFrom:
            - configMapRef:
                name: {{ .Values.backend.name }}-env
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.backend.containerPort }}
            initialDelaySeconds: 2
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: {{ .Values.backend.containerPort }}
            initialDelaySeconds: 5
            periodSeconds: 10
{{- end -}}
