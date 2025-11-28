import "dotenv/config";

interface PrismaConfig {
  schema: string;
  migrations: {
    path: string;
  };
  datasource: {
    url: string | undefined;
  };
}

const config: PrismaConfig = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
