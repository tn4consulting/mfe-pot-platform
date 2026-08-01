{{/*
Unlike mfe-frontend-lib's single-JSON-blob ConfigMap, BFFs already read
plain individual env vars via process.env (PORT, HOST, upstream *_URL
vars) -- no code change needed there, so this renders `.Values.backend.env`
as ordinary flat ConfigMap keys instead.
*/}}
{{- define "mfe-backend-lib.configmap" -}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Values.backend.name }}-env
  labels:
    app.kubernetes.io/name: {{ .Values.backend.name }}
    app.kubernetes.io/component: backend
data:
  {{- range $key, $value := .Values.backend.env }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end -}}
