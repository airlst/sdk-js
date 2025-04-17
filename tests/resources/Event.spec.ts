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

test('saveTemporaryUpload()', async () => {
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

  const result = await event.saveTemporaryUpload(
    'event-uuid',
    file,
    'private',
    { type: 'avatar' },
  )

  expect(apiMock).toHaveBeenNthCalledWith(
    1,
    `/events/event-uuid/signed-storage-url`,
    {
      method: 'put',
      body: JSON.stringify({
        visibility: 'private',
        content_type: file.type,
      }),
    },
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
    `/events/event-uuid/create-temporary-upload`,
    {
      method: 'post',
      body: JSON.stringify({
        uuid: 'mock-uuid',
        key: 'mock-key',
        bucket: 'mock-bucket',
        name: file.name,
        size: file.size,
        content_type: file.type,
        custom_properties: { type: 'avatar' },
      }),
    },
  )

  expect(result).toEqual(attachmentResponse)
})
