import { Api } from '../Api'
import { AttachmentInterface, EventInterface } from '../interfaces'

export const Event = class {
  public async list(): Promise<ListResponseInterface> {
    return await Api.sendRequest('/companies/events')
  }

  public async get(uuid: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/events/${uuid}`)
  }

  public async saveTemporaryUpload(
    eventUuid: string,
    file: File,
    isPrivate: boolean = true,
  ): Promise<TemporaryUploadResponseInterface> {
    let visibility = isPrivate ? 'private' : 'public-read'
    const { data } = await Api.sendRequest(
      `/events/${eventUuid}/signed-storage-url`,
      {
        method: 'put',
        body: JSON.stringify({
          visibility: visibility,
          content_type: file.type,
        }),
      },
    )
    const response = await fetch(data.url, {
      method: 'put',
      body: file,
    })
    if (!response.ok) {
      throw new Error('Error during file upload')
    }
    return await Api.sendRequest(
      `/events/${eventUuid}/create-temporary-upload`,
      {
        method: 'post',
        body: JSON.stringify({
          uuid: data.uuid,
          key: data.key,
          bucket: data.bucket,
          name: file.name,
          size: file.size,
          content_type: file.type,
          custom_properties: {visibility: visibility},
        }),
      },
    )
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

interface TemporaryUploadResponseInterface {
  data: {
    temporary_upload: AttachmentInterface
  }
}
