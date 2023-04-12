export interface EventInterface {
  uuid: string
  name: object
  extended_fields: object
  locales: Array<LocaleInterface>
  default_locale: LocaleInterface
  additional_locales: Array<LocaleInterface>
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
  extended_fields: object
}
