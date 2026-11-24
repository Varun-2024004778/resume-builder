require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const postgresModule = require("postgres");
const postgres = postgresModule.default || postgresModule;

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not configured");
    }

    const sql = postgres(process.env.DATABASE_URL, {
        ssl: "require",
        connect_timeout: 15,
        prepare: false
    });

    try {
        const connection = await sql`
            select current_database() as database,
                   current_user as username,
                   version() as version
        `;
        console.log(JSON.stringify(connection[0], null, 2));

        const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "001_initial.sql");
        await sql.unsafe(fs.readFileSync(migrationPath, "utf8"));

        const tables = await sql`
            select table_name
            from information_schema.tables
            where table_schema = 'public'
              and table_name in ('users', 'resumes')
            order by table_name
        `;

        console.log(JSON.stringify({
            migration: "applied",
            tables: tables.map((table) => table.table_name)
        }, null, 2));
    } finally {
        await sql.end({ timeout: 5 });
    }
}

main().catch((error) => {
    console.error(JSON.stringify({
        error: error.message,
        code: error.code || null
    }, null, 2));
    process.exit(1);
});
