# WIP

## Installation

```bash
yarn add @airlst/sdk
```

## Usage

Set API key

```javascript
import { Api } from '@airlst/sdk'

Api.setApiKey('YOUR_API_KEY')
```

## Methods

Currently available methods:

### Event methods

#### Get all company events

> **Important:** This method requires that API key must be company bound!

```javascript
import { Event } from '@airlst/sdk'

const { data } = await new Event().list()
```

#### Get single event with UUID

```javascript
import { Event } from '@airlst/sdk'

const { data } = await new Event().get('event-uuid')
```

Every event object also reports its sub-event state (AIRLST-5445): `is_parent` (boolean) and
`sub_events_count` (integer).

#### List sub-events of an event

```javascript
import { SubEvent } from '@airlst/sdk'

const subEvents = await new SubEvent('event-uuid').list()
```

Each sub-event carries its quota state: `participations_count` counts occupying participations
(statuses `invited` and `confirmed`), and each entry in `quotas` reports `limit` and `used`. A
quota row comes in one of three shapes (AIRLST-5446): a guest-group row (`guest_group_id` set),
a guest-manager row (`guest_manager_id` set — it limits the guests assigned to that manager, on
top of their group/default row), or the default quota (both null) — it covers guests whose group
has no dedicated quota row and guests without a group. A quota tied to a guest group also
carries `guest_group_name` as a locale-keyed object (`{ 'en-GB': 'VIP' }`); a guest-manager row
carries `guest_manager_name` as a plain string. Because a guest occupies a seat in every
applicable row, the sum of `used` across rows can exceed `participations_count`.

Each sub-event also reports `released_at` (AIRLST-5446): the moment it was released for
guest-manager booking, or `null` while it is unreleased. It is independent of
`registration_mode`, the guest-facing invitation-only vs open switch. `send_status_emails`
(AIRLST-5447) is the per-SubEvent auto-send switch: while it is `false` (the default), real
participation status transitions send no per-SubEvent email templates. To assign guests, use
`Guest.assignSubEvents()` (see the Guest methods).

`response_deadline_at` (AIRLST-5842) is the moment after which a guest can no longer confirm,
promote or self-book; a decline stays possible, and `null` means no deadline. `reminder_at` is
the moment the `subEventResponseReminderDue` workflow trigger fires once for every guest whose
participation is still `invited`; `reminder_sent_at` records when it fired. Customers configure
the reminder email as a workflow. Every real participation status change also fires the
`subEventParticipationStatusChanged` workflow trigger, so a workflow with an HTTP request action
works as a webhook.

`SubEvent.list()` is the **full integrator view**: it returns released and unreleased
sub-events alike, and `released_at` is what tells them apart. A guest-manager-facing consumer
must not read it — use `GuestManager.listSubEvents()` instead, which returns only the sub-events
the acting manager can reach (released AND covered by a quota row for the manager or its guest
group) and reports that manager's own contingent.

Each sub-event also carries a stable integration `key` and its descriptive content
(AIRLST-5842): `category`, `teaser`, `description`, `venue`, `contact_name`, `contact_email`,
`contact_phone`, `language` and `dress_code`. All are nullable and hold one language.
`list({ key })` returns only the live sub-event with that key: zero or one sub-event.

```javascript
const [sideEvent] = await new SubEvent('event-uuid').list({ key: 'deep-dive' })
```

#### Create and update a sub-event

```javascript
import { SubEvent } from '@airlst/sdk'

const subEvent = await new SubEvent('event-uuid').create({
  name: 'Deep Dive: Batteries',
  starts_at: '2027-05-03T09:00:00+02:00',
  ends_at: '2027-05-03T11:00:00+02:00',
  key: 'deep-dive',
  category: 'side_event',
  released: true,
  quotas: [
    { guest_group_id: 'market-a-uuid', limit: 12 },
    { guest_group_id: 'market-b-uuid', limit: 8 },
  ],
})

await new SubEvent('event-uuid').update(subEvent.id, { venue: 'Hall 4', teaser: null })
```

`create()` requires `name`, `starts_at` and `ends_at` (AIRLST-5842). A `key` that a live
sub-event of the same event already uses responds 422; a deleted sub-event frees its key.
`released: true` releases the sub-event for guest-manager booking. `quotas` writes the quota
matrix in the same transaction: a row has a `guest_group_id`, a `guest_manager_id`, or neither
(the default row), and its guest group or guest manager must belong to the event. `update()` is
a partial update: only the submitted fields change, and `null` clears a content field. It does
not take `quotas`. Both accept `response_deadline_at` and `reminder_at`; a reminder after the
deadline responds 422. Both accept `capacity` (AIRLST-5842): the overall seat count on top of
the quota matrix, `null` for no cap; a full capacity waitlists with cause `capacity`. Both
resolve to the sub-event with its quota state, in the shape of `list()`. Timestamps take an ISO 8601 offset; the API stores the UTC instant.

