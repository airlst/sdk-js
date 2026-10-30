import { afterEach, test, expect, vi } from 'vitest'
import { Api, SubEvent } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const subEvent = new SubEvent('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('list()', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      sub_events: [
        {
          id: 'sub-event-uuid',
          name: 'Factory Tour',
          starts_at: '2026-09-01T09:00:00.000000Z',
          ends_at: '2026-09-01T11:00:00.000000Z',
          registration_mode: 'invitation_only',
          released_at: '2026-08-20T08:00:00.000000Z',
          participations_count: 3,
          quotas: [
            {
              id: 'quota-uuid',
              guest_group_id: null,
              guest_manager_id: null,
              guest_manager_name: null,
              limit: 20,
              used: 3,
            },
          ],
        },
      ],
    },
  })

  const subEvents = await subEvent.list()

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/sub-events')
  expect(subEvents).toHaveLength(1)
  expect(subEvents[0].name).toBe('Factory Tour')
  expect(subEvents[0].participations_count).toBe(3)
  expect(subEvents[0].quotas[0].guest_group_id).toBeNull()
  expect(subEvents[0].quotas[0].used).toBe(3)
  expect(subEvents[0].released_at).toBe('2026-08-20T08:00:00.000000Z')
})

test('list() exposes guest-manager quota rows', async () => {
  // A guest-manager row (AIRLST-5446) limits the guests assigned to that manager,
  // on top of their group/default row; an unreleased sub-event reports
  // `released_at: null`.
  apiMock.mockResolvedValueOnce({
    data: {
      sub_events: [
        {
          id: 'sub-event-uuid',
          name: 'Factory Tour',
          starts_at: '2026-09-01T09:00:00.000000Z',
          ends_at: '2026-09-01T11:00:00.000000Z',
          registration_mode: 'invitation_only',
          released_at: null,
          participations_count: 3,
          quotas: [
            {
              id: 'manager-quota',
              guest_group_id: null,
              guest_manager_id: 'manager-uuid',
              guest_manager_name: 'Alex Smith',
              limit: 10,
              used: 2,
            },
          ],
        },
      ],
    },
  })

  const subEvents = await subEvent.list()

  expect(subEvents[0].released_at).toBeNull()
  expect(subEvents[0].quotas[0].guest_manager_id).toBe('manager-uuid')
  expect(subEvents[0].quotas[0].guest_manager_name).toBe('Alex Smith')
})

test('list() exposes the locale-keyed guest group name on a group quota', async () => {
  // The default quota carries no group, so no name; a quota tied to a guest group
  // carries `guest_group_name` as a locale-keyed object. Core only started sending it
  // on this endpoint once the guestGroup eager load moved into the action that both
  // the suite page and this endpoint share (AIRLST-5445).
  apiMock.mockResolvedValueOnce({
    data: {
      sub_events: [
        {
          id: 'sub-event-uuid',
          name: 'Gala Dinner',
          starts_at: '2026-09-01T19:00:00.000000Z',
          ends_at: '2026-09-01T23:00:00.000000Z',
          registration_mode: 'open',
          participations_count: 5,
          quotas: [
            { id: 'default-quota', guest_group_id: null, limit: 20, used: 2 },
            {
              id: 'group-quota',
              guest_group_id: 'guest-group-uuid',
              guest_group_name: { 'en-GB': 'VIP', 'de-DE': 'VIP' },
              limit: 5,
              used: 3,
            },
          ],
        },
      ],
    },
  })

  const [galaDinner] = await subEvent.list()

  expect(galaDinner?.registration_mode).toBe('open')
  expect(galaDinner?.quotas[0]?.guest_group_name).toBeUndefined()
  expect(galaDinner?.quotas[1]?.guest_group_name?.['en-GB']).toBe('VIP')
  expect(galaDinner?.quotas[1]?.used).toBe(3)
})

const content = {
  key: 'deep-dive',
  category: 'side_event',
  teaser: 'Teaser',
  description: '<p>Description</p>',
  venue: 'Hall 4',
  contact_name: 'Alex Smith',
  contact_email: 'alex@example.com',
  contact_phone: '+49 711 000000',
  language: 'en-GB',
  dress_code: 'Business casual',
}

test('list() filters by key', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_events: [{ id: 'sub-event-uuid', ...content }] },
  })

  const subEvents = await subEvent.list({ key: 'deep dive&x' })

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events?key=deep+dive%26x',
  )
  expect(subEvents[0].key).toBe('deep-dive')
  expect(subEvents[0].venue).toBe('Hall 4')
})

test('create()', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      sub_event: { id: 'sub-event-uuid', name: 'Deep Dive', ...content },
    },
  })

  const body = {
    name: 'Deep Dive',
    starts_at: '2027-05-03T09:00:00+02:00',
    ends_at: '2027-05-03T11:00:00+02:00',
    released: true,
    quotas: [
      { guest_group_id: 'market-a-uuid', limit: 12 },
      { guest_manager_id: 'spoc-uuid', limit: 5 },
      { limit: 0 },
    ],
    ...content,
  }

  const created = await subEvent.create(body)

  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/sub-events', {
    method: 'post',
    body: JSON.stringify(body),
  })
  expect(created.id).toBe('sub-event-uuid')
  expect(created.category).toBe('side_event')
})

test('update()', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_event: { id: 'sub-event-uuid', ...content, teaser: null } },
  })

  const updated = await subEvent.update('sub-event-uuid', {
    teaser: null,
    released: false,
  })

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid',
    {
      method: 'patch',
      body: JSON.stringify({ teaser: null, released: false }),
    },
  )
  expect(updated.teaser).toBeNull()
})

