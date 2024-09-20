import { Api } from '../Api'
import { EmailTemplateInterface } from '../interfaces'

export const EmailTemplate = class {
  public eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  public async send(
    emailTemplateId: string,
    body: SendEmailTemplateInterface,
  ): Promise<void> {
    await Api.sendRequest(
      `/events/${this.eventId}/emails/email-templates/${emailTemplateId}/send`,
      {
        method: 'post',
        body: JSON.stringify(body),
      },
    )
  }

  public async list(): Promise<ListEmailTemplatesInterface> {
    return await Api.sendRequest(
      `/events/${this.eventId}/emails/email-templates`,
    )
  }
}

interface SendEmailTemplateInterface {
  guests: Array<string>
}

interface ListEmailTemplatesInterface {
  data: {
    emailTemplates: Array<EmailTemplateInterface>
  }
}
