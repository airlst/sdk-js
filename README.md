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

`SubEvent.list()` is the **full integrator view**: it returns released and unreleased
sub-events alike, and `released_at` is what tells them apart. A guest-manager-facing consumer
must not read it — use `GuestManager.listSubEvents()` instead, which returns only the sub-events
the acting manager can reach (released AND covered by a quota row for the manager or its guest
group) and reports that manager's own contingent.

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
per-sub-event `status` (`invited`, `confirmed`, `declined`, `cancelled` or `waitlisted`).
The key is absent while the module is off.

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
guest answers.

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
event, a confirm responds 422 (reactivate the guest on the parent event first); a decline is
always allowed. A participation of another guest responds 404.

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

#### Promote a waitlisted participation as a guest manager

```javascript
import { GuestManager } from '@airlst/sdk'

const { data } = await new GuestManager('event-uuid').promoteSubEventParticipation(
  'guest-manager-uuid',
  'participation-uuid',
  'confirmed',
)
```

Manual promotion is the guest manager's step (AIRLST-5446); automatic/FIFO promotion is a later
milestone. The participation must be `waitlisted`, its sub-event released, and its guest assigned
to that manager. Every applicable quota row is re-checked under locks, so the promotion responds
**422** while no seat is actually free.

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
