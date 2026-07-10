import { Api, PaginationInterface } from '../Api'
import {
  GuestInterface,
  BookingInterface,
  ContactInterface,
  AttachmentInterface,
  GuestsImportInterface,
  GuessImportFieldsResponseInterface,
} from '../interfaces'
import { Event } from './Event'
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

  public static readonly ImportAction = {
    CREATE: 'create',
    UPDATE: 'update',
  } as const

  public static readonly ImportRole = {
    AUTO: 'auto',
    GUEST_MANAGER: 'guest_manager',
  } as const

  public static readonly MarketingOptInSetting = {
    PRESENT: 'present',
    NOT_PRESENT: 'not_present',
    INDIVIDUAL: 'individual',
  } as const

  public static readonly ImportStatus = {
    CREATED: 'created',
    DISPATCHED: 'dispatched',
    DONE: 'done',
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

  public async updateGuests(body: UpdateGuestsBodyInterface): Promise<void> {
    await Api.sendRequest(`/events/${this.eventId}/guests`, {
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

  // Uploads the guest file privately and resolves to the S3 key to pass as the
  // `file` field of guessImportFields / processImport. Fetches a signed storage
  // url, PUTs the raw bytes with the returned headers (keeping the file private,
  // read server-side with credentials), and never builds a public url.
  public async uploadImportFile(
    file: BodyInit,
    fileMimeType: string,
  ): Promise<string> {
    const signed = await new Event().generateTemporaryUploadUrl(
      this.eventId,
      fileMimeType,
      true,
    )

    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(signed.headers)) {
      headers[key] = Array.isArray(value) ? value.join(',') : value
    }

    const response = await fetch(signed.url, {
      method: 'put',
      headers,
      body: file,
    })

    if (!response.ok) {
      throw response
    }

    return signed.key
  }

  public async guessImportFields(
    body: GuessImportFieldsBodyInterface,
  ): Promise<GuessImportFieldsResponseInterface> {
    return await Api.sendRequest<GuessImportFieldsResponseInterface>(
      `/events/${this.eventId}/guests/import/guess-fields`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async processImport(
    body: ProcessGuestImportBodyInterface,
  ): Promise<ProcessImportResponseInterface> {
    return await Api.sendRequest<ProcessImportResponseInterface>(
      `/events/${this.eventId}/guests/import`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async getImport(
    guestsImportUuid: string,
  ): Promise<ShowImportResponseInterface> {
    return await Api.sendRequest<ShowImportResponseInterface>(
      `/events/${this.eventId}/guests/import/${guestsImportUuid}`,
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

export interface UpdateGuestsBodyInterface {
  guests: 'all' | Array<string>
  filters?: {
    status?: string
    guest_group_id?: string
  }
  status?: string
  guest_group_id?: string
  max_companions?: number
  max_recommendations?: number
  marketing_opt_in?: boolean
  guest_managers?: Array<string>
  extended_fields?: object
  booking?: BookingInterface
  contact?: ContactInterface
  send_automated_email?: boolean
}

export interface CheckinBodyInterface {
  type: 'check-in' | 'check-out'
  device?: string
  location?: string
  timestamp: number
}

export interface CreateRecommendationBodyInterface
  extends CreateMainBodyInterface {}

// Envelopes below mirror the spec exactly and are intentionally not normalized:
// guessImportFields and processImport return top-level objects (no `data`
// wrapper) while getImport nests under `data`.
interface ProcessImportResponseInterface {
  guestsImport: GuestsImportInterface
}

interface ShowImportResponseInterface {
  data: {
    guestsImport: GuestsImportInterface
  }
}

export interface GuessImportFieldsBodyInterface {
  file: string
  first_row_as_header: boolean
  role?: 'auto' | 'guest_manager'
}

export interface GuestImportDefaultsInterface {
  'guest:status': string
  'guest:guest_managers'?: Array<string>
  'guest:guest_group_id'?: string
  // Any other importable field key may be supplied as a default.
  [key: string]: unknown
}

export interface ProcessGuestImportBodyInterface {
  file: string
  first_row_as_header: boolean
  mapped_fields: Array<string | null>
  action: 'create' | 'update'
  role?: 'auto' | 'guest_manager'
  defaults: GuestImportDefaultsInterface
  required_fields?: Array<string>
  marketing_opt_in_setting: 'present' | 'not_present' | 'individual'
}
