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

test('listQuotaIncreaseRequests() without filters', async () => {
  const quotaIncreaseRequests = [
    {
      id: 'request-1',
      guest_group_id: 'group-1',
      requested_by_guest_manager_id: 'manager-1',
      requested_amount: 5,
      status: 'requested',
      created_at: '2026-07-07T10:00:00.000000Z',
      resolved_at: null,
    },
  ]
  apiMock.mockResolvedValue({
    data: { quota_increase_requests: quotaIncreaseRequests },
  })

  const result = await guestGroup.listQuotaIncreaseRequests()

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-groups/quota-increase-requests',
  )
  expect(result).toStrictEqual({
    data: { quota_increase_requests: quotaIncreaseRequests },
  })
})

test('listQuotaIncreaseRequests() with filters', async () => {
  guestGroup.listQuotaIncreaseRequests({
    guest_group_id: 'group-1',
    guest_manager_id: 'manager-1',
    status: 'requested',
  })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-groups/quota-increase-requests?guest_group_id=group-1&guest_manager_id=manager-1&status=requested',
  )
})

test('createQuotaIncreaseRequest()', async () => {
  const quotaIncreaseRequest = {
    id: 'request-1',
    guest_group_id: 'group-1',
    requested_by_guest_manager_id: 'manager-1',
    requested_amount: 5,
    status: 'requested',
    created_at: '2026-07-07T10:00:00.000000Z',
    resolved_at: null,
  }
  apiMock.mockResolvedValue({
    data: { quota_increase_request: quotaIncreaseRequest },
  })

  const result = await guestGroup.createQuotaIncreaseRequest({
    guest_manager_id: 'manager-1',
    amount: 5,
  })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-groups/quota-increase-requests',
    {
      method: 'post',
      body: JSON.stringify({ guest_manager_id: 'manager-1', amount: 5 }),
    },
  )
  expect(result).toStrictEqual({
    data: { quota_increase_request: quotaIncreaseRequest },
  })
})
