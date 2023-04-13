import { afterEach, test, expect, vi } from 'vitest'
import { Api, Event } from '../src'

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