#### Write the quota matrix of a sub-event

```javascript
import { SubEvent } from '@airlst/sdk'

const subEvent = await new SubEvent('event-uuid').syncQuotas('sub-event-uuid', [
  { guest_group_id: 'market-a-uuid', limit: 12 },
  { guest_group_id: 'market-b-uuid', limit: 8 },
  { guest_manager_id: 'spoc-uuid', limit: 5 },
  { limit: 0 },
])
```

`syncQuotas()` replaces the complete matrix (AIRLST-5842), exactly like the Suite quota modal.
One sub-event can have rows for several guest groups: each row is the seat share of that market.
A row has a `guest_group_id`, a `guest_manager_id`, or neither (the default row), never both, and
the matrix holds at most one row per dimension. Guest groups and guest managers must belong to
the event. A kept row keeps its `id`; an empty array clears the matrix. It resolves to the
sub-event with the quota state of every row.

`mandatory: true` on a guest-group row (AIRLST-5842) makes the sub-event mandatory for the whole
market: every guest of the group, also guests added later, is assigned on the queue as a
confirmed mandatory participation. A guest who was cancelled out of the sub-event or declined it
is not added back, and no email goes out. Only a guest-group row can be mandatory: on a
guest-manager or default row the API responds **422**. Each quota row reports `mandatory`.

Each sub-event also reports `image_url` (AIRLST-5842), `null` without an image.

#### Set or remove the image of a sub-event

```javascript
import { SubEvent } from '@airlst/sdk'

const subEvent = await new SubEvent('event-uuid').uploadImage(
  'sub-event-uuid',
  file, // a Blob or File: JPEG, PNG or WebP, at most 5 MB
  'tour.jpg',
)

await new SubEvent('event-uuid').deleteImage('sub-event-uuid')
```

A new upload replaces the old image. Both methods return the sub-event in the shape of
`list()`. A file of another type or above 5 MB responds **422**.

#### Plan a sub-event before the invitation

```javascript
import { SubEvent } from '@airlst/sdk'

const subEvents = new SubEvent('event-uuid')

const sideEvent = await subEvents.create({
  name: 'Deep Dive: Batteries',
  starts_at: '2027-05-03T09:00:00+02:00',
  ends_at: '2027-05-03T11:00:00+02:00',
  plan_before_invitation: true,
})

// …assign guests: the rows are `planned`, nobody is told yet…

const { planned_count } = await subEvents.sendInvitations(sideEvent.id)
```

`plan_before_invitation: true` on `create()` starts the sub-event in planning (AIRLST-5842).
While it is in planning, `invitations_sent_at` is `null` and every assignment creates a
`planned` participation, or a `waitlisted` one when the quota is full. A `planned` row takes a
seat (`participations_count`, `used` and `booked` count it), sends no email and does not change
the guest's status on the parent event. The guest endpoints do not show the sub-event yet.

`sendInvitations()` ends the planning: the API sets `invitations_sent_at`, responds 202 with
`planned_count`, and moves every `planned` row to `invited` on the queue. Pass `false` as the
second argument to send no email; by default each row sends the email template hooked on
`invited` when the sub-event's `send_status_emails` is on. A second call is safe and reports
`planned_count: 0`. After it, new assignments are `invited` as usual.

#### Cancel or update a participation as the integrator

```javascript
import { SubEvent } from '@airlst/sdk'

const { data } = await new SubEvent('event-uuid').updateParticipation(
  'sub-event-uuid',
  'participation-uuid',
  { status: 'cancelled' },
)

data.participation.status // 'cancelled'
data.guest.status // the guest's status on the PARENT event, after the write
```

The integrator write (AIRLST-5842) takes any participation `status` and `extended_fields`. A
cancel keeps the row as `cancelled` and frees its seat, so the guest can be re-added later. A
move into a seat re-checks the quota and responds **422** while no seat is free, and the
planning rules apply. `send_automated_email` (default `false`) gates the per-sub-event status
email. A participation of another sub-event responds **404**.

#### Get temporary signed url to upload file directly to cloud storage

```javascript
import { Guest } from '@airlst/sdk'

await new Event().generateTemporaryUploadUrl(eventUuid, fileMimeType, false);
```

#### Create temporary upload which can be attached to a guest extended field using upload uuid

```javascript
import { Guest } from '@airlst/sdk'

await new Event().saveTemporaryUpload(eventUuid, temporaryUrlData, fileName, fileSize, fileMimeType, false);
```

### Guest methods

