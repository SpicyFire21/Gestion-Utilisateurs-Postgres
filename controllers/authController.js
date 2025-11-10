const authService = require('../services/authService');

exports.register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Erreur création utilisateur:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        console.error('Erreur login:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.profile = async (req, res) => {
    try {
        const result = await authService.profile(req.user.id);
        res.json({ user: result });
    } catch (err) {
        console.error('Erreur profil:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.logout = async (req, res) => {
    try {
        const result = await authService.logout(req.user, req.headers['authorization'], req);
        res.json(result);
    } catch (err) {
        console.error('Erreur logout:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const result = await authService.deleteUser(req.params.id);
        res.json(result);
    } catch (err) {
        console.error('Erreur suppression utilisateur:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
