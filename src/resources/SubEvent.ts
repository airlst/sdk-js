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
}
