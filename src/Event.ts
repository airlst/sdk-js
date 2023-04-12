import { Api } from './Api'
import { EventInterface } from './common/interfaces'

export const Event = class extends Api {
  public async list(): Promise<ListResponseInterface> {
    const response = await fetch(`${Api.BASE_URL}/companies/events`, {
      headers: Api.getRequestHeaders(),
    })

    if (!response.ok) {
      throw response
    }

    return await response.json()
  }

  public async get(uuid: string): Promise<GetResponseInterface> {
    const response = await fetch(`${Api.BASE_URL}/events/${uuid}`, {
      headers: Api.getRequestHeaders(),
    })

    if (!response.ok) {
      throw response
    }

    return await response.json()
  }
}

interface ListResponseInterface {
  data: {
    events: Array<EventInterface>
  }
}

interface GetResponseInterface {
  data: {
    event: EventInterface
  }
}
