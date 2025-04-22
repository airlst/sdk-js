import { Api, PaginationInterface } from '../Api'
import {
  AvailabilityInterface,
  BookableGroupInterface,
  CarBookableInterface,
  ReservationInterface,
} from '../interfaces'

export const Bookable = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public async listGroups(): Promise<ListGroupsResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/bookables/groups`)
  }

  public async listBookables(
    bookableGroupUuid: string,
  ): Promise<ListBookablesResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/groups/${bookableGroupUuid}`,
    )
  }

  public async listAvailabilities(
    bookableGroupUuid: string,
    bookableObjectUuid: string,
    body: ListAvailabilitiesInterface,
  ): Promise<ListAvailabilitiesResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/groups/${bookableGroupUuid}/objects/${bookableObjectUuid}/availability`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async createReservation(
    bookableGroupUuid: string,
    body: CreateReservationInterface,
  ): Promise<CreateReservationResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/groups/${bookableGroupUuid}/reservations`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async deleteReservation(
    guestCode: string,
    reservationUuid: string,
  ): Promise<void> {
    await Api.sendRequest(
      `/events/${this.eventId}/bookables/guests/${guestCode}/reservations/${reservationUuid}`,
      {
        method: 'delete',
      },
    )
  }
}

interface ListGroupsResponseInterface {
  data: {
    bookableGroups: Array<BookableGroupInterface>
  }
  meta?: {
    pagination: PaginationInterface
  }
}

interface ListBookablesResponseInterface {
  data: {
    bookables: Array<CarBookableInterface>
  }
  meta?: {
    pagination: PaginationInterface
  }
}

interface ListAvailabilitiesInterface {
  start_date: string
  end_date: string
}

interface ListAvailabilitiesResponseInterface {
  data: {
    availabilities: Array<AvailabilityInterface>
  }
}

interface CreateReservationInterface {
  guest_code: string
  reservations: Array<{
    starts_at: string
    ends_at: string
    bookable_id: string
  }>
}

interface CreateReservationResponseInterface {
  data: {
    reservation: ReservationInterface
  }
}
