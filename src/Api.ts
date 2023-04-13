export const Api = class {
  public static BASE_URL = 'https://airlst.app/api'
  public static COMPANY_API_KEY: string

  public static setBaseURL(baseURL: string): void {
    this.BASE_URL = baseURL
  }

  public static setCompanyApiKey(companyApiKey: string): void {
    this.COMPANY_API_KEY = companyApiKey
  }

  public static getRequestHeaders(): HeadersInit {
    return {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-company-api-key': this.COMPANY_API_KEY,
    }
  }

  public static async sendRequest(uri: string,options?: RequestInit): Promise<ResponseInterface> {
    const response = await fetch(this.BASE_URL + uri, {
      headers: {...Api.getRequestHeaders(), ...options?.headers},
      ...options,
    })

    if (!response.ok) {
      throw response
    }

    return await response.json()
  }
}

interface ResponseInterface {
  data: any
  meta?: any
}
