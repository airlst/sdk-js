import { Api } from './Api'

interface EventInterface {
  uuid: string
}

export const Events = class extends Api {
  public async list(): Promise<Array<EventInterface>> {
    const { json } = await fetch(`${Api.BASE_URL}/companies/events`, {
      headers: Api.getRequestHeaders(),
    })

    return await json()
  }
}

export const Event = class extends Api {
  public uuid: string

  public setUuid(uuid: string): void {
    this.uuid = uuid
  }

  public async get(): Promise<EventInterface> {
    const { json } = await fetch(`${Api.BASE_URL}/events/${this.uuid}`, {
      headers: Api.getRequestHeaders(),
    })

    return await json()
  }
}
