
declare namespace NodeJS {
  interface ProcessEnv {
    //User-defined
    PORT?: number;
    CLIENT?: string;

    //SQL Specific
    POSTGRES_SERVER_USER: string;
    POSTGRES_SERVER_PASSWORD: string;
    POSTGRES_SERVER_DATABASE: string;
    POSTGRES_SERVER_HOST: string;
  }
}