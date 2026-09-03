import { Api } from '../Api'
import { SubEventInterface } from '../interfaces'

export const SubEvent = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public async list(): Promise<Array<SubEventInterface>> {
    const { data } = await Api.sendRequest(`/events/${this.eventId}/sub-events`)

    return data.sub_events
  }
}
