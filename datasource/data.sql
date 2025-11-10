DROP TABLE IF EXISTS logs_connexion CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS utilisateur_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;


CREATE TABLE IF NOT EXISTS utilisateurs
(
    id                SERIAL PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash     TEXT         NOT NULL,
    nom               VARCHAR(100),
    prenom            VARCHAR(100),
    actif             BOOLEAN   DEFAULT TRUE,
    date_creation     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles
(
    id            SERIAL PRIMARY KEY,
    nom           VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions
(
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL UNIQUE,
    ressource   VARCHAR(100) NOT NULL,
    action      VARCHAR(100) NOT NULL,
    description TEXT,
    CONSTRAINT unique_ressource_action UNIQUE (ressource, action)
);


CREATE TABLE IF NOT EXISTS utilisateur_roles
(
    utilisateur_id   INT NOT NULL,
    role_id          INT NOT NULL,
    date_assignation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (utilisateur_id, role_id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_permissions
(
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS sessions
(
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INT          NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    date_creation   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP    NOT NULL,
    actif           BOOLEAN   DEFAULT TRUE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs_connexion
(
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INT     NULL,
    email_tentative VARCHAR(255),
    date_heure      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adresse_ip      VARCHAR(45),
    user_agent      TEXT,
    succes          BOOLEAN NOT NULL,
    message         TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE SET NULL
);

INSERT INTO roles (nom, description)
VALUES ('admin', 'Administrateur avec tous les droits'),
       ('moderator', 'Modérateur de contenu'),
       ('user', 'Utilisateur standard');

INSERT INTO permissions (nom, ressource, action, description)
VALUES ('read_users', 'users', 'read', 'Lire les utilisateurs'),
       ('write_users', 'users', 'write', 'Créer/modifier des utilisateurs'),
       ('delete_users', 'users', 'delete', 'Supprimer des utilisateurs'),
       ('read_posts', 'posts', 'read', 'Lire les posts'),
       ('write_posts', 'posts', 'write', 'Créer/modifier des posts'),
       ('delete_posts', 'posts', 'delete', 'Supprimer des posts');
CREATE INDEX idx_utilisateurs_email ON utilisateurs (email);
CREATE INDEX idx_utilisateurs_actif ON utilisateurs (actif);


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON TRUE
WHERE r.nom = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON p.nom IN ('read_users', 'read_posts', 'write_posts', 'delete_posts')
WHERE r.nom = 'moderator';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON p.nom IN ('read_users', 'read_posts', 'write_posts')
WHERE r.nom = 'user';


CREATE OR REPLACE FUNCTION utilisateur_a_permission(
    p_utilisateur_id INT,
    p_ressource VARCHAR,
    p_action VARCHAR
)
    RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT TRUE
    INTO has_permission
    FROM utilisateurs u
             JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
             JOIN role_permissions rp ON ur.role_id = rp.role_id
             JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_utilisateur_id
      AND u.actif = TRUE
      AND p.ressource = p_ressource
      AND p.action = p_action
    LIMIT 1;

    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

SELECT
    u.id,
    u.email,
    u.nom,
    u.prenom,
    array_agg(r.nom) AS roles
FROM utilisateurs u
         JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
         JOIN roles r ON ur.role_id = r.id
WHERE u.id = 1
GROUP BY u.id, u.email, u.nom, u.prenom;


SELECT DISTINCT
    u.id AS utilisateur_id,
    u.email,
    p.nom AS permission,
    p.ressource,
    p.action
FROM utilisateurs u
         JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id;

SELECT
    r.nom AS role,
    COUNT(ur.utilisateur_id) AS nombre_utilisateurs
FROM roles r
         LEFT JOIN utilisateur_roles ur ON r.id = ur.role_id
GROUP BY r.nom
ORDER BY nombre_utilisateurs DESC;

SELECT
    u.id,
    u.email,
    array_agg(r.nom) AS roles
FROM utilisateurs u
         JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
         JOIN roles r ON ur.role_id = r.id
WHERE r.nom IN ('admin', 'moderator')
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT r.nom) = 2;

SELECT
    DATE(date_heure) AS jour,
    COUNT(*) AS tentatives_echouees
FROM logs_connexion
WHERE succes = false
  AND date_heure >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(date_heure)
ORDER BY jour DESC;