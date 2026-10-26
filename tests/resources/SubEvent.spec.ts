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
