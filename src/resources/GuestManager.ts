import { Api } from '../Api'
import {
  CreateMainBodyInterface,
  CreateCompanionBodyInterface,
  UpdateBodyInterface,
  CheckinBodyInterface,
  CreateRecommendationBodyInterface
} from './Guest'
import { QueryBuilder, QueryParameters } from '../utils/QueryBuilder'
import { GuestManagerInterface, AttachmentInterface } from '../interfaces'
import { PaginationInterface } from '../Api'

export const GuestManager = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public static readonly CheckinType = {
    CHECK_IN: 'check-in',
    CHECK_OUT: 'check-out',
  } as const

  public async list(
    parameters: QueryParameters,
  ): Promise<ListResponseInterface> {
    const queryString = QueryBuilder.buildQueryString(parameters)

    return await Api.sendRequest(
      `/events/${this.eventId}/guest_managers?${queryString}`,
    )
  }

  public async validateCode(
    code: string,
  ): Promise<ValidateCodeResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/validate-code`,
      {
        method: 'post',
        body: JSON.stringify({ code }),
      },
    )
  }

  public async get(code: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/guests/${code}`)
  }

  public async getAttachments(
    code: string,
  ): Promise<GetAttachmentsResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/${code}/attachments`,
    )
  }

  public async getAttachmentSignedUrl(
    code: string,
    uuid: string,
  ): Promise<GetSignerUrlResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/${code}/attachments/${uuid}/url`,
    )
  }

  public async create(
    body: CreateMainBodyInterface,
  ): Promise<CreateResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/guests`, {
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  public async createCompanion(
    code: string,
    body: CreateCompanionBodyInterface,
  ): Promise<CreateResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/${code}/companions`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async update(
    code: string,
    body: UpdateBodyInterface,
  ): Promise<UpdateResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/guests/${code}`, {
      method: 'put',
      body: JSON.stringify(body),
    })
  }

  public async archive(code: string): Promise<void> {
    await Api.sendRequest(`/events/${this.eventId}/guests/${code}/archive`, {
      method: 'put',
    })
  }

  public async restore(code: string): Promise<RestoreResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/${code}/restore`,
      {
        method: 'put',
      },
    )
  }

  public async delete(code: string): Promise<void> {
    await Api.sendRequest(`/events/${this.eventId}/guests/${code}`, {
      method: 'delete',
    })
  }

  public async checkin(
    code: string,
    body: CheckinBodyInterface,
  ): Promise<CheckinResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/${code}/checkins`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async createRecommendation(
    code: string,
    body: CreateRecommendationBodyInterface,
  ): Promise<CreateRecommendationResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guests/${code}/recommendations`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }
}

interface ListResponseInterface {
  data: {
    guests: Array<GuestManagerInterface>
  }
  meta?: {
    pagination: PaginationInterface
  }
}

interface ValidateCodeResponseInterface {
  data: {
    valid: boolean
  }
}

interface GetResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}

interface GetAttachmentsResponseInterface {
  data: {
    attachments: Array<AttachmentInterface>
  }
}

interface GetSignerUrlResponseInterface {
  data: {
    url: string
  }
}

interface CheckinResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}

interface RestoreResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}

interface CreateResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}

interface CreateRecommendationResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}

interface UpdateResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}
