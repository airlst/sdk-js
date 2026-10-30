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

/**
 * The stable integration key and the descriptive content of a sub-event (AIRLST-5842).
 * All nullable. The texts hold one language; core stores them and does not interpret them.
 */
export interface SubEventContentInterface {
  /**
   * Stable integration key, unique per parent event among live sub-events. Max 64
   * characters: letters, digits, `-` and `_`.
   */
  key: string | null
  /**
   * Free category, for example `summit` or `side_event`. Max 64 characters.
   */
  category: string | null
  /**
   * Short text for lists. Max 500 characters.
   */
  teaser: string | null
  /**
   * Long text, plain text or HTML. Max 10 000 characters.
   */
  description: string | null
  venue: string | null
  contact_name: string | null
  contact_email: string | null
  /**
   * Max 64 characters.
   */
  contact_phone: string | null
  /**
   * BCP 47 language tag, for example `de` or `en-GB`. Max 35 characters.
   */
  language: string | null
  dress_code: string | null
}

export interface SubEventInterface extends SubEventContentInterface {
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
   * The per-SubEvent auto-send switch (AIRLST-5447): whether real participation status
   * transitions send the parent event's hooked per-SubEvent email templates. Off by
   * default.
   */
  send_status_emails: boolean
  /**
   * After this moment a guest can no longer confirm, promote or self-book on the guest
   * endpoints (AIRLST-5842); a decline stays possible. Null means no deadline.
   */
  response_deadline_at: string | null
  /**
   * The moment the `subEventResponseReminderDue` workflow trigger fires once for every
   * guest whose participation is still `invited` (AIRLST-5842). Never after
   * `response_deadline_at`.
   */
  reminder_at: string | null
  /**
   * When the reminder fired; null until then. A new `reminder_at` sets it back to null.
   */
  reminder_sent_at: string | null
  /**
   * The URL of the sub-event image (AIRLST-5842); null without one. Set it with
   * `SubEvent.uploadImage()`.
   */
  image_url: string | null
  /**
   * The overall seat count across all guests, on top of the quota matrix (AIRLST-5842).
   * Once the occupying participations reach it, every further assignment or booking is
   * waitlisted with cause `capacity`. Null: no overall cap.
   */
  capacity: number | null
  /**
   * Occupying participations only — statuses `listed`, `invited` and `confirmed`
   * (AIRLST-5445, `listed` since AIRLST-5842).
   */
  participations_count: number
  /**
   * The status of a new assignment (AIRLST-5842): `listed` (on the list, the guest is not
   * told yet) or `invited`. `SubEvent.sendInvitations()` sets it to `invited`.
   */
  default_assignment_status: SubEventDefaultAssignmentStatus
  /**
   * Null until the first send of the invitations (AIRLST-5842). Until then the guests do
   * not see the sub-event. `SubEvent.sendInvitations()` sets it; a later send keeps it.
   */
  invitations_sent_at: string | null
  quotas: Array<SubEventQuotaInterface>
}

/**
 * One sub-event as the registration form sees it for one guest (AIRLST-5447, R40).
 *
 * Returned by `Guest.listSubEvents()`. `participation` is null while the guest is not
 * assigned. `has_free_seat` is computed for exactly that guest — quota rows are scoped
 * to guest groups and guest managers, so whether a sub-event is "full" depends on the
 * guest. `false` means a confirm or a new assignment for this guest would be waitlisted.
 */
export interface GuestSubEventInterface {
  id: string
  name: string
  starts_at: string
  ends_at: string
  registration_mode: 'invitation_only' | 'open'
  released_at: string | null
  /**
   * After this moment the guest can no longer confirm; a decline stays possible
   * (AIRLST-5842). Null means no deadline.
   */
  response_deadline_at: string | null
  /**
   * The URL of the sub-event image (AIRLST-5842); null without one.
   */
  image_url: string | null
  participation: SubEventParticipationInterface | null
  has_free_seat: boolean
}

/**
 * One reachable sub-event as the acting guest manager sees it (AIRLST-5446/AIRLST-5534).
 *
 * Returned by `GuestManager.listSubEvents()`. A manager reaches a sub-event when BOTH
 * hold: it is released, AND it carries an applicable quota row — a row for this manager,
 * or a row for the manager's own guest group. The DEFAULT row grants nothing, and an
 * EXHAUSTED row still grants access (a full contingent waitlists a booking rather than
 * hiding the sub-event). Unreachable sub-events are absent entirely; read
 * `SubEvent.list()` (the full integrator view) to see every sub-event.
 *
 * Quota ROWS are never exposed on this surface — not the manager's, not the group's, not
 * the default one. The numbers below are all a manager gets.
 */
