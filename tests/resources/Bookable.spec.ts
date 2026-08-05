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

test('listAvailabilities() returns the event timezone alongside the availabilities', async () => {
  // The availabilities carry UTC instants and the client derives slots from duration_minutes, so the
  // response publishes the timezone to convert against — no second request needed (AIRLST-5311).
  apiMock.mockResolvedValueOnce({
    data: {
      timezone: 'Europe/Berlin',
      availabilities: [
        {
          starts_at: '2026-07-29T20:00:00.000000Z',
          ends_at: '2026-07-29T22:00:00.000000Z',
          duration_minutes: 60,
          buffer_minutes: 0,
          capacity_per_slot: 1,
        },
      ],
    },
  })

  const response = await bookable.listAvailabilities(
    'bookable-group-uuid',
    'bookable-object-uuid',
    { start_date: 'start-date', end_date: 'end-date' },
  )

  expect(response.data.timezone).toBe('Europe/Berlin')
  // 20:00Z is 22:00 in Europe/Berlin on a summer day — the instant is untouched by the field.
  expect(response.data.availabilities[0].starts_at).toBe(
    '2026-07-29T20:00:00.000000Z',
  )
})

test('listAvailabilities() with guest_code', async () => {
  const requestBody = {
    start_date: 'start-date',
    end_date: 'end-date',
    guest_code: 'ABCD1234',
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

test('createReservation() without dates for a FIXED bookable', async () => {
  const requestBody = {
    guest_code: 'ABC123',
    reservations: [
      {
        bookable_id: '68076f81-4598-8009-b047-82e482892527',
        quantity: 1,
        extended_fields: { test_field: 'probeA123' },
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

test('createOrder()', async () => {
  const requestBody = {
    booking_id: 'booking-uuid',
  }
  await bookable.createOrder(requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/bookables/orders', {
    method: 'post',
    body: JSON.stringify(requestBody),
  })
})

test('listOrders()', async () => {
  await bookable.listOrders('booking-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders?booking_id=booking-uuid',
  )
})

test('getOrder()', async () => {
  await bookable.getOrder('order-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid',
  )
})

test('addOrderLineItem()', async () => {
  const requestBody = {
    guest_code: 'ABC123',
    addon_id: '68076f81-4598-8009-b047-82e482892527',
    start_at: '2026-06-03',
    end_at: '2026-06-06',
    quantity: 1,
  }
  await bookable.addOrderLineItem('order-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid/line-items',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('addOrderLineItem() with reservation extended_fields', async () => {
  const requestBody = {
    guest_code: 'ABC123',
    addon_id: '68076f81-4598-8009-b047-82e482892527',
    quantity: 1,
    extended_fields: { test_field: 'probeA123' },
  }
  await bookable.addOrderLineItem('order-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid/line-items',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('addOrderLineItem() with several line_items in one request', async () => {
  const requestBody = {
    guest_code: 'ABC123',
    line_items: [
      {
        addon_id: '68076f81-4598-8009-b047-82e482892527',
        start_at: '2026-06-03T09:00:00Z',
        end_at: '2026-06-03T10:00:00Z',
        quantity: 1,
      },
      {
        addon_id: '68076f81-4598-8009-b047-82e482892527',
        start_at: '2026-06-03T10:00:00Z',
        end_at: '2026-06-03T11:00:00Z',
        quantity: 2,
        extended_fields: { guard_name: 'Late shift' },
      },
    ],
  }
  await bookable.addOrderLineItem('order-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid/line-items',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('addOrderLineItem() with line_items for a FIXED add-on omits the dates', async () => {
  const requestBody = {
    guest_code: 'ABC123',
    line_items: [
      { addon_id: '68076f81-4598-8009-b047-82e482892527', quantity: 3 },
    ],
  }
  await bookable.addOrderLineItem('order-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid/line-items',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('deleteOrderLineItem()', async () => {
  await bookable.deleteOrderLineItem('order-uuid', 'line-item-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid/line-items/line-item-uuid',
    {
      method: 'delete',
    },
  )
})

test('bulkDeleteOrderLineItems()', async () => {
  const requestBody = {
    line_item_ids: ['line-item-uuid-1', 'line-item-uuid-2'],
  }
  await bookable.bulkDeleteOrderLineItems('order-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/orders/order-uuid/line-items/bulk-delete',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('assignBookables()', async () => {
  const requestBody = {
    guests: ['ABCD1234', 'ABCD2345'],
    bookable_group_id: 'bookable-group-uuid',
    selected_bookable_objects: ['bookable-object-uuid'],
    selected_slots: [
      {
        bookable_id: 'bookable-object-uuid',
        start_at: '2026-06-03 09:00:00',
        end_at: '2026-06-03 09:30:00',
      },
    ],
  }
  await bookable.assignBookables(requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/assignments',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('assignBookables() with guests: all and filters', async () => {
  const requestBody = {
    guests: 'all',
    filters: {
      status: 'confirmed',
      guest_group_id: 'guest-group-uuid',
    },
    bookable_group_id: 'bookable-group-uuid',
    selected_bookable_objects: ['bookable-object-uuid'],
    start_date: '2026-06-03',
    end_date: '2026-06-06',
  }
  await bookable.assignBookables(requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/assignments',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('assignBookables() rejects on 422 validation error', async () => {
  const response = new Response('{}', { status: 422 })
  apiMock.mockRejectedValueOnce(response)

  const requestBody = {
    guests: [],
    bookable_group_id: 'bookable-group-uuid',
    selected_bookable_objects: ['bookable-object-uuid'],
  }

  await expect(bookable.assignBookables(requestBody)).rejects.toBe(response)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/bookables/assignments',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})
