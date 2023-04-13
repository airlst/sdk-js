import { afterEach, test, expect, vi } from 'vitest'
import { Api, Guest } from '../src'

const apiMock = (Api.sendRequest = vi.fn())

const guest = new Guest('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('validateCode()', async () => {
  guest.validateCode('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/guests/validate-code',
    { method: 'post', body: '{"code":"guest-code"}' }
  )
})

test('get()', async () => {
  guest.get('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code')
})

test('update()', async () => {
  guest.update('guest-code', { a: 'b' })

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/guests/guest-code', {
    method: 'put',
    body: '{"a":"b"}',
  })
})
