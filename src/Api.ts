export const Api = class {
  public static BASE_URL: string = 'https://airlst.app/api';
  public static COMPANY_API_KEY: string;

  public static setBaseURL(baseURL: string): void {
    this.BASE_URL = baseURL;
  }

  public static setCompanyApiKey(companyApiKey: string): void {
    this.COMPANY_API_KEY = companyApiKey;
  }

  public static getRequestHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Company-Api-Token': this.COMPANY_API_KEY,
    }
  }
}
