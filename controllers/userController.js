const userService = require('../services/userService');

exports.listUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const { totalUsers, users } = await userService.getUsers(page, limit);
        res.json({
            page,
            limit,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            users
        });
    } catch (error) {
        console.error('Erreur liste utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

exports.updateUser=async (req, res)=> {
    const { id } = req.params;
    const { nom, prenom, actif } = req.body;

    try {
        const updated = await userService.updateUser(id, nom, prenom, actif);
        if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ message: 'Utilisateur mis à jour', user: updated });
    } catch (error) {
        console.error('Erreur mise à jour utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

exports.deleteUser= async (req, res) =>{
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    try {
        const deleted = await userService.deleteUser(id);
        if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ message: 'Utilisateur supprimé', user: deleted });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

exports.getPermissions= async (req, res) => {
    const { id } = req.params;
    try {
        const permissions = await userService.getUserPermissions(id);
        res.json({ utilisateur_id: parseInt(id), permissions });
    } catch (error) {
        console.error('Erreur récupération permissions:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

exports.getUser = async (req,res) =>{
    const { id } = req.params;
    try {
        const data = await userService.getUser(id);
        res.json({ data: data });
    } catch (error) {
        console.error('Erreur récupération de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}