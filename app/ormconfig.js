
const { DATABASE_URI } = process.env;

if (!DATABASE_URI) {
  throw new Error(`Missing env var DATABASE_URI`);
}

const SOURCE_PATH = (process.env.NODE_ENV === "production") ? "dist" : "src";

module.exports = {
  entities: [
    `${SOURCE_PATH}/**/**.entity{.ts,.js}`,
  ],
  logging: false,
  synchronize: false,
  type: "mongodb",
  url: DATABASE_URI,
  useNewUrlParser: true,
};
