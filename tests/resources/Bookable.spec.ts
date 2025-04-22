import { afterEach, test, expect, vi } from 'vitest'
import { Api, Bookable } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const bookable = new Bookable('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('listGroups()', async () => {
  await bookable.listGroups()

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/bookables/groups')
})

test('listBookables()', async () => {
  await bookable.listBookables('bookable-group-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/groups/bookable-group-uuid',
  )
})

test('listAvailabilities()', async () => {
  const requestBody = {
    start_date: 'start-date',
    end_date: 'end-date',
  }
  await bookable.listAvailabilities(
    'bookable-group-uuid',
    'bookable-object-uuid',
    requestBody,
  )

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/groups/bookable-group-uuid/objects/bookable-object-uuid/availability',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('createReservation()', async () => {
  const requestBody = {
    guest_code: 'ABC123',
    reservations: [
      {
        starts_at: '2025-02-04 13:20:00',
        ends_at: '2025-02-04 13:40:00',
        bookable_id: '68076f81-4598-8009-b047-82e482892527',
      },
    ],
  }
  await bookable.createReservation('bookable-group-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/groups/bookable-group-uuid/reservations',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('deleteReservation()', async () => {
  await bookable.deleteReservation('guest-code', 'reservation-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/guests/guest-code/reservations/reservation-uuid',
    {
      method: 'delete',
    },
  )
})
