import { Api } from './Api'

interface EventInterface {
  uuid: string
}

export const Event = class extends Api {
  public async list(): Promise<Array<EventInterface>> {
    const { json } = await fetch(`${Api.BASE_URL}/companies/events`, {
      headers: Api.getRequestHeaders(),
    })

    return await json()
  }
}
