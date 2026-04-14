declare module 'jsforce' {
  export interface QueryResult<T = Record<string, unknown>> {
    totalSize: number;
    done: boolean;
    records: T[];
  }

  export interface SObject {
    create(records: Record<string, unknown>[]): Promise<{ id: string; success: boolean }[]>;
  }

  export interface OAuth2Options {
    loginUrl?: string;
    clientId?: string;
    clientSecret?: string;
  }

  export interface ConnectionOptions {
    loginUrl?: string;
    version?: string;
    oauth2?: OAuth2Options;
  }

  export class Connection {
    constructor(options: ConnectionOptions);
    login(username: string, password: string): Promise<{ id: string; organizationId: string }>;
    query<T = Record<string, unknown>>(soql: string): Promise<QueryResult<T>>;
    sobject(name: string): SObject;
  }

  const pkg: { Connection: typeof Connection };
  export default pkg;
}
