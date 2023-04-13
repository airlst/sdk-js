import { Api } from './Api'
import { GuestInterface } from './common/interfaces'

export const Guest = class {
  public eventUuid: string

  constructor(eventUuid: string) {
    this.eventUuid = eventUuid
  }

  public async validateCode(
    code: string
  ): Promise<ValidateCodeResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventUuid}/guests/validate-code`,
      {
        method: 'post',
        body: JSON.stringify({ code }),
      }
    )
  }

  public async get(code: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventUuid}/guests/${code}`)
  }

  public async update(
    code: string,
    body: object
  ): Promise<UpdateResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventUuid}/guests/${code}`, {
      method: 'put',
      body: JSON.stringify(body),
    })
  }
}

interface ValidateCodeResponseInterface {
  data: {
    valid: boolean
  }
}

interface GetResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface UpdateResponseInterface {
  data: {
    guest: GuestInterface
  }
}
