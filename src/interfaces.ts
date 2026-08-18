export interface EventInterface {
  id: string
  name: object
  extended_fields: object
  locales: Array<LocaleInterface>
  default_locale: LocaleInterface
  additional_locales: Array<LocaleInterface>
  registration_type: string
  /**
   * IANA identifier of the event timezone, e.g. `Europe/Berlin`.
   *
   * Every datetime the API emits and accepts is an absolute UTC instant, never event-local wall
   * clock. This is what to render those instants in, and what to convert a wall-clock time picked
   * by a user *from* before sending it back (AIRLST-5311).
   */
  timezone: string
  /**
   * Whether the event has sub-events (AIRLST-5445). Shorthand for `sub_events_count > 0`.
   */
  is_parent: boolean
  /**
   * Number of sub-events of the event (AIRLST-5445).
   */
  sub_events_count: number
}

export interface SubEventInterface {
  id: string
  name: string
  starts_at: string
  ends_at: string
  registration_mode: 'invitation_only' | 'open'
  /**
   * The moment the sub-event was released for guest-manager booking (AIRLST-5446);
   * null while it is unreleased. Independent of `registration_mode`, the
   * guest-facing invitation-only vs open switch.
   */
  released_at: string | null
  /**
   * Occupying participations only — statuses `invited` and `confirmed` (AIRLST-5445).
   */
  participations_count: number
  quotas: Array<SubEventQuotaInterface>
}

export interface SubEventQuotaInterface {
  id: string
  /**
   * Set on a guest-group row. A row with both `guest_group_id` and
   * `guest_manager_id` null is the default quota: it covers guests whose group
   * has no dedicated quota row and guests without a group.
   */
  guest_group_id: string | null
  /**
   * Locale-keyed guest group name; present only when `guest_group_id` is set.
   */
  guest_group_name?: { [locale: string]: string }
  /**
   * Set on a guest-manager row (AIRLST-5446): it limits the guests assigned to
   * that manager, on top of their group/default row. Because a guest occupies a
   * seat in every applicable row, the sum of `used` across rows can exceed
   * `participations_count`.
   */
  guest_manager_id: string | null
  /**
   * The manager's contact name on guest-manager rows; null elsewhere and for an
   * archived manager.
   */
  guest_manager_name: string | null
  limit: number
  used: number
}

/**
 * One group of the guest's sub-events that overlap in time (AIRLST-5446).
 * A warning only — the API never blocks an assignment because of an overlap.
 */
export interface SubEventOverlapWarningInterface {
  sub_event_ids: Array<string>
}

interface LocaleInterface {
  id: string
  code: string
  label: string
}

export interface GuestGroupInterface {
  id: string
  name: {
    [locale: string]: string
  }
}

export interface SubEventParticipationInterface {
  id: string
  sub_event_id: string
  status: 'invited' | 'confirmed' | 'declined' | 'cancelled' | 'waitlisted'
}

export interface GuestInterface {
  id: string
  code: string
  role: string
  status: string
  extended_fields: object
  guest_group: GuestGroupInterface | null
  booking: BookingInterface
  contact: ContactInterface
  files: Array<AttachmentInterface>
  reservations: Array<ReservationInterface>
  guest_managers: Array<GuestManagerInterface>
  main_guest?: GuestInterface
  companion_guests?: Array<GuestInterface>
  recommended_by?: GuestInterface
  recommended_guests?: Array<GuestInterface>
  /**
   * The guest's sub-event participations with their per-sub-event status (AIRLST-5445).
   * Only on `Guest.get()`, and only while the company's `sub-events` module is active —
   * the key is absent otherwise, and on the nested guest objects of a response.
   */
  sub_event_participations?: Array<SubEventParticipationInterface>
}

export interface GuestManagerInterface
  extends Omit<GuestInterface, 'guest_managers'> {
  managed_guests: Array<GuestInterface>
}

export interface QuotaIncreaseRequestInterface {
  id: string
  guest_group_id: string
  requested_by_guest_manager_id: string
  requested_amount: number
  status: 'requested' | 'approved' | 'rejected'
  created_at: string
  resolved_at: string | null
}

export interface BookingInterface {
  extended_fields: object
}

// Used both as a response shape and as a request body (guest create/update,
// Contact.update), so every field is optional: the API treats them as nullable
// and callers routinely send a partial object.
export interface ContactInterface {
  // Response only. Pass it back as `contact_id` on guest creation to link the
  // new guest to this contact instead of creating a duplicate.
  id?: string
  code?: string
  sex?: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  company_name?: string
  job_title?: string
  address_line_1?: string
  address_line_2?: string
  zip?: string
  city?: string
  country?: string
  extended_fields?: object
}

