import { Api, PaginationInterface } from '../Api'
import {
  GuestManagerInterface,
  AttachmentInterface,
  GuestManagerSubEventContingentInterface,
  SubEventOverlapWarningInterface,
  SubEventParticipationInterface,
} from '../interfaces'
import { QueryBuilder, QueryParameters } from '../utils/QueryBuilder'
import {
  CreateMainBodyInterface,
  UpdateBodyInterface,
  CheckinBodyInterface,
  GetSignerUrlResponseInterface,
  AssignSubEventsResponseInterface,
} from './Guest'

// Guest managers are created through POST /events/{event}/guests with the role
// forced, so contact_id applies — but the API prohibits companions for that
// role, so the inline companions field is subtracted.
export interface CreateGuestManagerBodyInterface
  extends Omit<CreateMainBodyInterface, 'companions'> {}

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
  ): Promise<GuestManagerListResponseInterface> {
    const queryString = QueryBuilder.buildQueryString(parameters)

    return await Api.sendRequest(
      `/events/${this.eventId}/guests/guest-managers?${queryString}`,
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
    body: CreateGuestManagerBodyInterface,
  ): Promise<CreateResponseInterface> {
    return await Api.sendRequest(`/events/${this.eventId}/guests`, {
      method: 'post',
      body: JSON.stringify({ ...body, role: 'guest_manager' }),
    })
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

  /**
   * The contingent view of the guest-manager portal (AIRLST-5446).
   *
   * Returns the RELEASED sub-events of the parent event with this manager's own
   * quota state. Guest managers exist only on the parent event, and a parent-scoped
   * manager acts across the parent and its released sub-events — so the manager is
   * named by `guestManagerId`, and a manager of another event answers 404.
   * Unreleased sub-events are absent; use `SubEvent.list()` for the full
   * integrator view.
   */
  public async listSubEvents(
    guestManagerId: string,
  ): Promise<Array<GuestManagerSubEventContingentInterface>> {
    const { data } = await Api.sendRequest(
      `/events/${this.eventId}/guest-managers/${guestManagerId}/sub-events`,
    )

    return data.sub_events
  }

  /**
   * Books one of this manager's guests onto released sub-events (AIRLST-5446).
   *
   * Same transaction, quota locks, waitlisting and response body as
   * `Guest.assignSubEvents()`, plus the two guest-manager restrictions: the guest
   * must be assigned to `guestManagerId` (403 otherwise), and every sub-event must
   * be released (422 on the offending `sub_event_ids.{index}` key, and the whole
   * batch is refused). An exhausted quota waitlists the participation; it is never
   * a hard rejection.
   */
  public async assignGuestSubEvents(
    guestManagerId: string,
    code: string,
    subEventIds: Array<string>,
    extendedFields?: { [subEventId: string]: { [fieldKey: string]: unknown } },
  ): Promise<AssignSubEventsResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guest-managers/${guestManagerId}/guests/${code}/sub-events`,
      {
        method: 'post',
        body: JSON.stringify({
          sub_event_ids: subEventIds,
          ...(extendedFields !== undefined && {
            extended_fields: extendedFields,
          }),
        }),
      },
    )
  }

  /**
   * Books MANY of this manager's guests onto the same released sub-events (AIRLST-5446).
   *
   * The bulk sibling of `assignGuestSubEvents()`, bounded at 200 guests per call so it
   * can answer synchronously with a per-guest result. Isolation is per guest: each one
   * is assigned in its own transaction, so a guest that fails carries its own `error`
   * while the rest of the call still books. A guest that already participates in a
   * requested sub-event is skipped rather than rejected, which is what makes a
   * pre-assignment safe to run twice. Every entry carries the same
   * `participations` / `overlap_warnings` pair as the single-guest method, so one
   * parser serves both. Results come back in the order the codes were posted.
   *
   * Bulk assignment exists on the guest-manager surface only — an integrator key uses
   * `Guest.assignSubEvents()` one guest at a time, because a bulk route outside this
   * surface would skip the manager-ownership and released-sub-event rules.
   */
  public async assignGuestsSubEvents(
    guestManagerId: string,
    codes: Array<string>,
    subEventIds: Array<string>,
    extendedFields?: { [subEventId: string]: { [fieldKey: string]: unknown } },
  ): Promise<BulkAssignSubEventsResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guest-managers/${guestManagerId}/sub-events/assignments`,
      {
        method: 'post',
        body: JSON.stringify({
          guests: codes,
          sub_event_ids: subEventIds,
          ...(extendedFields !== undefined && {
            extended_fields: extendedFields,
          }),
        }),
      },
    )
  }

  /**
   * Promotes a waitlisted participation once a seat frees up (AIRLST-5446).
   *
   * Manual promotion is the guest manager's step in M2. The participation must be
   * `waitlisted`, its sub-event released, and its guest assigned to
   * `guestManagerId`. Every applicable quota row is re-checked under locks, so the
   * promotion is refused with 422 while no seat is actually free.
   */
  public async promoteSubEventParticipation(
    guestManagerId: string,
    participationId: string,
    status: 'invited' | 'confirmed',
  ): Promise<PromoteSubEventParticipationResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/guest-managers/${guestManagerId}/participations/${participationId}/promote`,
      {
        method: 'post',
        body: JSON.stringify({ status }),
      },
    )
  }
}

interface GuestManagerListResponseInterface {
  data: {
    guest_managers: Array<GuestManagerInterface>
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

interface UpdateResponseInterface {
  data: {
    guest: GuestManagerInterface
  }
}

/**
 * One guest's outcome in a bulk assignment. `error` is null when the guest was booked;
 * an empty `participations` array with a null `error` means the guest already
 * participated in every requested sub-event.
 */
export interface BulkAssignSubEventsResultInterface {
  guest_code: string
  participations: Array<SubEventParticipationInterface>
  overlap_warnings: Array<SubEventOverlapWarningInterface>
  error: string | null
}

export interface BulkAssignSubEventsResponseInterface {
  data: {
    results: Array<BulkAssignSubEventsResultInterface>
  }
}

interface PromoteSubEventParticipationResponseInterface {
  data: {
    participation: SubEventParticipationInterface
  }
}
