const { sql } = require("../config/db");

function requireSql() {
    if (!sql) throw new Error("DATABASE_URL is not configured");
    return sql;
}

async function findByEmail(email) {
    const rows = await requireSql()`
        select * from public.users where email = ${email} limit 1
    `;
    return rows[0] || null;
}

async function findById(id) {
    const rows = await requireSql()`
        select * from public.users where id = ${id} limit 1
    `;
    return rows[0] || null;
}

async function create({ name, email, password }) {
    const rows = await requireSql()`
        insert into public.users (name, email, password_hash)
        values (${name}, ${email}, ${password})
        returning *
    `;
    return rows[0];
}

async function setResetToken(id, hashedToken, expires) {
    await requireSql()`
        update public.users
        set reset_password_token = ${hashedToken},
            reset_password_expires = ${expires},
            updated_at = now()
        where id = ${id}
    `;
}

async function clearResetToken(id, hashedToken) {
    await requireSql()`
        update public.users
        set reset_password_token = null,
            reset_password_expires = null,
            updated_at = now()
        where id = ${id} and reset_password_token = ${hashedToken}
    `;
}

async function findValidResetToken(hashedToken) {
    const rows = await requireSql()`
        select *
        from public.users
        where reset_password_token = ${hashedToken}
          and reset_password_expires > now()
        limit 1
    `;
    return rows[0] || null;
}

async function consumeResetToken(id, hashedToken, passwordHash) {
    const rows = await requireSql()`
        update public.users
        set password_hash = ${passwordHash},
            reset_password_token = null,
            reset_password_expires = null,
            token_version = token_version + 1,
            updated_at = now()
        where id = ${id}
          and reset_password_token = ${hashedToken}
          and reset_password_expires > now()
        returning *
    `;
    return rows[0] || null;
}

module.exports = {
    findByEmail,
    findById,
    create,
    setResetToken,
    clearResetToken,
    findValidResetToken,
    consumeResetToken
};
