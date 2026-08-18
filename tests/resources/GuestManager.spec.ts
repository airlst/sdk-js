import { afterEach, test, expect, vi } from 'vitest'
import { Api, GuestManager } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const guestManager = new GuestManager('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('list()', async () => {
  guestManager.list({
    page: 'p',
    perPage: 'pp',
    search: 's',
    filters: [
      { field: 'ff1', operator: 'fo1', value: 'fv1' },
      { field: 'ff2', value: 'fv2' },
    ],
    sorts: [
      { field: 'sf1', order: 'so1', direction: 'sd1' },
      { field: 'sf2', direction: 'sd2' },
    ],
  })

  const expectedQuery =
    'page=p&per_page=pp&filters%28ff1*fo1%29=fv1&filters%28ff2*eq%29=fv2&sorts%28sf1*so1%29=sd1&sorts%28sf2*0%29=sd2&search=s'

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    `/events/event-uuid/guests/guest-managers?${expectedQuery}`,
  )
})

test('validateCode()', async () => {
  guestManager.validateCode('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/validate-code',
    { method: 'post', body: '{"code":"guest-code"}' },
  )
})

test('get()', async () => {
  guestManager.get('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code')
})

test('create()', async () => {
  guestManager.create({ a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests', {
    method: 'post',
    body: '{"a":"b","role":"guest_manager"}',
  })
})

test('create() with contact_id', async () => {
  guestManager.create({ status: 'confirmed', contact_id: 'contact-uuid' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests', {
    method: 'post',
    body: '{"status":"confirmed","contact_id":"contact-uuid","role":"guest_manager"}',
  })
})

test('create() with contact_code', async () => {
  guestManager.create({ status: 'confirmed', contact_code: 'QOI1U9GX' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests', {
    method: 'post',
    body: '{"status":"confirmed","contact_code":"QOI1U9GX","role":"guest_manager"}',
  })
})

test('update()', async () => {
  guestManager.update('guest-code', { a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code', {
    method: 'put',
    body: '{"a":"b"}',
  })
})

test('archive()', async () => {
  guestManager.archive('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/archive',
    { method: 'put' },
  )
})

test('restore()', async () => {
  guestManager.restore('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/restore',
    { method: 'put' },
  )
})

test('delete()', async () => {
  guestManager.delete('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code', {
    method: 'delete',
  })
})

test('checkin()', async () => {
  const requestBody = {
    type: GuestManager.CheckinType.CHECK_IN,
    timestamp: 2024,
  }

  guestManager.checkin('guest-code', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/checkins',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('getAttachments()', async () => {
  guestManager.getAttachments('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/attachments',
  )
})

test('getAttachmentSignedUrl()', async () => {
  guestManager.getAttachmentSignedUrl('guest-code', 'attachment-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/attachments/attachment-uuid/url',
  )
})

test('listSubEvents()', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      sub_events: [
        {
          id: 'sub-event-uuid',
          name: 'Product Summit Europe',
          starts_at: '2027-05-03T09:00:00.000000Z',
          ends_at: '2027-05-03T17:00:00.000000Z',
          registration_mode: 'invitation_only',
          released_at: '2026-08-20T08:00:00.000000Z',
          booked: 7,
          limit: 20,
          remaining: 13,
        },
      ],
    },
  })

  const subEvents = await guestManager.listSubEvents('guest-manager-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-managers/guest-manager-uuid/sub-events',
  )
  expect(subEvents).toHaveLength(1)
  expect(subEvents[0].booked).toBe(7)
  expect(subEvents[0].limit).toBe(20)
  expect(subEvents[0].remaining).toBe(13)
})

test('listSubEvents() reports an unlimited manager dimension', async () => {
  // The manager owns no quota row on this sub-event, so limit and remaining are
  // null — but the usage is still reported (AIRLST-5446).
  apiMock.mockResolvedValueOnce({
    data: {
      sub_events: [
        {
          id: 'sub-event-uuid',
          name: 'Service Summit Europe',
          starts_at: '2027-05-04T09:00:00.000000Z',
          ends_at: '2027-05-04T17:00:00.000000Z',
          registration_mode: 'invitation_only',
          released_at: '2026-08-20T08:00:00.000000Z',
          booked: 2,
          limit: null,
          remaining: null,
        },
      ],
    },
  })

  const subEvents = await guestManager.listSubEvents('guest-manager-uuid')

  expect(subEvents[0].booked).toBe(2)
  expect(subEvents[0].limit).toBeNull()
  expect(subEvents[0].remaining).toBeNull()
})

test('assignGuestSubEvents()', async () => {
  guestManager.assignGuestSubEvents('guest-manager-uuid', 'guest-code', [
    'sub-event-uuid-1',
    'sub-event-uuid-2',
  ])

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-managers/guest-manager-uuid/guests/guest-code/sub-events',
    {
      method: 'post',
      body: JSON.stringify({
        sub_event_ids: ['sub-event-uuid-1', 'sub-event-uuid-2'],
      }),
    },
  )
})

test('assignGuestSubEvents() with participation extended fields', async () => {
  guestManager.assignGuestSubEvents(
    'guest-manager-uuid',
    'guest-code',
    ['sub-event-uuid-1'],
    { 'sub-event-uuid-1': { shirt_size: 'M' } },
  )

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-managers/guest-manager-uuid/guests/guest-code/sub-events',
    {
      method: 'post',
      body: JSON.stringify({
        sub_event_ids: ['sub-event-uuid-1'],
        extended_fields: { 'sub-event-uuid-1': { shirt_size: 'M' } },
      }),
    },
  )
})

test('assignGuestSubEvents() returns waitlisted participations and overlap warnings', async () => {
  apiMock.mockResolvedValueOnce({
    data: {
      participations: [
        {
          id: 'participation-uuid',
          sub_event_id: 'sub-event-uuid-1',
          status: 'waitlisted',
        },
      ],
      overlap_warnings: [
        { sub_event_ids: ['sub-event-uuid-1', 'sub-event-uuid-2'] },
      ],
    },
  })

  const { data } = await guestManager.assignGuestSubEvents(
    'guest-manager-uuid',
    'guest-code',
    ['sub-event-uuid-1'],
  )

  expect(data.participations[0].status).toBe('waitlisted')
  expect(data.overlap_warnings[0].sub_event_ids).toHaveLength(2)
})

test('promoteSubEventParticipation()', async () => {
  guestManager.promoteSubEventParticipation(
    'guest-manager-uuid',
    'participation-uuid',
    'confirmed',
  )

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guest-managers/guest-manager-uuid/participations/participation-uuid/promote',
    {
      method: 'post',
      body: JSON.stringify({ status: 'confirmed' }),
    },
  )
})