export interface EmailTemplateInterface {
  id: string
  name: string
  subject: {
    [locale: string]: string
  }
  sender_name: {
    [locale: string]: string
  }
  bcc: string
  reply_to: string
  preview: {
    [locale: string]: string
  }
  html: {
    [locale: string]: string
  }
  json: {
    [locale: string]: string
  }
  booking_status_hook: string
  uses_wallet_ticket: boolean
  uses_pdf_ticket: boolean
  uses_calendar_event: boolean
  sender_identity_id: string
}

export interface AttachmentInterface {
  file_name: string
  uuid: string
  original_url: string
  extension: string
  size: number
  visibility: string
  key: string
}

export interface BookableGroupInterface {
  id: string
  name: string
  type: string
  description: string
  create_reservation_on_checkin: boolean
  max_number_of_reservations: number
}

export interface CarBookableInterface {
  id: string
  name: string
  description: string
  code: string
  make: string
  model: string
  year: number
  color: string
  license_plate: string
  fuel_type: string
  extended_fields: object
  bookable_group: BookableGroupInterface
  reservations: Array<ReservationInterface>
}

export interface ReservationInterface {
  id: string
  starts_at: string
  ends_at: string
  guest: GuestInterface
  bookable: CarBookableInterface
}

export interface OrderInterface {
  id: string
  status: string
  line_items: Array<OrderLineItemInterface>
  reservations: Array<ReservationInterface>
  created_at: string
  updated_at: string
}

export interface OrderLineItemInterface {
  id: string
  addon_id: string
  guest_code: string
  start_at: string | null
  end_at: string | null
  quantity: number
}

export interface PriceInterface {
  net: number
  gross: number
  vat: number
  vat_rate: number
}

export interface AvailabilityInterface {
  /**
   * Absolute UTC instant (`2030-06-03T07:00:00.000000Z`), never event-local wall clock. Render it in
   * the event timezone, which `listAvailabilities()` returns as `data.timezone` (AIRLST-5311).
   */
  starts_at: string
  /** Absolute UTC instant. Same semantics as `starts_at`. */
  ends_at: string
  per_night_total_capacity: Record<string, Record<string, number>> | null
  per_night_remaining_capacity: Record<string, Record<string, number>> | null
  per_night_price: Record<string, Record<string, PriceInterface>> | null
  /** Quantity-based (FIXED) bookables only: price per item, keyed by guest group. */
  per_item_price: Record<string, PriceInterface> | null
  /**
   * Slot-based (FLEXIBLE with a slot length) bookables only: price per slot, keyed by guest group
   * and then by the slot length in minutes. The price does not scale with the slot length.
   */
  per_duration_price: Record<string, Record<string, PriceInterface>> | null
  buffer_time: number
  min: number
  max: number
  /**
   * Slot-based (FLEXIBLE) configuration. Derive the bookable slots from it: convert `starts_at` into
   * the event timezone (`data.timezone` on the same response), step
   * `duration_minutes + buffer_minutes` in that local wall clock until the window closes, then
   * convert each slot boundary back to UTC — which is how the server generates them.
   *
   * Stepping in UTC instead only agrees with the server while the offset is constant: across a DST
   * transition inside the window, consecutive slots are NOT a fixed number of UTC minutes apart and
   * the two grids diverge.
   *
   * Each slot covers `[slot_start, slot_start + duration_minutes)` and seats `capacity_per_slot`
   * units. A window whose closing time is not after its opening time (e.g. 22:00–06:00, or
   * 00:00–00:00 for 24/7) runs past midnight, and every day of the availability repeats the full
   * window. Book each slot as its own `line_items` entry via `addOrderLineItem()`.
   *
   * `duration_minutes` is the mode signal — it is null for every non-slot availability (including
   * legacy free-duration FLEXIBLE, which uses `min` / `max` / `buffer_time` above).
   * `buffer_minutes` and `capacity_per_slot` always carry their column defaults (0 / 1) and say
   * nothing about the mode, so do not detect slot mode from them.
   */
  duration_minutes: number | null
  buffer_minutes: number | null
  capacity_per_slot: number | null
}

export interface ImportableFieldInterface {
  key: string
  label: string
}

export interface GuestsImportInterface {
  id: string
  event_id: string
  user_id: string | null
  rows: number
  status: 'created' | 'dispatched' | 'done'
  batch_id: string | null
  cloud_output_path: string | null
  temporary_cloud_output_url: string | null
  created_at: string
}

// Spec schema: GuessImportFieldsResponse
export interface GuessImportFieldsResponseInterface {
  available_fields: Array<ImportableFieldInterface>
  possible_fields: Array<string | null>
  header: Array<string>
  preview_values: Array<Array<string>>
  number_of_rows: number
}
