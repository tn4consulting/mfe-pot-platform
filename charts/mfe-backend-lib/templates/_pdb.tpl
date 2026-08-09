{{/*
Opt-in via .Values.backend.podDisruptionBudget.enabled (default false) --
deliberately NOT unconditional like the Deployment's strategy/affinity
blocks: a PodDisruptionBudget with minAvailable >= replicaCount blocks
voluntary evictions (node drains, cluster-autoscaler scale-downs) entirely
rather than helping, so this must only be turned on alongside a real
replicaCount > 1, not left defaulted onto every single-replica chart in
this pass. See mfe-pot/TODO.md's "Design principles" section, principle 4.
*/}}
{{- define "mfe-backend-lib.pdb" -}}
{{- if .Values.backend.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app.kubernetes.io/name: {{ .Values.backend.name }}
    app.kubernetes.io/component: backend
spec:
  minAvailable: {{ .Values.backend.podDisruptionBudget.minAvailable | default 1 }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.backend.name }}
      app.kubernetes.io/component: backend
{{- end }}
{{- end -}}
