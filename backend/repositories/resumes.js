const { sql } = require("../config/db");

function requireSql() {
    if (!sql) throw new Error("DATABASE_URL is not configured");
    return sql;
}

async function findByUserId(userId) {
    const rows = await requireSql()`
        select * from public.resumes where user_id = ${userId} limit 1
    `;
    return rows[0] || null;
}

async function createForUser(userId) {
    const rows = await requireSql()`
        insert into public.resumes (user_id)
        values (${userId})
        on conflict (user_id) do update set user_id = public.resumes.user_id
        returning *
    `;
    return rows[0];
}

async function updateSection(userId, column, value) {
    const allowedColumns = [
        "contact",
        "education",
        "experience",
        "skills",
        "projects",
        "certifications",
        "summary",
        "is_completed"
    ];
    if (!allowedColumns.includes(column)) {
        throw new Error("Invalid resume column");
    }

    const db = requireSql();
    let parameter = value;
    let cast = "";
    if (typeof value === "object" && value !== null) {
        parameter = db.json(value);
        cast = "::jsonb";
    } else if (column === "is_completed") {
        cast = "::boolean";
    } else if (column === "summary") {
        cast = "::text";
    }

    const rows = await db.unsafe(
        `update public.resumes set ${column} = $1${cast}, updated_at = now()
         where user_id = $2
         returning *`,
        [parameter, userId]
    );
    return rows[0] || null;
}

function mapResume(row) {
    if (!row) return null;
    return {
        _id: row.id,
        id: row.id,
        userId: row.user_id,
        contact: row.contact,
        education: row.education,
        experience: row.experience,
        skills: row.skills,
        projects: row.projects,
        certifications: row.certifications,
        summary: row.summary,
        isCompleted: row.is_completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = { findByUserId, createForUser, updateSection, mapResume };
