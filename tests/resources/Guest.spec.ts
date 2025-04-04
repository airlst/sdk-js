import { afterEach, test, expect, vi } from 'vitest'
import { Api, Guest } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const guest = new Guest('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('list()', async () => {
  guest.list({
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
    `/events/event-uuid/guests?${expectedQuery}`,
  )
})

test('validateCode()', async () => {
  guest.validateCode('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/validate-code',
    { method: 'post', body: '{"code":"guest-code"}' },
  )
})

test('get()', async () => {
  guest.get('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code')
})

test('create()', async () => {
  guest.create({ a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests', {
    method: 'post',
    body: '{"a":"b"}',
  })
})

test('createCompanion()', async () => {
  guest.createCompanion('guest-code', { a: 'b' })

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
  guest.update('guest-code', { a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code', {
    method: 'put',
    body: '{"a":"b"}',
  })
})

test('archive()', async () => {
  guest.archive('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/archive',
    { method: 'put' },
  )
})

test('restore()', async () => {
  guest.restore('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/restore',
    { method: 'put' },
  )
})

test('delete()', async () => {
  guest.delete('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code', {
    method: 'delete',
  })
})

test('checkin()', async () => {
  const requestBody = {
    type: Guest.CheckinType.CHECK_IN,
    timestamp: 2024,
  }

  guest.checkin('guest-code', requestBody)

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
  guest.createRecommendation('guest-code', { a: 'b' })

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
  guest.getAttachments('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/attachments',
  )
})

test('attachFile()', async () => {
  const file = new File(['file content'], 'test.txt', { type: 'text/plain' })

  const signedUrlResponse = {
    data: {
      url: 'https://mock-storage-url.com/upload',
      uuid: 'mock-uuid',
      key: 'mock-key',
      bucket: 'mock-bucket',
    },
  }
  apiMock.mockResolvedValueOnce(signedUrlResponse)

  global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

  const attachmentResponse = {
    data: { attachment: { id: 1, name: file.name } },
  }
  apiMock.mockResolvedValueOnce(attachmentResponse)

  const result = await guest.attachFile('guest-code', file)

  expect(apiMock).toHaveBeenNthCalledWith(
    1,
    `/events/${guest.eventId}/signed-storage-url`,
  )

  expect(global.fetch).toHaveBeenCalledWith(
    'https://mock-storage-url.com/upload',
    {
      method: 'put',
      body: file,
    },
  )

  expect(apiMock).toHaveBeenNthCalledWith(
    2,
    `/events/${guest.eventId}/guests/guest-code/attachments`,
    {
      method: 'post',
      body: JSON.stringify({
        uuid: 'mock-uuid',
        key: 'mock-key',
        bucket: 'mock-bucket',
        name: file.name,
        size: file.size,
        content_type: file.type,
      }),
    },
  )

  expect(result).toEqual(attachmentResponse)
})
