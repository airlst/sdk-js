import { Api, PaginationInterface } from '../Api'
import {
  GuestInterface,
  BookingInterface,
  ContactInterface,
} from '../interfaces'

export const Guest = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public async list(
    parameters: ListParametersInterface,
  ): Promise<ListResponseInterface> {
    const filters = parameters.filters.reduce(
      (carry, { field, operator, value }) => {
        carry[`filters(${field}*${operator || 'eq'})`] = value

        return carry
      },
      {},
    )

    const sorts = parameters.sorts.reduce(
      (carry, { field, order, direction }) => {
        carry[`sorts(${field}*${order || '0'})`] = direction

        return carry
      },
      {},
    )

    const query = new URLSearchParams({
      search: parameters.search,
      page: parameters.page || '1',
      ...filters,
      ...sorts,
    }).toString()

    return await Api.sendRequest(`/events/${this.eventId}/guests?${query}`)
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

interface CreateResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface ListParametersInterface {
  search: string
  page: string
  filters: Array<{
    field: string
    operator: string
    value: string
  }>
  sorts: Array<{
    field: string
    order?: string
    direction: string
  }>
}

interface CreateMainBodyInterface extends CreateCompanionBodyInterface {
  status: string
}

interface CreateCompanionBodyInterface {
  code: string
  role: string
  extended_fields: object
  contact: ContactInterface
  booking: BookingInterface
}

interface UpdateResponseInterface {
  data: {
    guest: GuestInterface
  }
}

interface UpdateBodyInterface {
  status: string
}
