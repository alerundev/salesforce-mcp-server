declare module 'jsforce' {
  export interface QueryResult<T = Record<string, unknown>> {
    totalSize: number;
    done: boolean;
    records: T[];
  }

  export class Connection {
    constructor(options: { loginUrl?: string });
    login(username: string, password: string): Promise<{ id: string; organizationId: string }>;
    query<T = Record<string, unknown>>(soql: string): Promise<QueryResult<T>>;
    sobject(name: string): SObject;
  }

  export interface SObject {
    create(records: Record<string, unknown> | Record<string, unknown>[]): Promise<{ id: string; success: boolean }[]>;
  }
}
