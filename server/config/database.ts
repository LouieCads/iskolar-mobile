import { Sequelize } from "sequelize";
import config from "./config";

const env = process.env.NODE_ENV || "development";
const dbConfig = (config as any)[env];

const pool = { max: 20, min: 2, acquire: 30000, idle: 10000 };

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      pool,
    })
  : new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      port: Number(process.env.DB_PORT) || 5432,
      dialect: "postgres",
      logging: false,
      pool,
    });

export default sequelize;
