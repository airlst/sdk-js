import { Api } from '../Api'
import {
  GuestGroupInterface,
  QuotaIncreaseRequestInterface,
} from '../interfaces'

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

  public async listQuotaIncreaseRequests(
    parameters: QuotaIncreaseRequestListParameters = {},
  ): Promise<ListQuotaIncreaseRequestsResponseInterface> {
    const query = new URLSearchParams()

    if (parameters.guest_group_id) {
      query.set('guest_group_id', parameters.guest_group_id)
    }
    if (parameters.guest_manager_id) {
      query.set('guest_manager_id', parameters.guest_manager_id)
    }
    if (parameters.status) {
      query.set('status', parameters.status)
    }

    const queryString = query.toString()

    return await Api.sendRequest(
      `/events/${this.eventId}/guest-groups/quota-increase-requests${
        queryString ? `?${queryString}` : ''
      }`,
    )
  }

  public async createQuotaIncreaseRequest(
    body: CreateQuotaIncreaseRequestBodyInterface,
  ): Promise<CreateQuotaIncreaseRequestResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guest-groups/quota-increase-requests`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }
}

export interface QuotaIncreaseRequestListParameters {
  guest_group_id?: string
  guest_manager_id?: string
  status?: 'requested' | 'approved' | 'rejected'
}

export interface CreateQuotaIncreaseRequestBodyInterface {
  guest_manager_id: string
  amount: number
}

interface ListQuotaIncreaseRequestsResponseInterface {
  data: {
    quota_increase_requests: Array<QuotaIncreaseRequestInterface>
  }
}

interface CreateQuotaIncreaseRequestResponseInterface {
  data: {
    quota_increase_request: QuotaIncreaseRequestInterface
  }
}
