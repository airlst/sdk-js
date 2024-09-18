import { Api } from '../Api'
import { EmailTemplate, EventInterface } from '../interfaces'

export const Event = class {
  public async list(): Promise<ListResponseInterface> {
    return await Api.sendRequest('/companies/events')
  }

  public async get(uuid: string): Promise<GetResponseInterface> {
    return await Api.sendRequest(`/events/${uuid}`)
  }

  public async sendEmailTemplate(
    eventUuid: string,
    emailTemplateUuid: string,
    body: SendEmailTemplateInterface,
  ): Promise<void> {
    await Api.sendRequest(
      `/events/${eventUuid}/email-templates/${emailTemplateUuid}/send`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }
  public async getEmailTemplates(
    uuid: string,
  ): Promise<GetEmailTemplatesInterface> {
    return await Api.sendRequest(`/events/${uuid}/email-templates`)
  }
}

interface SendEmailTemplateInterface {
  guests: Array<string>
}

interface GetEmailTemplatesInterface {
  data: {
    emailTemplates: Array<EmailTemplate>
  }
}

interface ListResponseInterface {
  data: {
    events: Array<EventInterface>
  }
}

interface GetResponseInterface {
  data: {
    event: EventInterface
  }
}
