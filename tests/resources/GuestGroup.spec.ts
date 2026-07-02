import { afterEach, test, expect, vi } from 'vitest'
import { Api, GuestGroup } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const guestGroup = new GuestGroup('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('list()', async () => {
  const guestGroups = [
    { id: 'group-1', name: { 'en-GB': 'VIP', 'de-DE': 'VIP' } },
    { id: 'group-2', name: { 'en-GB': 'Press', 'de-DE': 'Presse' } },
  ]
  apiMock.mockResolvedValue({ data: { guest_groups: guestGroups } })

  const result = await guestGroup.list()

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guest-groups')
  expect(result).toStrictEqual(guestGroups)
})
