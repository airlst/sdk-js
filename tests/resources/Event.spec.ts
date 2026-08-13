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

test('get() exposes the event timezone', async () => {
  // Every datetime the API emits is an absolute UTC instant, so consumers need the event timezone to
  // render them and to convert a picked wall-clock time back before sending it (AIRLST-5311).
  apiMock.mockResolvedValueOnce({
    data: { event: { id: 'abc', timezone: 'Europe/Berlin' } },
  })

  const response = await event.get('abc')

  expect(response.data.event.timezone).toBe('Europe/Berlin')
})

test('get() exposes the sub-event counts', async () => {
  // Every event object reports whether it is a parent of sub-events and how many it has
  // (AIRLST-5445). Sub-event details come from SubEvent.list().
  apiMock.mockResolvedValueOnce({
    data: { event: { id: 'abc', is_parent: true, sub_events_count: 3 } },
  })

  const response = await event.get('abc')

  expect(response.data.event.is_parent).toBe(true)
  expect(response.data.event.sub_events_count).toBe(3)
})

test('generateTemporaryUploadUrl()', async () => {
  const signedUrlResponse = {
    data: {
      url: 'https://mock-storage-url.com/upload',
      uuid: 'mock-uuid',
      key: 'mock-key',
      bucket: 'mock-bucket',
      headers: {
        Host: ['mock-storage-url.com'],
        'x-amz-acl': ['private'],
        'Content-Type': 'application/octet-stream',
      },
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
