import { afterEach, test, expect, vi } from 'vitest'
import { Api, Contact } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const contact = new Contact()

afterEach(() => {
  vi.restoreAllMocks()
})

test('validateCode()', async () => {
  contact.validateCode('contact-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/companies/contacts/validate-code', {
    method: 'post',
    body: '{"code":"contact-code"}',
  })
})

test('get()', async () => {
  contact.get('contact-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/companies/contacts/contact-code')
})

test('getEvents()', async () => {
  contact.getEvents('contact-code')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/companies/contacts/contact-code/events',
  )
})
