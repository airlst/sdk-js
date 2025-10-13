import { Api, PaginationInterface } from '../Api'
import {
  GuestInterface,
  BookingInterface,
  ContactInterface,
  AttachmentInterface,
} from '../interfaces'
import { QueryBuilder, QueryParameters } from '../utils/QueryBuilder'

interface GuestListQueryParameters extends QueryParameters {
  guest_manager_id?: string
}

export const Guest = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public static readonly CheckinType = {
    CHECK_IN: 'check-in',
    CHECK_OUT: 'check-out',
  } as const

  public async list(
    parameters: GuestListQueryParameters,
  ): Promise<ListResponseInterface> {
    const baseQuery = QueryBuilder.buildQuery(parameters)

    if (parameters.guest_manager_id) {
      baseQuery['guest_manager_id'] = parameters.guest_manager_id
    }

    const queryString = new URLSearchParams(baseQuery).toString()

    return await Api.sendRequest(
      `/events/${this.eventId}/guests?${queryString}`,
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
    guests: Array<GuestInterface>
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
    guest: GuestInterface
  }
}

interface GetAttachmentsResponseInterface {
  data: {
    attachments: Array<AttachmentInterface>
  }
}

export interface GetSignerUrlResponseInterface {
  data: {
    url: string
  }
}

interface CheckinResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface RestoreResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface CreateResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface CreateRecommendationResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface UpdateResponseInterface {
  data: {
    guest: GuestInterface
  }
}

export interface CreateMainBodyInterface extends CreateCompanionBodyInterface {
  status: string
}

export interface CreateCompanionBodyInterface {
  code: string
  role: string
  extended_fields: object
  contact: ContactInterface
  booking: BookingInterface
}

export interface UpdateBodyInterface {
  status: string
}

export interface CheckinBodyInterface {
  type: 'check-in' | 'check-out'
  device?: string
  location?: string
  timestamp: number
}

export interface CreateRecommendationBodyInterface
  extends CreateMainBodyInterface {}
