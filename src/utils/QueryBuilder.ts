export interface QueryParameters {
  page?: string
  perPage?: string
  search?: string
  filters?: Array<{
    field: string
    operator?: string
    value: string
  }>
  sorts?: Array<{
    field: string
    order?: string
    direction: string
  }>
}

export class QueryBuilder {
  public static buildQuery(parameters: QueryParameters): Record<string, string> {
    const filters = parameters.filters?.reduce(
      (carry, { field, operator, value }) => {
        carry[`filters(${field}*${operator || 'eq'})`] = value
        return carry
      },
      {} as Record<string, string>,
    )

    const sorts = parameters.sorts?.reduce(
      (carry, { field, order, direction }) => {
        carry[`sorts(${field}*${order || '0'})`] = direction
        return carry
      },
      {} as Record<string, string>,
    )

    const query: Record<string, string> = {
      page: parameters.page || '1',
      per_page: parameters.perPage || '25',
      ...filters,
      ...sorts,
    }

    if (parameters.search) {
      query['search'] = parameters.search
    }

    return query
  }

  public static buildQueryString(parameters: QueryParameters): string {
    const query = this.buildQuery(parameters)
    return new URLSearchParams(query).toString()
  }
}
