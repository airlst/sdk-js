import { afterEach, test, expect, vi } from 'vitest'
import { Api, Guest } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const guest = new Guest('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('list()', async () => {
  guest.list({
    filters: [
      { field: 'ff1', operator: 'fo1', value: 'fv1' },
      { field: 'ff2', value: 'fv2' },
    ],
    sorts: [
      { field: 'sf1', order: 'so1', direction: 'sd1' },
      { field: 'sf2', direction: 'sd2' },
    ],
    search: 's',
    page: 'p',
  })

  const expectedQuery =
    'search=s&page=p&filters%28ff1*fo1%29=fv1&filters%28ff2*eq%29=fv2&sorts%28sf1*so1%29=sd1&sorts%28sf2*0%29=sd2'

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
