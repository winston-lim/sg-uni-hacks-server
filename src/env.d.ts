declare namespace NodeJS {
  interface ProcessEnv {
    NOTION_API_TOKEN: string;
    NOTION_DATABASE_ID: string;
    SENDGRID_API_KEY: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
    ADMIN_PASSWORD: string;
    CORS_ORIGIN: string;
  }
}