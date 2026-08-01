{{/*
Renders the ConfigMap a frontend Deployment reads its runtime config from.
The whole `.Values.frontend.runtimeConfig` map is serialized to one JSON
blob under a single key, MFE_POT_ENV_JSON -- tools/docker/frontend-entrypoint.sh
writes it verbatim into env.js at container startup. One generic key
instead of per-field ConfigMap entries because every app has a different
runtime-config shape (see libs/shared/runtime-config); this way the chart
doesn't need to know what any particular app's config looks like.
*/}}
{{- define "mfe-frontend-lib.configmap" -}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Values.frontend.name }}-env
  labels:
    app.kubernetes.io/name: {{ .Values.frontend.name }}
    app.kubernetes.io/component: frontend
data:
  MFE_POT_ENV_JSON: {{ .Values.frontend.runtimeConfig | default dict | toJson | quote }}
{{- end -}}
