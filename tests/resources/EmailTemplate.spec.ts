import { afterEach, test, expect, vi } from 'vitest'
import { Api, EmailTemplate } from '../../src'

const apiMock = (Api.sendRequest = vi.fn())

const emailTemplate = new EmailTemplate('event-uuid')

afterEach(() => {
  vi.restoreAllMocks()
})

test('send()', async () => {
  const requestBody = {
    guests: ['ABC123', 'DEF456'],
  }
  emailTemplate.send('email-template-uuid', requestBody)

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith(
    '/events/event-uuid/email-templates/email-template-uuid/send',
    {
      method: 'post',
      body: JSON.stringify(requestBody),
    },
  )
})

test('list()', async () => {
  emailTemplate.list()

  expect(apiMock).toHaveBeenCalledTimes(1)
  expect(apiMock).toHaveBeenCalledWith('/events/event-uuid/email-templates')
})