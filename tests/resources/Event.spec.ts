import { afterEach, test, expect, vi } from 'vitest'
import { Api, Event } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const event = new Event()

afterEach(() => {
  vi.restoreAllMocks()
})

test('list()', async () => {
  event.list()

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/companies/events')
})

test('get()', async () => {
  event.get('abc')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/abc')
})

test('sendEmailTemplate()', async () => {
  const requestBody = {
    guests: ['ABC123', 'DEF456'],
  }
  event.sendEmailTemplate('event-uuid', 'email-template-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/email-templates/email-template-uuid/send',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('getEmailTemplates()', async () => {
  event.getEmailTemplates('event-uuid')

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/email-templates')
})
