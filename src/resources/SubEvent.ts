import { Api } from '../Api'
import {
  CreateSubEventBodyInterface,
  SubEventInterface,
  SubEventQuotaBodyInterface,
  UpdateSubEventBodyInterface,
} from '../interfaces'

export const SubEvent = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  /**
   * `key` (AIRLST-5842) narrows the list to the live sub-event with that integration key:
   * zero or one sub-event.
   */
  public async list(
    params: { key?: string } = {},
  ): Promise<Array<SubEventInterface>> {
    const query =
      params.key !== undefined
        ? `?${new URLSearchParams({ key: params.key }).toString()}`
        : ''

    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events${query}`,
    )

    return data.sub_events
  }

  public async create(
    body: CreateSubEventBodyInterface,
  ): Promise<SubEventInterface> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )

    return data.sub_event
  }

  public async update(
    subEventId: string,
    body: UpdateSubEventBodyInterface,
  ): Promise<SubEventInterface> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events/${subEventId}`,
      {
        method: 'patch',
        body: JSON.stringify(body),
      },
    )

    return data.sub_event
  }

  /**
   * Replaces the complete quota matrix of one sub-event (AIRLST-5842). An empty array
   * clears it. Resolves to the sub-event with the quota state of every row.
   */
  public async syncQuotas(
    subEventId: string,
    quotas: Array<SubEventQuotaBodyInterface>,
  ): Promise<SubEventInterface> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events/${subEventId}/quotas`,
      {
        method: 'put',
        body: JSON.stringify({ quotas }),
      },
    )

    return data.sub_event
  }
}
