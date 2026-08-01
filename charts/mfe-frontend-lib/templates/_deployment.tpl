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
