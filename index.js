const express = require('express');
const pool = require('./database/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes')
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users',userRoutes)

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.status(200).json({
            status: 'ok',
            timestamp: result.rows[0].now
        });
    } catch (err) {
        console.error('❌ Erreur lors du test de connexion 😱:', err);
        res.status(500).json({
            status: 'error',
            message: 'Impossible de se connecter à la base de données'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT} `);
});
