import { Api } from '../Api'
import { GuestGroupInterface } from '../interfaces'

export const GuestGroup = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public async list(): Promise<Array<GuestGroupInterface>> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/guest-groups`,
    )

    return data.guest_groups
  }
}