#### List all guests

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').list({ page: 2, search: 'John' })
```

Method accepts following parameters:

| Parameter            | Type     | Description                                                                                                                                                                                                                                  |
|----------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `page`               | `number` | Page number                                                                                                                                                                                                                                  |
| `perPage`            | `number` | Number of items per page                                                                                                                                                                                                                     |
| `search`             | `string` | Quick search                                                                                                                                                                                                                                 |
| `filters`            | `array`  | Filters arrays                                                                                                                                                                                                                               |
| `filters.*.field`    | `string` | Filter field e.g: `extended_fields->field1`, `booking:extended_fields->field1`                                                                                                                                                               |
| `filters.*.value`    | `string` | Filter field value                                                                                                                                                                                                                           |
| `filters.*.operator` | `string` | Filter field operator. Optional. One of: `eq` (equal), `neq` (not equal), `like`, `gt` (greater than), `gte` (greater than or equal), `lt` (less than), `lte` (less than or equal). If operator is not provided `eq` will be used as default |
| `sorts`              | `array`  | Sorts array                                                                                                                                                                                                                                  |
| `sorts.*.field`      | `string` | Sort field                                                                                                                                                                                                                                   |
| `sorts.*.direction`  | `string` | Sort field direction. One of: `asc` (ascending), `desc` (descending)                                                                                                                                                                         |
| `sorts.*.order`      | `number` | Sort field order. Optional. Defines order/priority of the sort when sorting by multiple fields                                                                                                                                               |
| `includeSubEventParticipations` | `boolean` | Optional. Adds `sub_event_participations` to every guest of the page, in the same shape as `get()` (AIRLST-5842). Only takes effect while the company's `sub-events` module is active; the key is absent otherwise. |

#### Validate guest code

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').validatedCode('guest-code')
```

#### Get guest with code

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').get('guest-code')
```

When the company's `sub-events` module is active, the guest object also carries
`sub_event_participations` (AIRLST-5445): the guest's sub-event participations with their
per-sub-event `status` (`planned`, `invited`, `confirmed`, `declined`, `cancelled` or
`waitlisted`; `planned` while the sub-event is in planning, AIRLST-5842).
The key is absent while the module is off.

Every participation object — here and on every sub-event endpoint below — also reports why it
is waitlisted (AIRLST-5448). `waitlist_cause` is `guest_group`, `guest_manager` or `default`
when that quota row refused the seat (`waitlist_cause_quota_id` names the row),
`all_or_nothing` when another sub-event of the same batch was full, `manual` when an operator
waitlisted the guest explicitly, and `null` on a row that is not waitlisted — or on one
waitlisted before the cause was recorded, which reads as "unknown". `queue_position` is the
guest's 1-based place in the FIFO queue of that contingent (ordered by `created_at`, then
`id`; one queue per quota row, the `all_or_nothing` rows of a sub-event among themselves) and
`null` when the row has no queue.

#### Assign a guest to sub-events

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').assignSubEvents(
  'guest-code',
  ['sub-event-uuid-1', 'sub-event-uuid-2'],
  { 'sub-event-uuid-1': { shirt_size: 'M' } },
)
```

The assignment is one transaction (AIRLST-5445): a full sub-event yields a `waitlisted`
participation instead of `invited`, and any error rolls back the whole batch. The response
reports the created participations with their per-sub-event `status`. Requires the company's
`sub-events` module; a sub-event of another event, or one the guest already participates in,
responds 422.

The optional third argument (AIRLST-5446) carries participation extended-field values, keyed
by sub-event UUID. Only sub-events listed in the assignment are accepted, and each value
object is validated against that sub-event's own field definitions — unknown keys respond 422.

The optional fourth argument `waitlistAllSubeventsOnLimit` (AIRLST-5578, default `false`) turns
the per-sub-event decision into an all-or-nothing one: when **any** requested sub-event has no
free seat for this guest, **every** participation of the call is created as `waitlisted` instead
of only the exhausted one. The trigger is the quota verdict, whichever applicable row produced
it — the guest's group row, a guest-manager row, or the default row. A waitlisted participation
occupies no seat, so the free sub-events keep theirs and the guest can be promoted one
participation at a time later. Pass `undefined` for the extended fields to use it on its own.

The optional fifth argument `mandatory` (AIRLST-5842, default `false`) makes every participation
of the call mandatory: `confirmed` without an RSVP (`planned` while the sub-event is in
planning), never waitlisted, also on a full quota. Each participation reports `is_mandatory`.
The guest cannot answer a mandatory participation: `updateSubEventParticipation()` responds
**422**. A mandatory participation does not change the guest's status on the parent event.

The response also carries `overlap_warnings` (AIRLST-5446): groups of the guest's sub-events
that overlap in time, limited to groups the just-created participations touch. It is a warning
only — the API never blocks an assignment because of an overlap.

The assignment also derives the guest's status on the parent event, silently — an assignment
never sends a status email (AIRLST-5447). That derived status is subject to the parent event's
guest limit, so a call that used to answer 201 can now answer 422 on `limits`, in which case
nothing is written. The response does not report the derived status: a fresh assignment derives
`invited`, which tells the caller nothing new. Read the parent status from
`updateSubEventParticipation()` once the guest answers.

