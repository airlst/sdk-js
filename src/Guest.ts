import { Api } from './Api'
import { GuestInterface } from './common/interfaces'

export const Guest = class extends Api {
  public eventUuid: string

  constructor(eventUuid: string) {
    super()

    this.eventUuid = eventUuid
  }

  public async validateCode(
    code: string
  ): Promise<ValidateCodeResponseInterface> {
    const response = await fetch(
      `${Api.BASE_URL}/events/${this.eventUuid}/guests/validate-code`,
      {
        headers: Api.getRequestHeaders(),
        method: 'post',
        body: JSON.stringify({ code }),
      }
    )

    if (!response.ok) {
      throw response
    }

    return await response.json()
  }

  public async get(code: string): Promise<GetResponseInterface> {
    const response = await fetch(
      `${Api.BASE_URL}/events/${this.eventUuid}/guests/${code}`,
      {
        headers: Api.getRequestHeaders(),
      }
    )

    if (!response.ok) {
      throw response
    }

    return await response.json()
  }

  public async update(
    code: string,
    body: Object
  ): Promise<UpdateResponseInterface> {
    const response = await fetch(
      `${Api.BASE_URL}/events/${this.eventUuid}/guests/${code}`,
      {
        headers: Api.getRequestHeaders(),
        method: 'put',
        body: JSON.stringify({ body }),
      }
    )

    if (!response.ok) {
      throw response
    }

    return await response.json()
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
