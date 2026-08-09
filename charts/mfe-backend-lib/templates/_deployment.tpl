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
  # maxUnavailable: 0 -- the new pod must be Ready before an old one is
  # torn down, so a rolling `helm upgrade` never drops below the current
  # replica count. Safe even at replicas: 1 (the common case today): it
  # just means a deploy briefly runs 2 pods instead of dropping to 0 --
  # see mfe-pot/TODO.md's "Design principles" section, principle 3.
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
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
      # Soft (preferred, not required) anti-affinity -- spreads replicas
      # across nodes when there's more than one to spread across, and is a
      # harmless no-op on a single-node kind cluster (or at replicas: 1)
      # rather than a scheduling failure, so it's safe to include
      # unconditionally rather than gating it per chart.
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app.kubernetes.io/name: {{ .Values.backend.name }}
                    app.kubernetes.io/component: backend
                topologyKey: kubernetes.io/hostname
      containers:
        - name: {{ .Values.backend.name }}
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          imagePullPolicy: {{ .Values.backend.image.pullPolicy | default "IfNotPresent" }}
          ports:
            - containerPort: {{ .Values.backend.containerPort }}
          envFrom:
            - configMapRef:
                name: {{ .Values.backend.name }}-env
          # readinessPath defaults to the same bare /health liveness uses --
          # opt-in per app via .Values.backend.readinessPath (e.g. "/ready")
          # once that app's own BFF actually implements a real readiness
          # check (e.g. verifying Redis connectivity, not just "the process
          # is up") -- see mfe-pot/TODO.md's "Design principles" section,
          # principle 3/4. Not every BFF has one yet; this stays a no-op
          # improvement for those until they do.
          readinessProbe:
            httpGet:
              path: {{ .Values.backend.readinessPath | default "/health" }}
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