#### List sub-events in the context of one guest

```javascript
import { Guest } from '@airlst/sdk'

const subEvents = await new Guest('event-uuid').listSubEvents('guest-code')
```

The registration-form read (AIRLST-5447, R40): every sub-event of the event, sorted by start
date, with the guest's own `participation` (`null` while the guest is not assigned) and a
guest-specific `has_free_seat`. Quota rows are scoped to guest groups and guest managers, so
whether a sub-event is "full" depends on the guest — `has_free_seat: false` means a confirm or
a new assignment for THIS guest would be waitlisted, and the form should say so before the
guest answers. Each sub-event also reports `response_deadline_at` (AIRLST-5842): after it the
guest can no longer confirm, but can still decline.

#### Accept or decline one participation as the guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').updateSubEventParticipation(
  'guest-code',
  'participation-uuid',
  'confirmed',
)

data.participation.status // 'confirmed'
data.guest.status // the guest's status on the PARENT event, after the answer
```

The guest RSVP (AIRLST-5447): a guest only ever answers `confirmed` or `declined`. A confirm
from the waitlist re-checks every applicable quota row under locks and responds 422 while no
seat is actually free — the guest stays waitlisted. While the guest is cancelled on the parent
event, a confirm responds 422 (reactivate the guest on the parent event first). After the
sub-event's `response_deadline_at` a confirm responds 422 too (AIRLST-5842). A decline is
always allowed, also after the deadline. A participation of another guest responds 404.

The answer also derives the guest's status on the parent event, in the same transaction, and
reports it as `data.guest.status`: one confirmed participation makes the guest `confirmed`;
while any participation is still `invited` or `waitlisted` the guest is `invited`; once every
participation is `declined` or `cancelled` the guest is `cancelled`. A guest held at `listed`
or `requested` is not moved to `invited`, and a guest in the payment-owned `unpaid` or
`checkout` states is not moved at all — so read the field rather than assuming one of the
three derived values. When the parent event's guest limit no longer fits the derived status
the whole call responds 422 and nothing is written. The assign endpoints do not return this
field: at assign time the derived value carries no information.

The optional fourth argument `sendAutomatedEmail` (default true) gates the per-SubEvent status
email together with the sub-event's own `send_status_emails` switch.

A mandatory participation (`is_mandatory: true`, AIRLST-5842) is not the guest's to answer:
confirm and decline both respond **422** on `status`.

#### Promote a waitlisted participation as the guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').promoteSubEventParticipation(
  'guest-code',
  'participation-uuid',
  'confirmed',
)

data.participation.status // 'confirmed'
data.guest.status // the guest's status on the PARENT event, after the promotion
data.warnings // [] when the guest was first in line
```

The key-authed guest promote (AIRLST-5407, ACP-30143) — the "book seat" action of a portal that
authenticates with the event API key. Only a `waitlisted` participation can be promoted, into
`invited` or `confirmed`. Every applicable quota row is re-checked under locks, so the call
responds **422** while no seat is actually free, and also after the sub-event's
`response_deadline_at` (AIRLST-5842); a participation of another guest responds **404**. The write derives the guest's status on the parent event silently, with the same rules
as `updateSubEventParticipation()`, and reports it as `data.guest.status`.

`data.warnings` (AIRLST-5448) is empty when the guest was first in the FIFO queue of their
contingent. Otherwise it carries one entry `{ code: 'queue_skipped', guests_waited_longer,
message }` — how many guests of the same contingent had waited longer, with a translated
message. A warning only: the promotion is never blocked by the queue. The promoted row has left
the waitlist, so its `waitlist_cause` and `queue_position` read `null`.

#### Book an open sub-event as the guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').bookSubEvent(
  'guest-code',
  'sub-event-uuid',
  { send_automated_email: true }, // optional: extended_fields, send_automated_email
)

data.participation.status // 'confirmed', or 'waitlisted' when no seat was free
data.participation.waitlist_cause // 'capacity' when the overall capacity was full
data.guest.status // the guest's status on the PARENT event, after the booking
```

First come, first served (AIRLST-5842): the guest books one sub-event whose
`registration_mode` is `open`. While a seat is free the guest is `confirmed` at once; when a
quota row or the sub-event's `capacity` is full, the guest is `waitlisted`, and
`waitlist_cause` names the quota row's kind or `capacity`. An `invitation_only` sub-event, a
passed `response_deadline_at`, an active participation (answer it with
`updateSubEventParticipation()`) and a guest who is cancelled or declined on the parent event
respond **422**. A sub-event in planning or of another event responds **404**. A `cancelled` or
`declined` participation is booked again. `send_automated_email` (default `true`) gates the
per-sub-event email of `confirmed`.

#### Create a new guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').create({
  status: 'confirmed',
  contact: {
    first_name: 'John',
    last_name: 'Doe',
  }
})
```