export interface GuestManagerSubEventContingentInterface
  extends SubEventContentInterface {
  id: string
  name: string
  starts_at: string
  ends_at: string
  registration_mode: 'invitation_only' | 'open'
  /**
   * Never null on this surface: the list returns released sub-events only.
   */
  released_at: string
  /**
   * The status the manager's next assignment gets (AIRLST-5842): `listed` or `invited`.
   */
  default_assignment_status: SubEventDefaultAssignmentStatus
  /**
   * The URL of the sub-event image (AIRLST-5842); null without one.
   */
  image_url: string | null
  /**
   * Occupying participations — statuses `listed`, `invited` and `confirmed` — of THIS
   * manager's guests. Always reported, also when the manager has no quota row.
   */
  booked: number
  /**
   * The limit of the manager's own quota row, or null when the manager has no row:
   * the manager dimension is then unlimited, and the manager reached this sub-event
   * through its guest group instead.
   */
  limit: number | null
  /**
   * `limit - booked`, never below 0. Null whenever `limit` is null.
   */
  remaining: number | null
  /**
   * Guests queued on the manager's own quota row, in FIFO order (AIRLST-5448) — the queue a
   * raised limit would drain. Null exactly when `limit` is null.
   */
  waitlisted: number | null
  /**
   * The limit of the row belonging to the manager's OWN guest group (AIRLST-5534).
   *
   * Null when the manager has no guest group, or when its group owns no row on this
   * sub-event — the manager then books against the default row, whose numbers are not
   * its business.
   */
  guest_group_limit: number | null
  /**
   * Occupying participations counted against that guest-group row. Unlike `booked`, this
   * counts EVERY guest of the group, not only the ones this manager brought. Null exactly
   * when `guest_group_limit` is null.
   */
  guest_group_used: number | null
  /**
   * `guest_group_limit - guest_group_used`, never below 0. Null exactly when
   * `guest_group_limit` is null.
   */
  guest_group_remaining: number | null
  /**
   * Guests queued on the row of the manager's own guest group (AIRLST-5448). Null exactly
   * when `guest_group_limit` is null.
   */
  guest_group_waitlisted: number | null
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
  /**
   * "Mandatory for the whole market" (AIRLST-5842): on a guest-group row, every guest of the
   * group, also guests added later, is assigned automatically as a confirmed mandatory
   * participation. Always false on guest-manager and default rows.
   */
  mandatory: boolean
}

/**
 * One row of a quota matrix write. A row has a `guest_group_id`, a `guest_manager_id`, or
 * neither (the default row), never both, and the matrix holds at most one row per dimension.
 * Guest groups and guest managers must belong to the parent event.
 */
export interface SubEventQuotaBodyInterface {
  guest_group_id?: string | null
  guest_manager_id?: string | null
  /**
   * 0 to 2 147 483 647.
   */
  limit: number
  /**
   * "Mandatory for the whole market" (AIRLST-5842). Only on a guest-group row: on a
   * guest-manager or default row the API responds 422 on `quotas.{index}.mandatory`.
   * Every guest of the group, also guests added later, is assigned on the queue as a
   * confirmed mandatory participation (`listed` while the sub-event is listing). A
   * guest who was cancelled out of the sub-event or declined it is not added back. No
   * email. Defaults to false.
   */
  mandatory?: boolean
}

/**
 * Body of `SubEvent.update()` (AIRLST-5842): a partial update, so every field is optional.
 * `null` clears a content field.
 */
export interface UpdateSubEventBodyInterface
  extends Partial<SubEventContentInterface> {
  name?: string
  /**
   * ISO 8601 with offset. The API stores the UTC instant.
   */
  starts_at?: string
  ends_at?: string
  registration_mode?: 'invitation_only' | 'open'
  /**
   * `true` releases the sub-event for guest-manager booking (the server sets
   * `released_at`), `false` withdraws the release.
   */
  released?: boolean
  send_status_emails?: boolean
  /**
   * ISO 8601 with offset; null clears the deadline. See `SubEventInterface`.
   */
  response_deadline_at?: string | null
  /**
   * ISO 8601 with offset; must not be after `response_deadline_at`. A new value fires the
   * reminder again.
   */
  reminder_at?: string | null
  /**
   * The overall seat count (0 to 2147483647); null removes the cap. See `SubEventInterface`.
   */
  capacity?: number | null
  /**
   * The status of a new assignment (AIRLST-5842). Default `invited` on create. Set it back
   * to `listed` after a send to list the next wave. `invited` responds 422 on update while
   * `invitations_sent_at` is null: send the invitations first.
   */
  default_assignment_status?: SubEventDefaultAssignmentStatus
}

/**
 * Body of `SubEvent.create()` (AIRLST-5842). `quotas` writes the quota matrix in the same
 * transaction as the sub-event.
 */
export interface CreateSubEventBodyInterface
  extends UpdateSubEventBodyInterface {
  name: string
  starts_at: string
  ends_at: string
  quotas?: Array<SubEventQuotaBodyInterface>
}

/**
 * `listed` keeps new assignments on the list until `SubEvent.sendInvitations()`;
 * `invited` invites directly (AIRLST-5842).
 */
export type SubEventDefaultAssignmentStatus = 'listed' | 'invited'

/**
 * Response of `SubEvent.sendInvitations()` (AIRLST-5842). The listed rows move to
 * `invited` on the queue after the response.
 */
