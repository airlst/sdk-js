import { Api, PaginationInterface } from '../Api'
import {
  AvailabilityInterface,
  BookableGroupInterface,
  CarBookableInterface,
  OrderInterface,
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

  public async createOrder(
    body: CreateOrderInterface,
  ): Promise<CreateOrderResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/bookables/orders`, {
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  public async listOrders(
    bookingId: string,
  ): Promise<ListOrdersResponseInterface> {
    const queryString = new URLSearchParams({
      booking_id: bookingId,
    }).toString()

    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/orders?${queryString}`,
    )
  }

  public async getOrder(
    orderUuid: string,
  ): Promise<ShowOrderResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/orders/${orderUuid}`,
    )
  }

  public async addOrderLineItem(
    orderUuid: string,
    body: AddOrderLineItemInterface,
  ): Promise<AddOrderLineItemResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/orders/${orderUuid}/line-items`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async deleteOrderLineItem(
    orderUuid: string,
    lineItemUuid: string,
  ): Promise<void> {
    await Api.sendRequest(
      `/events/${this.eventId}/bookables/orders/${orderUuid}/line-items/${lineItemUuid}`,
      {
        method: 'delete',
      },
    )
  }

  public async bulkDeleteOrderLineItems(
    orderUuid: string,
    body: BulkDeleteOrderLineItemsInterface,
  ): Promise<BulkDeleteOrderLineItemsResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/bookables/orders/${orderUuid}/line-items/bulk-delete`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async assignBookables(body: AssignBookablesInterface): Promise<void> {
    await Api.sendRequest(`/events/${this.eventId}/bookables/assignments`, {
      method: 'post',
      body: JSON.stringify(body),
    })
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
  /**
   * Start of the window to list availabilities for. An absolute instant: a value without a zone is
   * read as UTC, not as event-local time.
   */
  start_date: string
  /** End of the window. Same instant semantics as `start_date`. */
  end_date: string
  guest_code?: string
}

interface ListAvailabilitiesResponseInterface {
  data: {
    /**
     * IANA identifier of the event timezone, e.g. `Europe/Berlin`. Every `starts_at` / `ends_at` in
     * `availabilities` — and every slot derived from them — is an absolute UTC instant. This is the
     * timezone the slot grid was generated in, so a client deriving slots from `duration_minutes`
     * needs no second request to convert against (AIRLST-5311).
     */
    timezone: string
    availabilities: Array<AvailabilityInterface>
  }
}

interface CreateReservationInterface {
  guest_code: string
  reservations: Array<{
    bookable_id: string
    /**
     * Required unless the bookable is an add-on with a FIXED availability type, which has no
     * date window — for those the reservation is stored without dates.
     *
     * An absolute instant: UTC (`…Z`) or an explicit offset, which is stored as the same instant. A
     * value carrying no zone is read as UTC, not as event-local wall clock (AIRLST-5311).
     */
    starts_at?: string
    /** Same instant semantics as `starts_at`. */
    ends_at?: string
    quantity?: number
    /**
     * Reservation-scoped extended field values, keyed by field key. Only keys defined on the
     * bookable group for the `bookableReservation` model are accepted.
     */
    extended_fields?: object
  }>
}

interface CreateReservationResponseInterface {
  data: {
    reservation: ReservationInterface
  }
}

interface CreateOrderInterface {
  booking_id: string
}

interface OrderLineItemInterface {
  /** Must belong to a bookable group of this event. */
  addon_id: string
  /**
   * Required unless the add-on has a FIXED availability type, which has no date window. For a
   * slot-based FLEXIBLE add-on this must be the start of one slot — a range spanning several slots
   * is rejected, so send one entry per slot.
   *
   * An **absolute instant**, never event-local wall clock. Send UTC (`2026-06-03T09:00:00Z`) or an
   * explicit offset (`2026-06-03T11:00:00+02:00`), which is stored as the same instant; a value
   * carrying no zone at all is read as UTC. To book a wall-clock time, convert it from the event
   * timezone first — `listAvailabilities()` returns it as `data.timezone`, and it is also on
   * `EventInterface`. Sending `23:00` for a 23:00 event-local slot in a UTC+2 event books a
   * different slot, or none (AIRLST-5311).
   */
  start_at?: string
  /**
   * Required unless the add-on has a FIXED availability type. Must be the end of the same slot.
   * Same instant semantics as `start_at`.
   */
  end_at?: string
  quantity: number
  /**
   * Reservation-scoped extended field values, keyed by field key. Only keys defined on the
   * add-on's bookable group for the `bookableReservation` model are accepted, and each value is
   * validated against its field definition. For NIGHTS add-ons the values are written to every
   * per-night reservation.
   */
  extended_fields?: object
}

/**
 * Allocates one or more add-ons in a single request. Entries are independent, so one call may book
 * several slots of a slot-based FLEXIBLE add-on (e.g. 20 hourly shifts), book non-contiguous slots,
 * mix different add-ons and use a different quantity per entry.
 *
 * The payload is applied all-or-nothing: if any entry is invalid or unavailable, nothing is held and
 * the 422 names the rejected entry ("Line item {index}: …"). At most 50 entries per request.
 */
interface AddOrderLineItemsInterface {
  guest_code: string
  line_items: Array<OrderLineItemInterface>
}

/**
 * @deprecated Single-item body kept for backwards compatibility. Pass `line_items` instead — it
 * accepts the same fields per entry and allocates any number of them in one request.
 */
interface AddOrderLineItemLegacyInterface extends OrderLineItemInterface {
  guest_code: string
}

type AddOrderLineItemInterface =
  | AddOrderLineItemsInterface
  | AddOrderLineItemLegacyInterface

interface CreateOrderResponseInterface {
  data: OrderInterface
}

interface ListOrdersResponseInterface {
  data: Array<OrderInterface>
}

interface ShowOrderResponseInterface {
  data: OrderInterface
}

interface AddOrderLineItemResponseInterface {
  data: {
    /**
     * Every created reservation id, flat and in submission order. An entry contributes more than one
     * id when the add-on fans out (NIGHTS: one reservation per night).
     */
    reservation_ids: Array<string>
    /** The created reservations grouped by the submitted entry they belong to. */
    line_items: Array<{
      /** Position of the entry in the submitted `line_items` array. */
      index: number
      reservation_ids: Array<string>
    }>
  }
}

interface BulkDeleteOrderLineItemsInterface {
  /**
   * The line items to delete, 1–100 unique ids, each belonging to this order. Read them from
   * `getOrder()`, whose `line_items` carry the `id`, `option_from` and `option_to` to pick a range
   * against. Use this instead of one `deleteOrderLineItem()` call per slot to clear a whole time
   * range at once.
   */
  line_item_ids: Array<string>
}

interface BulkDeleteOrderLineItemsResponseInterface {
  data: {
    /**
     * Every deleted line item id. Names more ids than the request when a NIGHTS add-on releases the
     * whole contiguous stay one of the ids belonged to, so this — not the request — is the
     * authoritative list of what was removed.
     */
    deleted_line_item_ids: Array<string>
    /** Number of entries in `deleted_line_item_ids`. */
    deleted_count: number
  }
}

interface AssignBookablesInterface {
  guests: 'all' | Array<string>
  filters?: {
    status?:
      | 'listed'
      | 'invited'
      | 'requested'
      | 'waitlisted'
      | 'confirmed'
      | 'cancelled'
      | 'declined'
      | 'unpaid'
      | 'checkout'
    guest_group_id?: string
  }
  bookable_group_id: string
  selected_bookable_objects: Array<string>
  selected_slots?: Array<{
    bookable_id: string
    start_at: string
    end_at: string
  }>
  start_date?: string
  end_date?: string
}
