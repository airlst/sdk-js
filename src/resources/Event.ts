import { Api } from '../Api'
import { AttachmentInterface, EventInterface } from '../interfaces'

export const Event = class {
  public async list(): Promise<ListResponseInterface> {
    return await Api.sendRequest('/companies/events')
  }

  public async get(uuid: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/events/${uuid}`)
  }

  public mapVisibility(isPrivate: boolean): string {
    return isPrivate ? 'private' : 'public-read'
  }

  public async generateTemporaryUploadUrl(
    eventUuid: string,
    fileMimeType: string,
    isPrivate: boolean = true,
  ): Promise<TemporaryUrlResponseInterface> {
    const { data } = await Api.sendRequest(
      `/events/${eventUuid}/signed-storage-url`,
      {
        method: 'put',
        body: JSON.stringify({
          visibility: this.mapVisibility(isPrivate),
          content_type: fileMimeType,
        }),
      },
    )
    return data
  }

  public async saveTemporaryUpload(
    eventUuid: string,
    temporaryUrlData: TemporaryUrlResponseInterface,
    fileName: string,
    fileSize: number,
    fileMimeType: string,
    isPrivate: boolean = true,
  ): Promise<TemporaryUploadResponseInterface> {
    return await Api.sendRequest(
      `/events/${eventUuid}/create-temporary-upload`,
      {
        method: 'post',
        body: JSON.stringify({
          uuid: temporaryUrlData.uuid,
          key: temporaryUrlData.key,
          bucket: temporaryUrlData.bucket,
          name: fileName,
          size: fileSize,
          content_type: fileMimeType,
          custom_properties: { visibility: this.mapVisibility(isPrivate) },
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

interface TemporaryUrlResponseInterface {
  url: string,
  uuid: string,
  bucket: string,
  key: string,
}

