import { Api } from '../Api'
import { EmailTemplateInterface } from '../interfaces'

export const EmailTemplate = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public async send(
    emailTemplateId: string,
    body: SendEmailTemplateBodyInterface,
  ): Promise<SendEmailTemplateResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/emails/email-templates/${emailTemplateId}/send`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async list(): Promise<ListResponseInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/emails/email-templates`,
    )
  }
}

interface SendEmailTemplateBodyInterface {
  guests: Array<string>
}

interface SendEmailTemplateResponseInterface {}

interface ListResponseInterface {
  data: {
    emailTemplates: Array<EmailTemplateInterface>
  }
}