export interface SendSubEventInvitationsResponseInterface {
  sub_event_id: string
  /** How many `listed` rows the call moves. 0 when there are none. */
  listed_count: number
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

/**
 * Why a participation is waitlisted (AIRLST-5448, R23), recorded when the row is waitlisted
 * because it is not derivable later. `guest_group`, `guest_manager` and `default`: that quota
 * row refused the seat, and `waitlist_cause_quota_id` names it. `all_or_nothing`: the guest's
 * own quota had room, but another sub-event of the same batch was full
 * (`waitlistAllSubeventsOnLimit`). `manual`: an operator waitlisted the guest explicitly.
 */
export type SubEventWaitlistCause =
  | 'guest_group'
  | 'guest_manager'
  | 'default'
  | 'all_or_nothing'
  | 'manual'
  /** The sub-event's overall `capacity` was full (AIRLST-5842). No quota row. */
  | 'capacity'

export interface SubEventParticipationInterface {
  id: string
  sub_event_id: string
  /**
   * `listed` (AIRLST-5842): assigned while the sub-event lists new assignments. The row
   * takes a seat, but the guest is not told yet; `SubEvent.sendInvitations()` moves it to
   * `invited`.
   */
  status:
    | 'listed'
    | 'invited'
    | 'confirmed'
    | 'declined'
    | 'cancelled'
    | 'waitlisted'
  /**
   * Null on a row that is not waitlisted — and on a row waitlisted before the cause was
   * recorded, which reads as "unknown" (AIRLST-5448).
   */
  waitlist_cause: SubEventWaitlistCause | null
  /**
   * The quota row that refused the seat. Null for the row-less kinds (`all_or_nothing`,
   * `manual`), for an unknown cause, and once that quota row was deleted.
   */
  waitlist_cause_quota_id: string | null
  /**
   * The 1-based position in the FIFO queue of the causing contingent — one queue per quota
   * row, ordered by `created_at` then `id`; the `all_or_nothing` rows of a sub-event queue
   * among themselves. Null when the row has no queue: not waitlisted, `manual`, unknown, or
   * its quota row is gone.
   */
  queue_position: number | null
  /**
   * Set when the guest booked the seat through `bookSubEvent()` (also on a re-booking);
   * null for rows assigned by an integrator, a guest manager or an admin. Read-only.
   */
  booked_by_guest_at: string | null
  /**
   * A mandatory participation (AIRLST-5842): confirmed without an RSVP, never waitlisted,
   * and the guest cannot answer it. It does not change the guest's status on the parent
   * event.
   */
  is_mandatory: boolean
}

/**
 * The integrator's participation write (AIRLST-5842): mainly `status: 'cancelled'`, which
 * keeps the row and frees its seat.
 */
export interface UpdateSubEventParticipationBodyInterface {
  status?: SubEventParticipationInterface['status']
  /** The participation extended fields of the sub-event, merged into the stored values. */
  extended_fields?: Record<string, unknown>
  /** Whether a real transition may send the per-sub-event status email. Defaults to false. */
  send_automated_email?: boolean
}

export interface UpdateSubEventParticipationAsIntegratorResponseInterface {
  data: {
    participation: SubEventParticipationInterface
    /** Empty unless the write promoted a waitlisted row past guests who waited longer. */
    warnings: Array<SubEventPromotionWarningInterface>
    /** The guest's status on the PARENT event, after the silent derivation. */
    guest: { status: BookingStatus }
  }
}

/**
 * A warning of a manual promotion (AIRLST-5448): the promoted guest was not first in the FIFO
 * queue of their contingent. A warning only — the promotion is never blocked by the queue.
 */
export interface SubEventPromotionWarningInterface {
  code: 'queue_skipped'
  /** How many guests of the same contingent had waited longer than the promoted one. */
  guests_waited_longer: number
  /** Translated, ready to display. */
  message: string
}

/**
 * A guest's status on a parent event. The sub-event derivation only ever produces
 * `confirmed`, `invited` or `cancelled` (AIRLST-5447), but a guest can hold any of these.
 */
export type BookingStatus =
  | 'listed'
  | 'invited'
  | 'requested'
  | 'waitlisted'
  | 'confirmed'
  | 'cancelled'
  | 'declined'
  | 'unpaid'
  | 'checkout'

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
   * Only on `Guest.get()`, and on `Guest.list()` with `includeSubEventParticipations: true`
   * (AIRLST-5842), and only while the company's `sub-events` module is active — the key is
   * absent otherwise, and on the nested guest objects of a response.
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
  /**
   * Per-SubEvent status email hook (AIRLST-5447): the sub-event this template answers
   * for, or null. Mutually exclusive with `booking_status_hook` — a template hooks a
   * booking status or a sub-event participation status, never both.
   */
  sub_event_id: string | null
  /**
   * The participation status that triggers this template on a real transition
   * (AIRLST-5447). Set together with `sub_event_id`; the sub-event's own
   * `send_status_emails` switch must also be on for anything to send.
   */
  sub_event_status_hook:
    | 'invited'
    | 'confirmed'
    | 'declined'
    | 'cancelled'
    | 'waitlisted'
    | null
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
