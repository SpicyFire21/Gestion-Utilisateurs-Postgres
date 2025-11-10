const pool = require('../database/db');

async function getUsers(page, limit) {
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM utilisateurs');
    const totalUsers = parseInt(countResult.rows[0].count);

    const usersResult = await pool.query(
        `SELECT u.id, u.email, u.nom, u.prenom, u.date_creation,
                array_agg(r.nom) AS roles
         FROM utilisateurs u
                  LEFT JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
                  LEFT JOIN roles r ON ur.role_id = r.id
         GROUP BY u.id, u.email, u.nom, u.prenom, u.date_creation
         ORDER BY u.id
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return { totalUsers, users: usersResult.rows };
}

async function updateUser(id, nom, prenom, actif) {
    const result = await pool.query(
        `UPDATE utilisateurs
         SET nom = $1,
             prenom = $2,
             actif = $3,
             date_modification = NOW()
         WHERE id = $4
         RETURNING id, email, nom, prenom, actif, date_modification`,
        [nom || null, prenom || null, actif !== undefined ? actif : true, id]
    );
    return result.rows[0] || null;
}

async function deleteUser(id) {
    const result = await pool.query(
        `DELETE FROM utilisateurs
         WHERE id = $1
         RETURNING id, email, nom, prenom`,
        [id]
    );
    return result.rows[0] || null;
}

async function getUserPermissions(id) {
    const result = await pool.query(
        `SELECT DISTINCT p.nom, p.ressource, p.action, p.description
         FROM utilisateurs u
                  INNER JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
                  INNER JOIN roles r ON ur.role_id = r.id
                  INNER JOIN role_permissions rp ON r.id = rp.role_id
                  INNER JOIN permissions p ON rp.permission_id = p.id
         WHERE u.id = $1`,
        [id]
    );
    return result.rows;
}

module.exports = {
    getUsers,
    updateUser,
    deleteUser,
    getUserPermissions
};
