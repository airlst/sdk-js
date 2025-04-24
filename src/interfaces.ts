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
  reservations: Array<ReservationInterface>
}

export interface BookingInterface {
  extended_fields: object
}

export interface ContactInterface {
  code: string
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

export interface EmailTemplateInterface {
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
}

export interface AttachmentInterface {
  file_name: string
  uuid: string
  preview_url: string
  original_url: string
  extension: string
  size: number
  visibility: string
  key: string
}

export interface BookableGroupInterface {
  id: string
  name: string
  type: string
  description: string
  create_reservation_on_checkin: boolean
  max_number_of_reservations: number
}

export interface CarBookableInterface {
  id: string
  name: string
  description: string
  code: string
  make: string
  model: string
  year: number
  color: string
  license_plate: string
  fuel_type: string
  extended_fields: object
  bookable_group: BookableGroupInterface
  reservations: Array<ReservationInterface>
}

export interface ReservationInterface {
  id: string
  starts_at: string
  ends_at: string
  guest: GuestInterface
  bookable: CarBookableInterface
}

export interface AvailabilityInterface {
  starts_at: string
  ends_at: string
  buffer_time: number
  min: number
  max: number
}