#### Create a guest linked to an existing contact

Pass `contact_id` **or** `contact_code` instead of `contact` to attach the guest
to a contact that already exists, rather than creating a new one. The contact
must belong to the event's company.

Use `contact_code` when you authenticated the contact by code and never resolved
its id — it is the same code `Contact.get()` takes and returns. Otherwise use
`contact_id`, which `Contact.get()` also returns as `data.contact.id`.

`contact`, `contact_id` and `contact_code` are mutually exclusive — sending any
pair fails validation. To correct the contact's data as well, create the guest
and then call `update()` with the `contact` fields.

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').create({
  status: 'confirmed',
  contact_code: 'QOI1U9GX',
  companions: [
    { contact_id: 'another-contact-uuid' },
    { contact: { first_name: 'Jane', last_name: 'Doe' } },
  ]
})
```

`GuestManager.create()` accepts both as well. Neither is accepted by
`createCompanion()` or `createRecommendation()` — those endpoints do not
support them.

#### Create a new companion guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').createCompanion('guest-code', {
  contact: {
    first_name: 'John',
    last_name: 'Doe',
  }
})
```

#### Update existing guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').update('guest-code', { status: 'confirmed' })
```

#### Update multiple guests

```javascript
import { Guest } from '@airlst/sdk'

// Target specific guests by code
await new Guest('event-uuid').updateGuests({
  guests: ['ABCD1234', 'ABCD2345'],
  status: 'confirmed',
})

// Or target every guest, optionally narrowed by filters
await new Guest('event-uuid').updateGuests({
  guests: 'all',
  filters: { status: 'invited' },
  status: 'confirmed',
})
```

#### Archive guest

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').archive('guest-code')
```

#### Restore an archived guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').restore('guest-code')
```

#### Delete guest

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').delete('guest-code')
```

#### Check in a guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').checkin('guest-code', {
  type: Guest.CheckinType.CHECK_IN,
  device: 'Mobile',
  location: 'Munich',
  timestamp: Math.round(+new Date() / 1000),
})
```

#### Create recommendation

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').createRecommendation('guest-code', {
    status: 'confirmed',
    contact: {
      first_name: 'John',
      last_name: 'Doe',
    }
  })
```

### GuestManager methods

The GuestManager class provides the same functionality as Guest but is designed for managing guest managers. It has all the same methods as Guest, with the key difference being that the `list()` method uses a different endpoint and returns `GuestManagerInterface` objects which include a `managed_guests` array instead of `guest_managers`.

#### List all guest managers

```javascript
import { GuestManager } from '@airlst/sdk'

const { data } = await new GuestManager('event-uuid').list({ page: 2, search: 'John' })
```

Method accepts the same parameters as Guest list method (see Guest methods section above).

#### All other methods

GuestManager supports all the same methods as Guest:

```javascript
import { GuestManager } from '@airlst/sdk'

// Validate guest manager code
const { data } = await new GuestManager('event-uuid').validateCode('guest-manager-code')

// Get guest manager with code
const { data } = await new GuestManager('event-uuid').get('guest-manager-code')

// Create a new guest manager
const { data } = await new GuestManager('event-uuid').create({
  status: 'confirmed',
  contact: {
    first_name: 'John',
    last_name: 'Doe',
  }
})

// Update existing guest manager
const { data } = await new GuestManager('event-uuid').update('guest-manager-code', { status: 'confirmed' })

// Check in a guest manager
const { data } = await new GuestManager('event-uuid').checkin('guest-manager-code', {
  type: GuestManager.CheckinType.CHECK_IN,
  device: 'Mobile',
  location: 'Munich',
  timestamp: Math.round(+new Date() / 1000),
})

// And all other methods: createCompanion, archive, restore, delete, createRecommendation, getAttachments, getAttachmentSignedUrl
```

#### List the sub-events a guest manager can book

```javascript
import { GuestManager } from '@airlst/sdk'

const subEvents = await new GuestManager('event-uuid').listSubEvents('guest-manager-uuid')
```

The contingent view of the guest-manager portal (AIRLST-5446/AIRLST-5534). Guest managers exist
only on the parent event, so the manager is named by its UUID and a manager of another event
answers 404.

A manager **reaches** a sub-event when BOTH hold: it is released, AND it carries an applicable
quota row — a row for this manager, or a row for the manager's own guest group. The **default**
row grants nothing: it is the fallback that catches everyone, so a released sub-event carrying
only a default row does not appear. An **exhausted** row still grants access — a full contingent
waitlists a booking, it does not hide the sub-event. Unreachable sub-events are absent; use
`SubEvent.list()` for the full integrator view.

Each entry reports `booked` — the occupying participations (`invited` and `confirmed`) of this
manager's guests — plus `limit` and `remaining` from the manager's own quota row. `limit` and
`remaining` are `null` when the manager has no row of its own: the manager dimension is then
unlimited, and the manager reached the sub-event through its guest group.

