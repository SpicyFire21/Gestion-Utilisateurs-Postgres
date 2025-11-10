const pool = require('../database/db');

async function requireAuth(req, res, next) {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ error: 'Token manquant' });
        }

        // la requête c'est un lundi
        const result = await pool.query(
            `SELECT s.id AS session_id, s.date_expiration, s.actif AS session_active,
                    u.id AS user_id, u.email, u.nom, u.prenom, u.actif AS user_active
             FROM sessions s
             JOIN utilisateurs u ON s.utilisateur_id = u.id
             WHERE s.token = $1
               AND s.actif = TRUE
               AND s.date_expiration > NOW()
               AND u.actif = TRUE`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }

        req.user = {
            id: result.rows[0].user_id,
            email: result.rows[0].email,
            nom: result.rows[0].nom,
            prenom: result.rows[0].prenom
        };
        // on passe a autre, demain est un autre jour 🙏🙏
        next();
    } catch (error) {
        console.error('Erreur middleware auth:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

module.exports = { requireAuth };
