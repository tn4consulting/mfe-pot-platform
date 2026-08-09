export interface AuthorizePageParams {
  redirectUri: string;
  state: string;
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  error?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Stands in for IBM Verify SaaS's own hosted login screen -- not
 * citizen-facing product UI, so it doesn't pull in the real
 * @tn4consulting/shared-ui-scds-core custom elements (that would mean
 * self-hosting a Stencil loader + Docker/asset wiring for a page nobody
 * demos as "the product"). It still visually matches the family: the
 * :root block below is copied from ui-scds-core's tokens.css so the same
 * colors/type/spacing show up here as everywhere else, just applied to
 * hand-written markup instead of real <scds-*> elements.
 */
export function renderAuthorizePage(params: AuthorizePageParams): string {
  const { redirectUri, state, clientId, codeChallenge, codeChallengeMethod, error } = params;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mock-idp sign-in</title>
  <style>
    :root {
      --scds-color-brand-50: #eaf1fb;
      --scds-color-brand-300: #6fa3d6;
      --scds-color-brand-500: #2b6cb0;
      --scds-color-brand-600: #1b4e8f;
      --scds-color-brand-700: #143c70;
      --scds-color-navy-900: #26374a;
      --scds-color-white: #ffffff;
      --scds-color-gray-50: #f7f8f9;
      --scds-color-gray-200: #dde1e5;
      --scds-color-gray-300: #c3c9d0;
      --scds-color-gray-500: #6b7280;
      --scds-color-gray-900: #1c2024;
      --scds-color-text: var(--scds-color-gray-900);
      --scds-color-text-muted: var(--scds-color-gray-500);
      --scds-color-text-inverse: var(--scds-color-white);
      --scds-color-status-danger-text: #842029;
      --scds-font-family: 'Noto Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --scds-font-size-sm: 0.875rem;
      --scds-font-size-base: 1rem;
      --scds-font-size-h2: 1.5rem;
      --scds-line-height-base: 1.5;
      --scds-font-weight-normal: 400;
      --scds-font-weight-bold: 700;
      --scds-space-1: 0.25rem;
      --scds-space-2: 0.5rem;
      --scds-space-3: 0.75rem;
      --scds-space-4: 1rem;
      --scds-space-5: 1.5rem;
      --scds-space-6: 2rem;
      --scds-radius-sm: 0.25rem;
      --scds-radius-md: 0.5rem;
      --scds-border-color: var(--scds-color-gray-200);
      --scds-shadow-sm: 0 1px 2px rgba(28, 32, 36, 0.08);
      --scds-header-height: 3.75rem;
      --scds-focus-ring: 0 0 0 3px var(--scds-color-brand-300);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: var(--scds-font-family);
      font-size: var(--scds-font-size-base);
      line-height: var(--scds-line-height-base);
      color: var(--scds-color-text);
      background: var(--scds-color-gray-50);
    }

    .topbar {
      display: flex;
      align-items: center;
      gap: var(--scds-space-3);
      height: var(--scds-header-height);
      padding-inline: var(--scds-space-4);
      background: var(--scds-color-white);
      border-bottom: 1px solid var(--scds-border-color);
      box-shadow: var(--scds-shadow-sm);
    }

    .topbar__mark {
      display: inline-block;
      width: 1.75rem;
      height: 1.75rem;
      flex-shrink: 0;
      border-radius: var(--scds-radius-sm);
      background: linear-gradient(135deg, var(--scds-color-brand-500), var(--scds-color-navy-900));
    }

    .topbar__title {
      font-weight: var(--scds-font-weight-bold);
      font-size: var(--scds-font-size-h2);
    }

    main {
      display: flex;
      justify-content: center;
      padding: var(--scds-space-6) var(--scds-space-4);
    }

    .card {
      width: 100%;
      max-width: 26rem;
      background: var(--scds-color-white);
      border: 1px solid var(--scds-border-color);
      border-radius: var(--scds-radius-md);
      box-shadow: var(--scds-shadow-sm);
      padding: var(--scds-space-6) var(--scds-space-5);
    }

    .card h1 {
      margin: 0 0 var(--scds-space-2);
      font-size: var(--scds-font-size-h2);
    }

    .intro {
      margin: 0 0 var(--scds-space-5);
      color: var(--scds-color-text-muted);
      font-size: var(--scds-font-size-sm);
    }

    .notice {
      margin: 0 0 var(--scds-space-4);
      border-left: 4px solid var(--scds-color-status-danger-text);
      background: var(--scds-color-white);
      border-radius: var(--scds-radius-sm);
      box-shadow: var(--scds-shadow-sm);
      padding: var(--scds-space-3) var(--scds-space-4);
      font-size: var(--scds-font-size-sm);
      color: var(--scds-color-text);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--scds-space-4);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--scds-space-1);
    }

    .field label {
      font-weight: var(--scds-font-weight-bold);
      font-size: var(--scds-font-size-sm);
    }

    .field .hint {
      margin: 0;
      font-size: var(--scds-font-size-sm);
      color: var(--scds-color-text-muted);
    }

    .field input {
      font-family: inherit;
      font-size: var(--scds-font-size-base);
      color: var(--scds-color-text);
      padding: var(--scds-space-2) var(--scds-space-3);
      border: 1px solid var(--scds-color-gray-300);
      border-radius: var(--scds-radius-sm);
      width: 100%;
    }

    .field input:focus-visible {
      outline: none;
      box-shadow: var(--scds-focus-ring);
      border-color: var(--scds-color-brand-500);
    }

    button[type='submit'] {
      margin-top: var(--scds-space-2);
      font-family: inherit;
      font-weight: var(--scds-font-weight-bold);
      font-size: var(--scds-font-size-base);
      padding: var(--scds-space-2) var(--scds-space-5);
      border: 2px solid transparent;
      border-radius: var(--scds-radius-sm);
      background: var(--scds-color-brand-600);
      color: var(--scds-color-text-inverse);
      cursor: pointer;
    }

    button[type='submit']:hover {
      background: var(--scds-color-brand-700);
    }

    button[type='submit']:focus-visible {
      outline: none;
      box-shadow: var(--scds-focus-ring);
    }

    .disclaimer {
      margin: var(--scds-space-5) 0 0;
      font-size: var(--scds-font-size-sm);
      color: var(--scds-color-text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <span class="topbar__mark" aria-hidden="true"></span>
    <span class="topbar__title">mock-idp</span>
  </div>
  <main>
    <div class="card">
      <h1>Sign in</h1>
      <p class="intro">Stands in for IBM Verify SaaS's hosted login page &mdash; proof-of-technology only, no real credentials.</p>
      ${error ? `<p class="notice" role="alert">${escapeHtml(error)}</p>` : ''}
      <form method="post" action="/authorize">
        <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
        <input type="hidden" name="state" value="${escapeHtml(state)}" />
        <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
        <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}" />
        <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}" />
        <div class="field">
          <label for="sin">Social Insurance Number</label>
          <p class="hint" id="sin-hint">Optional &mdash; leave blank for the demo default.</p>
          <input type="text" id="sin" name="sin" placeholder="123-456-789" aria-describedby="sin-hint" />
        </div>
        <div class="field">
          <label for="name">Display name</label>
          <p class="hint" id="name-hint">Optional.</p>
          <input type="text" id="name" name="name" placeholder="Jordan Tremblay" aria-describedby="name-hint" />
        </div>
        <button type="submit">Sign in</button>
      </form>
      <p class="disclaimer">This is a proof-of-technology environment. No government service is connected.</p>
    </div>
  </main>
</body>
</html>`;
}
