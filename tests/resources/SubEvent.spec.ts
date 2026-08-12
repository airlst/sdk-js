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
