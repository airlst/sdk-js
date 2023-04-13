import { Api } from './Api'
import { EventInterface } from './common/interfaces'

export const Event = class {
  public async list(): Promise<ListResponseInterface> {
    return await Api.sendRequest('/companies/events')
  }

  public async get(uuid: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/events/${uuid}`)
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
