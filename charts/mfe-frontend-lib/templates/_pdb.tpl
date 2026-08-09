{{/*
Opt-in via .Values.frontend.podDisruptionBudget.enabled (default false) --
same reasoning as mfe-backend-lib's identical template: a
PodDisruptionBudget with minAvailable >= replicaCount blocks voluntary
evictions entirely rather than helping, so this must only be turned on
alongside a real replicaCount > 1. See mfe-pot/TODO.md's "Design
principles" section, principle 4.
*/}}
{{- define "mfe-frontend-lib.pdb" -}}
{{- if .Values.frontend.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app.kubernetes.io/name: {{ .Values.frontend.name }}
    app.kubernetes.io/component: frontend
spec:
  minAvailable: {{ .Values.frontend.podDisruptionBudget.minAvailable | default 1 }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.frontend.name }}
      app.kubernetes.io/component: frontend
{{- end }}
{{- end -}}
