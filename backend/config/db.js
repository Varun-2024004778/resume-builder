const postgresModule = require("postgres");
const postgres = postgresModule.default || postgresModule;

const connectionString = process.env.DATABASE_URL;
const sql = connectionString
    ? postgres(connectionString, { ssl: "require", prepare: false })
    : null;

const connectDB = async () => {
    try {
        if (!sql) {
            throw new Error("DATABASE_URL is not configured");
        }

        await sql`select 1`;
        console.log("✅ Supabase PostgreSQL Connected Successfully");
    } catch (error) {
        console.error("❌ Supabase PostgreSQL Connection Failed");
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
module.exports.sql = sql;
