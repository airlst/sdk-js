import { Api } from '../Api'
import { ContactInterface, EventInterface } from '../interfaces'

export const Contact = class {
  public async validateCode(
    code: string
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
