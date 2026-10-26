import { Api } from '../Api'
import {
  CreateSubEventBodyInterface,
  SendSubEventInvitationsResponseInterface,
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

  /**
   * Sets the image of one sub-event (AIRLST-5842): one JPEG, PNG or WebP file of at most
   * 5 MB. A new upload replaces the old image. Core reads multipart bodies on POST only, so
   * the SDK sends POST. Returns the sub-event in the shape of `list()`, with `image_url` set.
   */
  public async uploadImage(
    subEventId: string,
    image: Blob,
    filename?: string,
  ): Promise<SubEventInterface> {
    const body = new FormData()

    if (filename === undefined) {
      body.append('image', image)
    } else {
      body.append('image', image, filename)
    }

    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events/${subEventId}/image`,
      {
        method: 'POST',
        body,
        // No content-type: fetch sets the multipart type with its boundary itself.
        headers: {
          accept: 'application/json',
          'x-api-key': Api.API_KEY,
          'accept-language': Api.LOCALE,
        },
      },
    )

    return data.sub_event
  }

  /**
   * Removes the image of one sub-event (AIRLST-5842). Removing a missing image is not an
   * error. Returns the sub-event with `image_url` null.
   */
  public async deleteImage(subEventId: string): Promise<SubEventInterface> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events/${subEventId}/image`,
      { method: 'DELETE' },
    )

    return data.sub_event
  }

  /**
   * Ends the planning of one sub-event (AIRLST-5842, plan before invitation). The API sets
   * `invitations_sent_at` and moves every `planned` participation to `invited` on the
   * queue (202). With `sendAutomatedEmail` true (the API default) and the sub-event's
   * `send_status_emails` on, each row sends the email template hooked on `invited`. A
   * second call is safe and reports `planned_count: 0`.
   */
  public async sendInvitations(
    subEventId: string,
    sendAutomatedEmail?: boolean,
  ): Promise<SendSubEventInvitationsResponseInterface> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/sub-events/${subEventId}/send-invitations`,
      {
        method: 'post',
        body: JSON.stringify(
          sendAutomatedEmail !== undefined
            ? { send_automated_email: sendAutomatedEmail }
            : {},
        ),
      },
    )

    return data
  }
}