`guest_group_limit`, `guest_group_used` and `guest_group_remaining` report the row of the
manager's **own guest group** — the other contingent it books against. All three are `null` when
the manager has no guest group, or when its group owns no row on this sub-event (the manager then
books against the default row, whose numbers are not its business). `guest_group_used` counts
every guest of that group, not only the ones this manager brought.

Neither `remaining` nor `guest_group_remaining` goes below 0. Quota rows themselves — of guest
groups, of the default dimension and of other managers — are never exposed here. Requires the
company's `sub-events` module.

`waitlisted` and `guest_group_waitlisted` (AIRLST-5448) count the guests queued on the manager's
own row and on its group row — the queues a raised limit would drain, in FIFO order. They are
`null` exactly when `limit` and `guest_group_limit` are `null`.

#### Book a guest onto sub-events as a guest manager

```javascript
import { GuestManager } from '@airlst/sdk'

const { data } = await new GuestManager('event-uuid').assignGuestSubEvents(
  'guest-manager-uuid',
  'guest-code',
  ['sub-event-uuid-1', 'sub-event-uuid-2'],
  { 'sub-event-uuid-1': { shirt_size: 'M' } },
)
```

Same transaction, quota locks, waitlisting and response body as `Guest.assignSubEvents()`, plus
the two guest-manager restrictions (AIRLST-5446). The guest must be assigned to that manager —
a guest of another manager responds **403**, and that check runs before validation, so nothing
about the posted sub-events is disclosed. Every sub-event must be released — an unreleased one
responds **422** on the offending `sub_event_ids.{index}` key and the whole batch is refused.
An exhausted quota yields a `waitlisted` participation; it is never a hard rejection.

The optional fifth argument `waitlistAllSubeventsOnLimit` (AIRLST-5578, default `false`) behaves
exactly as on `Guest.assignSubEvents()`. `assignGuestsSubEvents()` takes it too, as its own fifth
argument, and the API evaluates it **per guest**: a guest whose batch meets an exhausted quota is
waitlisted on all of its sub-events, while the rest of the call still books normally.

Both methods take `mandatory` (AIRLST-5842) as their sixth argument, with the same meaning as on
`Guest.assignSubEvents()`.

#### Cancel a participation as a guest manager

```javascript
import { GuestManager } from '@airlst/sdk'

const { data } = await new GuestManager('event-uuid').cancelSubEventParticipation(
  'guest-manager-uuid',
  'participation-uuid',
)

data.participation.status // 'cancelled'
```

A guest manager cancels a participation of its own guest (AIRLST-5842). The row stays as
`cancelled` and its seat is freed. A guest of another manager responds **403**, a sub-event
out of the manager's reach **422**. The cancel sends no email.

#### Promote a waitlisted participation as a guest manager

```javascript
import { GuestManager } from '@airlst/sdk'

const { data } = await new GuestManager('event-uuid').promoteSubEventParticipation(
  'guest-manager-uuid',
  'participation-uuid',
  'confirmed',
)
```

Manual promotion is the guest manager's step (AIRLST-5446); automatic FIFO promotion is a later
milestone. The participation must be `waitlisted`, its sub-event released, and its guest assigned
to that manager. Every applicable quota row is re-checked under locks, so the promotion responds
**422** while no seat is actually free.

`data.warnings` (AIRLST-5448) is empty when the guest was first in the FIFO queue of their
contingent. Otherwise it carries one entry `{ code: 'queue_skipped', guests_waited_longer,
message }` — how many guests of the same contingent had waited longer, with a translated
message. A warning only: the promotion is never blocked by the queue. The promoted row has left
the waitlist, so its `waitlist_cause` and `queue_position` read `null`.

While the sub-event is in planning (AIRLST-5842), the only target status is `planned`;
`invited` and `confirmed` respond **422**. After its invitations are sent, `planned` responds
**422**.

### GuestGroup methods

#### List all guest groups

Returns the array of guest groups directly (unwrapped). Each group's `name` is a locale→string map.

```javascript
import { GuestGroup } from '@airlst/sdk'

const guestGroups = await new GuestGroup('event-uuid').list()
// [{ id: '...', name: { 'en-GB': 'VIP', 'de-DE': 'VIP' } }, ...]
```

### Email Template methods

#### Retrieve all email templates for the event

```javascript
import { EmailTemplate } from '@airlst/sdk'

const { data } = await new EmailTemplate('event-uuid').list()
```

Each template reports its send trigger: `booking_status_hook` (a parent booking status), or —
mutually exclusive with it — the per-SubEvent pair `sub_event_id` + `sub_event_status_hook`
(AIRLST-5447). A per-SubEvent template sends on a real participation status transition into
the hooked status, and only while the sub-event's `send_status_emails` switch is on.

#### Send email template to selected guests

