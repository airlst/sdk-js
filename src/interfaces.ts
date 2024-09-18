export interface EventInterface {
  id: string
  name: object
  extended_fields: object
  locales: Array<LocaleInterface>
  default_locale: LocaleInterface
  additional_locales: Array<LocaleInterface>
  registration_type: string
}

interface LocaleInterface {
  id: string
  code: string
  label: string
}

export interface GuestInterface {
  code: string
  role: string
  status: string
  extended_fields: object
  booking: BookingInterface
  contact: ContactInterface
}

export interface BookingInterface {
  extended_fields: object
}

export interface ContactInterface {
  sex: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name: string
  job_title: string
  address_line_1: string
  address_line_2: string
  zip: string
  city: string
  country: string
  extended_fields: object
}

interface Attachment {
  id: string
  model_type: string
  model_id: string
  uuid: string
  collection_name: string
  name: string
  file_name: string
  mime_type: string
  disk: string
  conversions_disk: string
  size: number
  manipulations: Array<any>
  custom_properties: {
    locale: string
    custom_headers: Array<any>
  }
  generated_conversions: Array<any>
  responsive_images: Array<any>
  order_column: number
  created_at: string
  updated_at: string
  original_url: string
  preview_url: string
}

interface Attachments {
  [locale: string]: Array<Attachment>
}

interface CalendarEvent {
  id: string
  name: {
    [locale: string]: string
  }
  description: {
    [locale: string]: string
  }
  starts_at: string
  ends_at: string
  timezone: string
  address: string
  url: string
  organizer_name: string
  organizer_email: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: {
    [locale: string]: string
  }
  sender_name: {
    [locale: string]: string
  }
  bcc: string
  reply_to: string
  preview: {
    [locale: string]: string
  }
  html: {
    [locale: string]: string
  }
  json: {
    [locale: string]: string
  }
  booking_status_hook: string
  uses_wallet_ticket: boolean
  uses_pdf_ticket: boolean
  uses_calendar_event: boolean
  sender_identity_id: string
  attachments: Attachments
  calendarEvent: CalendarEvent
}
