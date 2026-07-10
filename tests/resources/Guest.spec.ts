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

test('list() with guest_manager_id', async () => {
  guest.list({
    page: 'p',
    perPage: 'pp',
    search: 's',
    guest_manager_id: 'manager-123',
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
    'page=p&per_page=pp&filters%28ff1*fo1%29=fv1&filters%28ff2*eq%29=fv2&sorts%28sf1*so1%29=sd1&sorts%28sf2*0%29=sd2&search=s&guest_manager_id=manager-123'

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

test('updateGuests()', async () => {
  const body = { guests: ['ABCD1234', 'ABCD2345'], status: 'confirmed' }
  guest.updateGuests(body)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests', {
    method: 'put',
    body: JSON.stringify(body),
  })
})

test('updateGuests() with "all" and filters', async () => {
  const body = {
    guests: 'all',
    filters: { status: 'invited' },
    status: 'confirmed',
  }
  guest.updateGuests(body)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests', {
    method: 'put',
    body: JSON.stringify(body),
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

test('getAttachmentSignedUrl()', async () => {
  guest.getAttachmentSignedUrl('guest-code', 'attachment-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/guest-code/attachments/attachment-uuid/url',
  )
})

test('uploadImportFile()', async () => {
  const signedUrlResponse = {
    data: {
      url: 'https://mock-storage-url.com/upload',
      uuid: 'mock-uuid',
      key: 'mock-key',
      bucket: 'mock-bucket',
      headers: {
        Host: ['mock-storage-url.com'],
        'x-amz-acl': ['private'],
        'Content-Type': 'application/octet-stream',
      },
    },
  }
  apiMock.mockResolvedValueOnce(signedUrlResponse)
  fetch.mockResponseOnce('')

  const key = await guest.uploadImportFile('file-contents', 'text/csv')

  // Signed storage url requested through Api (Event.generateTemporaryUploadUrl)
  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/signed-storage-url',
    {
      method: 'put',
      body: JSON.stringify({ visibility: 'private', content_type: 'text/csv' }),
    },
  )

  // Raw bytes PUT directly to the signed url with the flattened headers
  expect(fetch.requests().length).toEqual(1)
  const request = fetch.requests()[0]
  expect(request.url).toEqual('https://mock-storage-url.com/upload')
  expect(request.method).toEqual('PUT')
  expect(request.headers.get('x-amz-acl')).toEqual('private')
  expect(request.headers.get('content-type')).toEqual(
    'application/octet-stream',
  )

  // Resolves to the private key to hand to guessImportFields / processImport
  expect(key).toEqual('mock-key')
})

test('guessImportFields()', async () => {
  const body = {
    file: 'tmp/mock-key',
    first_row_as_header: true,
    role: Guest.ImportRole.AUTO,
  }

  guest.guessImportFields(body)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/import/guess-fields',
    { method: 'post', body: JSON.stringify(body) },
  )
})

test('processImport()', async () => {
  const body = {
    file: 'tmp/mock-key',
    first_row_as_header: true,
    mapped_fields: ['contact:first_name', null, 'contact:email'],
    action: Guest.ImportAction.CREATE,
    defaults: { 'guest:status': 'confirmed' },
    marketing_opt_in_setting: Guest.MarketingOptInSetting.NOT_PRESENT,
  }

  guest.processImport(body)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/import', {
    method: 'post',
    body: JSON.stringify(body),
  })
})

test('getImport()', async () => {
  guest.getImport('import-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/import/import-uuid',
  )
})
