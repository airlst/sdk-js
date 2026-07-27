import { Api } from '../Api'
import { ContactInterface, EventInterface } from '../interfaces'

export const Contact = class {
  public async validateCode(
    code: string,
  ): Promise<ValidateCodeResponseInterface> {
    return await Api.sendRequest('/companies/contacts/validate-code', {
      method: 'post',
      body: JSON.stringify({ code: code }),
    })
  }

  public async get(code: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/companies/contacts/${code}`)
  }

  public async getEvents(code: string): Promise<GetEventsResponseInterface> {
    return await Api.sendRequest(`/companies/contacts/${code}/events`)
  }

  public async update(
    code: string,
    body: UpdateBodyInterface,
  ): Promise<UpdateResponseInterface> {
    return await Api.sendRequest(`/companies/contacts/${code}`, {
      method: 'put',
      body: JSON.stringify(body),
    })
  }
}

interface ValidateCodeResponseInterface {
  data: {
    valid: boolean
  }
}

interface GetResponseInterface {
  data: {
    contact: ContactInterface
  }
}

interface GetEventsResponseInterface {
  data: {
    events: Array<EventInterface>
  }
}

export interface UpdateBodyInterface {
  contact: UpdateContactInterface
}

// Writable contact fields for PUT /companies/contacts/{code}. Every field is
// optional: the endpoint does a partial merge, overwriting native fields that
// are present and merging extended_fields key by key. Distinct from the
// response ContactInterface, which also carries read-only fields (code,
// full_name) that this endpoint does not accept.
export interface UpdateContactInterface {
  sex?: string
  title?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  company_name?: string
  job_title?: string
  address_line_1?: string
  address_line_2?: string
  zip?: string
  city?: string
  country?: string
  extended_fields?: object
}

interface UpdateResponseInterface {
  data: {
    contact: ContactInterface
  }
}
