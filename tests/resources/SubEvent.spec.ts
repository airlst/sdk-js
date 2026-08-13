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
          participations_count: 3,
          quotas: [
            { id: 'quota-uuid', guest_group_id: null, limit: 20, used: 3 },
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
