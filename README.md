# WIP

## Installation

```bash
yarn add @airlst/sdk
```

## Usage

Set API key

```javascript
import { Api } from '@airlst/sdk'

Api.setApiKey('YOUR_API_KEY')
```

## Methods

Currently available methods:

### Event methods

#### Get all company events

> **Important:** This method requires that API key must be company bound!

```javascript
import { Event } from '@airlst/sdk'

const { data } = await new Event().list()
```

#### Get single event with UUID

```javascript
import { Event } from '@airlst/sdk'

const { data } = await new Event().get('event-uuid')
```

#### Create temporary upload which can be attached to a guest extended field using upload uuid

```javascript
import { Guest } from '@airlst/sdk'

await new Event().saveTemporaryUpload(eventUuid, file, 'public-read', {type:"avatar"});
```

### Guest methods

#### List all guests

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').list({ page: 2, search: 'John' })
```

Method accepts following parameters:

| Parameter            | Type     | Description                                                                                                                                                                                                                                  |
|----------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `page`               | `number` | Page number                                                                                                                                                                                                                                  |
| `perPage`            | `number` | Number of items per page                                                                                                                                                                                                                     |
| `search`             | `string` | Quick search                                                                                                                                                                                                                                 |
| `filters`            | `array`  | Filters arrays                                                                                                                                                                                                                               |
| `filters.*.field`    | `string` | Filter field e.g: `extended_fields->field1`, `booking:extended_fields->field1`                                                                                                                                                               |
| `filters.*.value`    | `string` | Filter field value                                                                                                                                                                                                                           |
| `filters.*.operator` | `string` | Filter field operator. Optional. One of: `eq` (equal), `neq` (not equal), `like`, `gt` (greater than), `gte` (greater than or equal), `lt` (less than), `lte` (less than or equal). If operator is not provided `eq` will be used as default |
| `sorts`              | `array`  | Sorts array                                                                                                                                                                                                                                  |
| `sorts.*.field`      | `string` | Sort field                                                                                                                                                                                                                                   |
| `sorts.*.direction`  | `string` | Sort field direction. One of: `asc` (ascending), `desc` (descending)                                                                                                                                                                         |
| `sorts.*.order`      | `number` | Sort field order. Optional. Defines order/priority of the sort when sorting by multiple fields                                                                                                                                               |

#### Validate guest code

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').validatedCode('guest-code')
```

#### Get guest with code

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').get('guest-code')
```

#### Create a new guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').create({
  status: 'confirmed',
  contact: {
    first_name: 'John',
    last_name: 'Doe',
  }
})
```

#### Create a new companion guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').createCompanion('guest-code', {
  contact: {
    first_name: 'John',
    last_name: 'Doe',
  }
})
```

#### Update existing guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').update('guest-code', { status: 'confirmed' })
```

#### Archive guest

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').archive('guest-code')
```

#### Restore an archived guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').restore('guest-code')
```

#### Delete guest

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').delete('guest-code')
```

#### Check in a guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').checkin('guest-code', {
  type: Guest.CheckinType.CHECK_IN,
  device: 'Mobile',
  location: 'Munich',
  timestamp: Math.round(+new Date() / 1000),
})
```

#### Create recommendation

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').createRecommendation('guest-code', {
    status: 'confirmed',
    contact: {
      first_name: 'John',
      last_name: 'Doe',
    }
  })
```

### Email Template methods

#### Retrieve all email templates for the event

```javascript
import { EmailTemplate } from '@airlst/sdk'

const { data } = await new EmailTemplate('event-uuid').list()
```

#### Send email template to selected guests

```javascript
import { EmailTemplate } from '@airlst/sdk'

await new EmailTemplate('event-uuid').send('email-template-uuid',{
  guests:[
    "guest-code-1",
    "guest-code-2"
    ]
})
```
### Contact methods

#### Validate guest code

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().validateCode('contact-code')
```

#### Get contact with code

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().get('contact-code')
```

#### Get events for the contact

```javascript
import { Contact } from '@airlst/sdk'

const { data } = await new Contact().getEvents('contact-code')
```

#### Get all guest attachments

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').getAttachments('guest-code')
```

#### Get attachment signed downloadable URL
**Note:** The generated URL will be valid for **10 minutes**

```javascript
import { Guest } from '@airlst/sdk'

await new Guest('event-uuid').getAttachmentSignedUrl('guest-code','attachment-uuid')
```
### Bookables methods

#### Get list of bookable groups

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listGroups()
```

#### Get list of bookable objects for group

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listBookables('bookable-group-uuid')
```

#### Get list of availabilities for bookable object

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').listAvailabilities('bookable-group-uuid', 'bookable-object-uuid', {
  start_date: '2025-01-02',
  end_date: '2025-02-03'
})
```

#### Create reservation

```javascript
import { Bookable } from '@airlst/sdk'

const { data } = await new Bookable('event-uuid').createReservation('bookable-group-uuid', {
    guest_code: 'guest-code',
    reservations: [
      {
        starts_at: '2025-02-04 13:20:00',
        ends_at: '2025-02-04 13:40:00',
        bookable_id: 'bookable-object-uuid'
      }
    ]
})
```

#### Delete reservation

```javascript
import { Bookable } from '@airlst/sdk'

await new Bookable('event-uuid').deleteReservation('guest-code', 'reservation-uuid')
```
