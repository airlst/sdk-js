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

test('generateTemporaryUploadUrl()', async () => {
  const signedUrlResponse = {
    data: {
      url: 'https://mock-storage-url.com/upload',
      uuid: 'mock-uuid',
      key: 'mock-key',
      bucket: 'mock-bucket',
    },
  }
  apiMock.mockResolvedValueOnce(signedUrlResponse)

  const result = await event.generateTemporaryUploadUrl(
    'event-uuid',
    'text/plain',
    true,
  )

  expect(apiMock).toHaveBeenCalledWith(
    `/events/event-uuid/signed-storage-url`,
    {
      method: 'put',
      body: JSON.stringify({
        visibility: 'private',
        content_type: 'text/plain',
      }),
    },
  )

  expect(result).toEqual(signedUrlResponse.data)
})

test('saveTemporaryUpload()', async () => {
  const temporaryUrlData = {
    url: 'https://mock-storage-url.com/upload',
    uuid: 'mock-uuid',
    key: 'mock-key',
    bucket: 'mock-bucket',
  }

  const attachmentResponse = {
    data: { attachment: { id: 1, name: 'test.txt' } },
  }
  apiMock.mockResolvedValueOnce(attachmentResponse)

  const result = await event.saveTemporaryUpload(
    'event-uuid',
    temporaryUrlData,
    'test.txt',
    123,
    'text/plain',
    true,
  )

  expect(apiMock).toHaveBeenCalledWith(
    `/events/event-uuid/create-temporary-upload`,
    {
      method: 'post',
      body: JSON.stringify({
        uuid: 'mock-uuid',
        key: 'mock-key',
        bucket: 'mock-bucket',
        name: 'test.txt',
        size: 123,
        content_type: 'text/plain',
        custom_properties: { visibility: 'private' },
      }),
    },
  )

  expect(result).toEqual(attachmentResponse)
})
