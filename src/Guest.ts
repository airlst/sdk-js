import { Api } from './Api'

interface GuestInterface {
  code: string
}

export const Guest = class extends Api {
  public code: string

  public setCode(code: string): void {
    this.code = code
  }

  public async validateCode(code: string): Promise<GuestInterface> {
    const { json } = await fetch(`${Api.BASE_URL}/events/${this.code}/guests/validate-code`, {
      headers: Api.getRequestHeaders(),
      method: 'post',
      body: JSON.stringify({ code }),
    })

    return await json()
  }
}