```javascript
import { EmailTemplate } from '@airlst/sdk'

await new EmailTemplate('event-uuid').send('email-template-uuid',{
  guests:[
    "guest-code-1",
    "guest-code-2"
    ]
})
```
### Contact methods

#### Validate guest code

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().validateCode('contact-code')
```

#### Get contact with code

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().get('contact-code')
```

#### Get events for the contact

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().getEvents('contact-code')
```

#### Update contact master data

Updates a contact's master data by code — native fields and `extended_fields` —
without creating a guest or registration. All fields are optional: native
fields are overwritten when present, and `extended_fields` are merged key by
key (existing keys are preserved). Returns the updated contact, same shape as
`get()`.

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().update('contact-code', {
  contact: {
    first_name: 'Jane',
    mobile: '+4915212345678',
    extended_fields: { stammdaten_saved: true },
  },
})
```

#### Get all guest attachments

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').getAttachments('guest-code')
```

#### Get attachment signed downloadable URL
**Note:** The generated URL will be valid for **10 minutes**

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').getAttachmentSignedUrl('guest-code','attachment-uuid')
```
### Bookables methods

#### Get list of bookable groups

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listGroups()
```

#### Get list of bookable objects for group

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listBookables('bookable-group-uuid')
```

#### Get list of availabilities for bookable object

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listAvailabilities('bookable-group-uuid', 'bookable-object-uuid', {
  start_date: '2025-01-02',
  end_date: '2025-02-03',
  // Optional: resolve the guest's group to compute guest-specific remaining capacity
  guest_code: 'guest-code'
})
```

Every datetime in the response is an **absolute UTC instant**, never event-local wall clock. The
response publishes the event timezone as `data.timezone` (e.g. `Europe/Berlin`) — the same value is
also on `EventInterface` — so you can render those instants and convert a wall-clock time picked by a
user back to UTC without a second request.

For a slot-based FLEXIBLE bookable, each availability also carries the slot configuration so you can
derive the bookable slots yourself: convert `starts_at` into `data.timezone`, step
`duration_minutes + buffer_minutes` in that local wall clock until the window closes, then convert
each slot boundary back to UTC — which is how the server generates them. Each slot covers
`[slot_start, slot_start + duration_minutes)` and seats `capacity_per_slot` units. A window whose
closing time is not after its opening time (e.g. 22:00–06:00, or 00:00–00:00 for 24/7) runs past
midnight, and every day of the availability repeats the full window. Book each slot as its own
`line_items` entry via `addOrderLineItem()`.

> Step in local time, not in UTC. Across a DST transition inside the window, consecutive slots are
> **not** a fixed number of UTC minutes apart, so a UTC-stepped grid diverges from the server's.

`duration_minutes` is the mode signal — it is `null` for every non-slot availability. Do not detect
slot mode from `buffer_minutes` or `capacity_per_slot`: those always carry their defaults (`0` / `1`).

Each availability also carries the price for its own pricing model, so you never have to hardcode a
price in the frontend. At most one of the three fields is populated; the others are `null`:

| Field | Populated for | Shape |
| --- | --- | --- |
| `per_item_price` | quantity-based (FIXED) | `{ [guestGroupId]: Price }` — per item, multiply by the quantity |
| `per_duration_price` | slot-based (FLEXIBLE with `duration_minutes`) | `{ [guestGroupId]: { [minutes]: Price } }` — per slot; does **not** scale with the slot length |
| `per_night_price` | per-night (NIGHTS) | `{ [guestGroupId]: { [YYYY-MM-DD]: Price } }` — per night, sum the stay |

`net`, `gross` and `vat` are integers in minor units (cents) with `gross` inclusive of VAT, and
`vat_rate` is a percentage. The outer key is the availability's own guest group, or
`00000000-0000-0000-0000-000000000000` for a row that applies to every group without a specific
price. A legacy FLEXIBLE availability with no `duration_minutes` has no per-duration price and
reports `null`.

#### Create reservation

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').createReservation('bookable-group-uuid', {
    guest_code: 'guest-code',
    reservations: [
      {
        bookable_id: 'bookable-object-uuid',
        // Required unless the bookable is an add-on with a FIXED availability type, which has no
        // date window. For those, omit both — any dates sent are ignored and the reservation is
        // stored without them.
        starts_at: '2025-02-04 13:20:00',
        ends_at: '2025-02-04 13:40:00',
        quantity: 1,
        // Reservation-scoped extended fields, keyed by field key. Only keys defined on the
        // bookable group for the `bookableReservation` model are accepted.
        extended_fields: { test_field: 'probeA123' }
      }
    ]
})
```

#### Delete reservation

```javascript
import { Bookable } from '@airlst/sdk'

await new Bookable('event-uuid').deleteReservation('guest-code', 'reservation-uuid')
```

