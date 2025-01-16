export const Api = class {
  public static BASE_URL = 'https://airlst.app/api'
  public static API_KEY: string
  public static LOCALE: string = 'de-DE'

  public static setBaseURL(baseURL: string): void {
    this.BASE_URL = baseURL
  }

  public static setApiKey(companyApiKey: string): void {
    this.API_KEY = companyApiKey
  }

  public static setLocale(locale: string): void {
    this.LOCALE = locale
  }

  public static getRequestHeaders(): HeadersInit {
    return {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-api-key': this.API_KEY,
      'accept-language': this.LOCALE,
    }
  }

  public static async sendRequest(
    uri: string,
    options?: RequestInit,
  ): Promise<ResponseInterface> {
    const response = await fetch(this.BASE_URL + uri, {
      headers: {
        ...Api.getRequestHeaders(),
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw response
    }

    try {
      return await response.json()
    } catch {
      // If JSON parsing fails (empty body), just return
      return {} as ResponseInterface
    }
  }
}

interface ResponseInterface {
  data: any
  meta?: any
}

export interface PaginationInterface {
  per_page: number
  current_page: number
  total_pages: number
  total_entries: number
}
