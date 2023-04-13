# WIP

## Installation

```bash
yarn add @airlst/sdk
```

## Usage

Set Company API key

```javascript
import { Api } from '@airlst/sdk'

Api.setCompanyApiKey('YOUR_COMPANY_API_KEY')
```

## Methods

Currently available methods:

### Event methods

#### Get all company events

```javascript
import { Event } from '@airlst/sdk'

const { data } = await new Event().list()
```

#### Get single event with UUID

```javascript
import { Event } from '@airlst/sdk'

const { data } = await new Event().get('event-uuid')
```

### Guest methods

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

#### Update existing guest

```javascript
import { Guest } from '@airlst/sdk'

const { data } = await new Guest('event-uuid').update('guest-code', { status: 'confirmed' })
```
