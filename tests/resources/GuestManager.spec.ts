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
    body: '{"a":"b"}',
  })
})

test('createCompanion()', async () => {
  guestManager.createCompanion('guest-code', { a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/companions',
    {
      method: 'post',
      body: '{"a":"b"}',
    },
  )
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

test('createRecommendation()', async () => {
  guestManager.createRecommendation('guest-code', { a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/recommendations',
    {
      method: 'post',
      body: '{"a":"b"}',
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
