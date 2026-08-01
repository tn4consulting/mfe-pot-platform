{{- define "mfe-frontend-lib.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app.kubernetes.io/name: {{ .Values.frontend.name }}
    app.kubernetes.io/component: frontend
spec:
  selector:
    app.kubernetes.io/name: {{ .Values.frontend.name }}
    app.kubernetes.io/component: frontend
  ports:
    - port: {{ .Values.frontend.servicePort | default 80 }}
      targetPort: {{ .Values.frontend.containerPort | default 80 }}
{{- end -}}