#### Get or create a booking's CART carrier order

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').createOrder({
  booking_id: 'booking-uuid'
})
```

#### Get list of a booking's CART carrier orders

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listOrders('booking-uuid')
```

#### Show a carrier order with its line items and add-on reservations

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').getOrder('order-uuid')
```

#### Add add-on allocation line items to a carrier order

Pass `line_items` to allocate any number of add-ons in one request. Entries are independent, so a
single call can book several slots of a slot-based FLEXIBLE add-on (e.g. 20 hourly shifts of stand
security), book non-contiguous slots, mix different add-ons and use a different quantity per entry.

The payload is applied all-or-nothing: if any entry is invalid or unavailable, nothing is held and
the request fails with 422 naming the rejected entry (`Line item 1: …`). At most 50 entries per
request.

`start_at` and `end_at` are **absolute instants**, never event-local wall clock. Send UTC (`…Z`) or an
explicit offset (`2026-06-03T11:00:00+02:00`), which is stored as the same instant; a value carrying
no zone at all is read as UTC. To book a wall-clock time, convert it from the event timezone first —
`listAvailabilities()` returns it as `data.timezone`. Sending `23:00` for a 23:00 event-local slot in
a UTC+2 event books a different slot, or none.

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').addOrderLineItem('order-uuid', {
  guest_code: 'guest-code',
  line_items: [
    {
      addon_id: 'addon-uuid',
      // Required unless the add-on has a FIXED availability type. For a slot-based FLEXIBLE add-on
      // these must be the boundaries of one slot — a range spanning several slots is rejected, so
      // send one entry per slot. Read duration_minutes / buffer_minutes / capacity_per_slot from
      // listAvailabilities() to work out the slots.
      start_at: '2026-06-03T09:00:00Z',
      end_at: '2026-06-03T10:00:00Z',
      quantity: 1
    },
    {
      addon_id: 'addon-uuid',
      start_at: '2026-06-03T10:00:00Z',
      end_at: '2026-06-03T11:00:00Z',
      quantity: 1,
      // Reservation-scoped extended fields, keyed by field key. Only keys defined on the add-on's
      // bookable group for the `bookableReservation` model are accepted, and each value is validated
      // against its field definition. For NIGHTS add-ons the values are written to every per-night
      // reservation.
      extended_fields: { test_field: 'probeA123' }
    }
  ]
})
// data.reservation_ids => ['reservation-uuid', ...] (flat, in submission order)
// data.line_items => [{ index: 0, reservation_ids: [...] }, { index: 1, reservation_ids: [...] }]
```

The previous single-item body (`addon_id` / `start_at` / `end_at` / `quantity` / `extended_fields` at
the top level) still works unchanged, but is deprecated in favour of `line_items`:

```javascript
const { data } = await new Bookable('event-uuid').addOrderLineItem('order-uuid', {
  guest_code: 'guest-code',
  addon_id: 'addon-uuid',
  quantity: 1
})
```

#### Delete an add-on allocation line item and release its contingent

```javascript
import { Bookable } from '@airlst/sdk'

await new Bookable('event-uuid').deleteOrderLineItem('order-uuid', 'line-item-uuid')
```

#### Bulk-delete add-on allocation line items in one request

Removes several line items at once. A slot-based add-on holds one line item per slot, so this clears a whole time range in a single call instead of one `deleteOrderLineItem()` per slot. Read the ids from `getOrder()`. Up to 100 ids per request; the call is all-or-nothing.

`deleted_line_item_ids` is the authoritative list of what was removed — it can name more ids than the request when a NIGHTS add-on releases the whole contiguous stay.

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').bulkDeleteOrderLineItems('order-uuid', {
  line_item_ids: ['line-item-uuid-1', 'line-item-uuid-2']
})

console.log(data.deleted_count, data.deleted_line_item_ids)
```

#### Bulk-assign an add-on to many guests

Assigns a single add-on selection to many guests at once. Processing is asynchronous, so the call resolves with no content once the batch has been queued.

```javascript
import { Bookable } from '@airlst/sdk'

await new Bookable('event-uuid').assignBookables({
  // Either an explicit list of guest codes, or the string 'all'
  guests: ['ABCD1234', 'ABCD2345'],
  // Optional: only applied when guests is 'all'
  filters: {
    status: 'confirmed',
    guest_group_id: 'guest-group-uuid'
  },
  bookable_group_id: 'bookable-group-uuid',
  // Must also include every flexible add-on referenced in selected_slots
  selected_bookable_objects: ['bookable-object-uuid'],
  // For FLEXIBLE add-ons: one reservation is created per slot
  selected_slots: [
    {
      bookable_id: 'bookable-object-uuid',
      start_at: '2026-06-03 09:00:00',
      end_at: '2026-06-03 09:30:00'
    }
  ],
  // Required when a NIGHTS add-on is selected (end_date = excluded check-out day)
  start_date: '2026-06-03',
  end_date: '2026-06-06'
})
```
