export interface EventInterface {
  id: string
  name: object
  extended_fields: object
  locales: Array<LocaleInterface>
  default_locale: LocaleInterface
  additional_locales: Array<LocaleInterface>
  registration_type: string
}

export interface LocaleInterface {
  id: string
  code: string
  label: string
}

export interface GuestInterface {
  code: string
  role: string
  status: string
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
