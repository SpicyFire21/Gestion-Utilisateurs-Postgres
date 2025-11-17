const pool = require('../database/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function register({ email, password, nom, prenom })  {
    if (!email || !password) throw new Error('Email et mot de passe requis');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const exists = await client.query('SELECT id FROM utilisateurs WHERE email=$1', [email]);
        if (exists.rows.length > 0) throw new Error('Email déjà utilisé');
        const hash = await bcrypt.hash(password, 10);
        const user = await client.query(
            `INSERT INTO utilisateurs (email, password_hash, nom, prenom)
             VALUES ($1,$2,$3,$4)
                 RETURNING id,email,nom,prenom,date_creation`,
            [email, hash, nom || null, prenom || null]
        );
        await client.query(
            `INSERT INTO utilisateur_roles (utilisateur_id, role_id)
             VALUES ($1,(SELECT id FROM roles WHERE nom='user'))`,
            [user.rows[0].id]
        );
        await client.query('COMMIT');
        return { message: 'Utilisateur créé', user: user.rows[0] };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

async function login({ email, password }){
    if (!email || !password) throw new Error('Email et mot de passe requis');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const r = await client.query('SELECT * FROM utilisateurs WHERE email=$1', [email]);
        if (r.rows.length === 0) throw new Error('Email ou mot de passe incorrect');
        const u = r.rows[0];
        if (!u.actif) throw new Error('Utilisateur inactif');
        const match = await bcrypt.compare(password, u.password_hash);
        if (!match) throw new Error('Email ou mot de passe incorrect');
        const token = uuidv4();
        const exp = new Date(Date.now() + 24 * 3600 * 1000);
        await client.query(`INSERT INTO sessions(utilisateur_id,token,date_expiration) VALUES($1,$2,$3)`, [u.id, token, exp]);


        await client.query('COMMIT');
        return { message: 'Connexion réussie', token, user: { id: u.id, email: u.email, nom: u.nom, prenom: u.prenom }, expiresAt: exp };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

async function profile(userId){
    const r = await pool.query(
        `SELECT u.id,u.email,u.nom,u.prenom,array_agg(r.nom) AS roles
         FROM utilisateurs u
                  LEFT JOIN utilisateur_roles ur ON u.id=ur.utilisateur_id
                  LEFT JOIN roles r ON ur.role_id=r.id
         WHERE u.id=$1
         GROUP BY u.id,u.email,u.nom,u.prenom`,
        [userId]
    );
    return r.rows[0];
};

async function logout(user, token, req){
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE sessions SET actif=false WHERE token=$1`, [token]);
        await client.query(
            `INSERT INTO logs_connexion(utilisateur_id,email_tentative,date_heure,adresse_ip,user_agent,succes,message)
             VALUES($1,$2,NOW(),$3,$4,true,'Déconnexion réussie')`,
            [user.id, user.email, req.ip, req.headers['user-agent']]
        );
        await client.query('COMMIT');
        return { message: 'Déconnexion réussie' };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

async function deleteUser(id) {
    const r = await pool.query('DELETE FROM utilisateurs WHERE id=$1 RETURNING id,email,nom,prenom', [id]);
    if (r.rows.length === 0) throw new Error('Utilisateur non trouvé');
    return { message: 'Utilisateur supprimé', user: r.rows[0] };
};

async function getLogs(id){
    console.log(id)
    const res = await pool.query('SELECT * FROM logs_connexion WHERE utilisateur_id = $1 ORDER BY date_heure DESC LIMIT 50',[id])
    // if (res.rows.length === 0) throw new Error('Historique vide');
    return { message: 'Historique trouvé', user: res.rows };
}

module.exports = {
    register,
    login,
    deleteUser,logout,profile,getLogs
};