import { test, expect } from 'vitest'
import { Api } from '../src'

test('setBaseURL()', () => {
  expect(Api.BASE_URL).toBe('https://airlst.app/api')

  Api.setBaseURL('https://abc.com')

  expect(Api.BASE_URL).toBe('https://abc.com')
})

test('setCompanyApiKey()', () => {
  expect(Api.API_KEY).toBeUndefined()

  Api.setApiKey('abc')

  expect(Api.API_KEY).toBe('abc')
})

test('getRequestHeaders()', () => {
  Api.setApiKey('abc')

  expect(Api.getRequestHeaders()).toStrictEqual({
    'content-type': 'application/json',
    accept: 'application/json',
    'x-api-key': 'abc',
  })
})

test('sendRequest()', async () => {
  Api.setApiKey('abc')

  fetch.mockResponse(JSON.stringify({ data: { a: 'b' } }))
  const response = await Api.sendRequest('/whatever')

  expect(response.data).toStrictEqual({ a: 'b' })
  expect(fetch.requests().length).toEqual(1)
  expect(fetch.requests()[0].url).toEqual(Api.BASE_URL + '/whatever')

  const headers = Array.from(fetch.requests()[0].headers.entries())
  expect(headers.length).toEqual(3)
  expect(Api.getRequestHeaders()).toStrictEqual(
    headers.reduce((carry, item) => {
      carry[item[0]] = item[1]
      return carry
    }, {}),
  )
})

test('sendRequest() throws exception', async () => {
  Api.setApiKey('abc')

  fetch.mockResponse('{}', { status: 400, ok: false })

  try {
    await Api.sendRequest('/')
  } catch (response) {
    expect(response.status).toEqual(400)
  }
})
