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
 * citizen-facing product UI, so no GCDS/styling investment. A demo user
 * types the SIN they want to "authenticate" as; mock-idp's own local
 * tenant directory (see tenants.ts) maps it to an identity, the same way a
 * real IBM Verify tenant would map a login to its own directory attributes
 * (including, via custom claim mapping, a SIN).
 */
export function renderAuthorizePage(params: AuthorizePageParams): string {
  const { redirectUri, state, clientId, codeChallenge, codeChallengeMethod, error } = params;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>mock-idp sign-in</title>
</head>
<body>
  <h1>Mock IdP sign-in</h1>
  <p>Stands in for IBM Verify SaaS's hosted login page -- proof-of-technology only, no real credentials.</p>
  ${error ? `<p role="alert">${escapeHtml(error)}</p>` : ''}
  <form method="post" action="/authorize">
    <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
    <input type="hidden" name="state" value="${escapeHtml(state)}" />
    <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
    <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}" />
    <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}" />
    <label for="sin">Social Insurance Number</label>
    <input type="text" id="sin" name="sin" placeholder="123-456-789" required />
    <label for="name">Display name (optional)</label>
    <input type="text" id="name" name="name" placeholder="Jordan Tremblay" />
    <button type="submit">Sign in</button>
  </form>
</body>
</html>`;
}
