import { afterEach, test, expect, vi } from 'vitest'
import { Api, SecureLogin } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const secureLogin = new SecureLogin('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('issue()', async () => {
  await secureLogin.issue('guest-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/secure-login/issue',
    { method: 'post', body: '{"code":"guest-code"}' },
  )
})

test('issue() with nonce', async () => {
  await secureLogin.issue('guest-code', 'session-abc')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/secure-login/issue',
    { method: 'post', body: '{"code":"guest-code","nonce":"session-abc"}' },
  )
})

test('verify()', async () => {
  await secureLogin.verify('guest-code', '123456')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/secure-login/verify',
    { method: 'post', body: '{"code":"guest-code","otp":"123456"}' },
  )
})

test('verify() with nonce', async () => {
  await secureLogin.verify('guest-code', '123456', 'session-abc')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/secure-login/verify',
    {
      method: 'post',
      body: '{"code":"guest-code","otp":"123456","nonce":"session-abc"}',
    },
  )
})
