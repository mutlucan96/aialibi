import { HttpsError } from 'firebase-functions/v2/https'

/**
 * Asserts that the incoming callable request is from a verified Google-authenticated user.
 * @param {import('firebase-functions/v2/https').CallableRequest} request - The callable function request object.
 * @throws {HttpsError} Throws if the user is unauthenticated or not signed in via Google.
 */
export function assertGoogleAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.')
  }
  const provider = request.auth.token.firebase?.sign_in_provider
  if (provider !== 'google.com') {
    throw new HttpsError(
      'permission-denied',
      'Forbidden: Only Google-authenticated moderators are permitted to execute this action.',
    )
  }
}
