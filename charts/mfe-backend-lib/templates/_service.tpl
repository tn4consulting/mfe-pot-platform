{{- define "mfe-backend-lib.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app.kubernetes.io/name: {{ .Values.backend.name }}
    app.kubernetes.io/component: backend
spec:
  selector:
    app.kubernetes.io/name: {{ .Values.backend.name }}
    app.kubernetes.io/component: backend
  ports:
    - port: {{ .Values.backend.servicePort | default .Values.backend.containerPort }}
      targetPort: {{ .Values.backend.containerPort }}
{{- end -}}
