import { Api } from '../Api'

export const SecureLogin = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  // Issues + emails a one-time login code for the guest resolved from `code`.
  // The destination address is resolved server-side; nothing sensitive is
  // returned. `nonce` (optional) binds the code to the caller's session for
  // cross-session replay protection.
  public async issue(
    code: string,
    nonce?: string,
  ): Promise<IssueLoginCodeResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/secure-login/issue`, {
      method: 'post',
      body: JSON.stringify({ code, nonce }),
    })
  }

  // Verifies an emitted code. Enforces attempt cap, expiry and single-use
  // server-side; must pass the same `nonce` given to `issue` when one was used.
  public async verify(
    code: string,
    otp: string,
    nonce?: string,
  ): Promise<VerifyLoginCodeResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/secure-login/verify`,
      {
        method: 'post',
        body: JSON.stringify({ code, otp, nonce }),
      },
    )
  }
}

// Both endpoints return a top-level object (no `data` envelope), mirroring the
// Suite's secure-login contract.
export interface IssueLoginCodeResponseInterface {
  sent: boolean
  reason?: 'cooldown'
}

export interface VerifyLoginCodeResponseInterface {
  ok: boolean
  reason?: 'expired' | 'too_many_attempts' | 'invalid'
}
