declare module 'jsforce' {
  export interface QueryResult<T = Record<string, unknown>> {
    totalSize: number;
    done: boolean;
    records: T[];
  }

  export interface SObject {
    create(records: Record<string, unknown>[]): Promise<{ id: string; success: boolean }[]>;
  }

  export class Connection {
    constructor(options: { loginUrl?: string });
    login(username: string, password: string): Promise<{ id: string; organizationId: string }>;
    query<T = Record<string, unknown>>(soql: string): Promise<QueryResult<T>>;
    sobject(name: string): SObject;
  }

  const pkg: { Connection: typeof Connection };
  export default pkg;
}