test('syncQuotas()', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      sub_event: {
        id: 'sub-event-uuid',
        quotas: [
          {
            id: 'quota-uuid',
            guest_group_id: 'market-a-uuid',
            guest_manager_id: null,
            guest_manager_name: null,
            limit: 12,
            used: 3,
          },
        ],
      },
    },
  })

  const quotas = [
    { guest_group_id: 'market-a-uuid', limit: 12 },
    { guest_manager_id: 'spoc-uuid', limit: 5 },
    { limit: 0 },
  ]

  const synced = await subEvent.syncQuotas('sub-event-uuid', quotas)

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/quotas',
    {
      method: 'put',
      body: JSON.stringify({ quotas }),
    },
  )
  expect(synced.quotas[0].used).toBe(3)
})

test('syncQuotas() clears the matrix with an empty array', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_event: { id: 'sub-event-uuid', quotas: [] } },
  })

  const synced = await subEvent.syncQuotas('sub-event-uuid', [])

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/quotas',
    { method: 'put', body: JSON.stringify({ quotas: [] }) },
  )
  expect(synced.quotas).toHaveLength(0)
})

test('uploadImage() posts the file as multipart', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      sub_event: { id: 'sub-event-uuid', image_url: 'https://cdn/tour.jpg' },
    },
  })
  const image = new Blob(['jpg-bytes'], { type: 'image/jpeg' })

  const result = await subEvent.uploadImage('sub-event-uuid', image, 'tour.jpg')

  expect(result.image_url).toBe('https://cdn/tour.jpg')
  expect(apiMock).toHaveBeenCalledTimes(1)

  const [uri, options] = apiMock.mock.calls[0]
  expect(uri).toBe('/events/event-uuid/sub-events/sub-event-uuid/image')
  expect(options.method).toBe('POST')
  expect(options.body).toBeInstanceOf(FormData)
  expect((options.body.get('image') as File).name).toBe('tour.jpg')
  expect(options.headers).not.toHaveProperty('content-type')
  expect(options.headers).toHaveProperty('x-api-key')
})

test('deleteImage()', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_event: { id: 'sub-event-uuid', image_url: null } },
  })

  const result = await subEvent.deleteImage('sub-event-uuid')

  expect(result.image_url).toBeNull()
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/image',
    { method: 'DELETE' },
  )
})

test('sendInvitations()', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_event_id: 'sub-event-uuid', planned_count: 143 },
  })

  const result = await subEvent.sendInvitations('sub-event-uuid')

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/send-invitations',
    { method: 'post', body: JSON.stringify({}) },
  )
  expect(result.planned_count).toBe(143)
})

test('sendInvitations() without emails', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_event_id: 'sub-event-uuid', planned_count: 0 },
  })

  await subEvent.sendInvitations('sub-event-uuid', false)

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/send-invitations',
    { method: 'post', body: JSON.stringify({ send_automated_email: false }) },
  )
})

test('create() starts a sub-event in planning', async () => {
  apiMock.mockResolvedValueOnce({
    data: { sub_event: { id: 'sub-event-uuid', invitations_sent_at: null } },
  })

  const body = {
    name: 'Deep Dive',
    starts_at: '2027-05-03T09:00:00+02:00',
    ends_at: '2027-05-03T11:00:00+02:00',
    plan_before_invitation: true,
  }

  const created = await subEvent.create(body)

  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/sub-events', {
    method: 'post',
    body: JSON.stringify(body),
  })
  expect(created.invitations_sent_at).toBeNull()
})

test('updateParticipation() cancels a participation', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      participation: { id: 'participation-uuid', status: 'cancelled' },
      warnings: [],
      guest: { status: 'cancelled' },
    },
  })

  const { data } = await subEvent.updateParticipation(
    'sub-event-uuid',
    'participation-uuid',
    { status: 'cancelled', send_automated_email: false },
  )

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/participations/participation-uuid',
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'cancelled',
        send_automated_email: false,
      }),
    },
  )
  expect(data.participation.status).toBe('cancelled')
  expect(data.guest.status).toBe('cancelled')
})

test('syncQuotas() sends a mandatory guest-group row', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      sub_event: {
        id: 'sub-event-uuid',
        quotas: [
          {
            id: 'quota-uuid',
            guest_group_id: 'market-a-uuid',
            guest_manager_id: null,
            guest_manager_name: null,
            limit: 12,
            used: 12,
            mandatory: true,
          },
        ],
      },
    },
  })

  const quotas = [
    { guest_group_id: 'market-a-uuid', limit: 12, mandatory: true },
  ]

  const synced = await subEvent.syncQuotas('sub-event-uuid', quotas)

  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid/quotas',
    { method: 'put', body: JSON.stringify({ quotas }) },
  )
  expect(synced.quotas[0].mandatory).toBe(true)
})

test('create() and update() send the sub-event extended fields', async () => {
  apiMock.mockResolvedValue({
    data: {
      sub_event: {
        id: 'sub-event-uuid',
        extended_fields: { format: 'hybrid', expected_participants: 40 },
      },
    },
  })

  const created = await subEvent.create({
    name: 'Deep Dive',
    starts_at: '2027-05-03T09:00:00+02:00',
    ends_at: '2027-05-03T11:00:00+02:00',
    extended_fields: { format: 'hybrid', expected_participants: 40 },
  })

  expect(created.extended_fields.format).toBe('hybrid')

  await subEvent.update('sub-event-uuid', {
    extended_fields: { expected_participants: null },
  })

  expect(apiMock).toHaveBeenLastCalledWith(
    '/events/event-uuid/sub-events/sub-event-uuid',
    {
      method: 'patch',
      body: JSON.stringify({
        extended_fields: { expected_participants: null },
      }),
    },
  )
})
