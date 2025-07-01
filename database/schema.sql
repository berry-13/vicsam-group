-- ============================================================================
-- VICSAM GROUP PLATFORM - DATABASE SCHEMA
-- Sistema di autenticazione con gestione ruoli
-- ============================================================================

-- Estensioni PostgreSQL (opzionali, commentate per compatibilità MySQL/SQLite)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELLA UTENTI
-- ============================================================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_uuid (uuid),
    INDEX idx_users_active (is_active),
    INDEX idx_users_last_login (last_login_at)
);

-- Trigger to auto-generate UUID for users (compatible with MySQL < 8.0.13)
DELIMITER //
CREATE TRIGGER users_before_insert 
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
        SET NEW.uuid = UUID();
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- TABELLA RUOLI
-- ============================================================================
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_roles_name (name),
    INDEX idx_roles_system (is_system_role)
);

-- ============================================================================
-- TABELLA PERMESSI
-- ============================================================================
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_permissions_name (name),
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action)
);

-- ============================================================================
-- TABELLA ASSOCIAZIONE UTENTI-RUOLI
-- ============================================================================
CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by INTEGER,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Previene duplicati
    UNIQUE KEY uk_user_role (user_id, role_id),
    
    -- Indexes
    INDEX idx_user_roles_user (user_id),
    INDEX idx_user_roles_role (role_id),
    INDEX idx_user_roles_expires (expires_at)
);

-- ============================================================================
-- TABELLA ASSOCIAZIONE RUOLI-PERMESSI
-- ============================================================================
CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Previene duplicati
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    
    -- Indexes
    INDEX idx_role_permissions_role (role_id),
    INDEX idx_role_permissions_permission (permission_id)
);

-- ============================================================================
-- TABELLA SESSIONI UTENTE
-- ============================================================================
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(128) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    jwt_jti VARCHAR(128) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_session_id (session_id),
    INDEX idx_sessions_jti (jwt_jti),
    INDEX idx_sessions_active (is_active),
    INDEX idx_sessions_expires (expires_at),
    INDEX idx_sessions_ip (ip_address)
);

-- ============================================================================
-- TABELLA REFRESH TOKENS
-- ============================================================================
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    revoked_by INTEGER NULL,
    revoke_reason VARCHAR(255) NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_session (session_id),
    INDEX idx_refresh_tokens_hash (token_hash),
    INDEX idx_refresh_tokens_revoked (is_revoked),
    INDEX idx_refresh_tokens_expires (expires_at)
);

-- ============================================================================
-- TABELLA AUDIT LOG
-- ============================================================================
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NULL,
    session_id VARCHAR(128) NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NULL,
    resource_id VARCHAR(100) NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    success BOOLEAN NOT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_resource (resource),
    INDEX idx_audit_success (success),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_ip (ip_address)
);

-- ============================================================================
-- TABELLA CONFIGURAZIONE CHIAVI CRITTOGRAFICHE
-- ============================================================================
CREATE TABLE crypto_keys (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    key_id VARCHAR(50) UNIQUE NOT NULL,
    key_type ENUM('jwt_signing', 'jwt_verification', 'encryption', 'hmac') NOT NULL,
    algorithm VARCHAR(20) NOT NULL,
    public_key TEXT NULL,
    private_key_encrypted TEXT NULL,
    key_metadata JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    rotated_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_crypto_keys_id (key_id),
    INDEX idx_crypto_keys_type (key_type),
    INDEX idx_crypto_keys_active (is_active),
    INDEX idx_crypto_keys_expires (expires_at)
);

-- ============================================================================
-- INSERIMENTO DATI DI BASE
-- ============================================================================

-- Inserimento permessi di base
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('users.create', 'Creare Utenti', 'Permesso di creare nuovi utenti', 'users', 'create'),
('users.read', 'Leggere Utenti', 'Permesso di visualizzare utenti', 'users', 'read'),
('users.update', 'Modificare Utenti', 'Permesso di modificare utenti', 'users', 'update'),
('users.delete', 'Eliminare Utenti', 'Permesso di eliminare utenti', 'users', 'delete'),
('roles.create', 'Creare Ruoli', 'Permesso di creare nuovi ruoli', 'roles', 'create'),
('roles.read', 'Leggere Ruoli', 'Permesso di visualizzare ruoli', 'roles', 'read'),
('roles.update', 'Modificare Ruoli', 'Permesso di modificare ruoli', 'roles', 'update'),
('roles.delete', 'Eliminare Ruoli', 'Permesso di eliminare ruoli', 'roles', 'delete'),
('data.create', 'Creare Dati', 'Permesso di creare nuovi dati', 'data', 'create'),
('data.read', 'Leggere Dati', 'Permesso di leggere dati', 'data', 'read'),
('data.update', 'Modificare Dati', 'Permesso di modificare dati', 'data', 'update'),
('data.delete', 'Eliminare Dati', 'Permesso di eliminare dati', 'data', 'delete'),
('system.admin', 'Amministrazione Sistema', 'Accesso completo al sistema', 'system', 'admin');

-- Inserimento ruoli di base
INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
('admin', 'Amministratore', 'Accesso completo al sistema con tutti i permessi', '["*"]', TRUE),
('manager', 'Manager', 'Gestione utenti e dati con permessi limitati', '["users.read", "users.update", "data.*", "roles.read"]', TRUE),
('user', 'Utente Standard', 'Accesso base ai dati', '["data.read", "data.create"]', TRUE);

-- Associazione permessi ai ruoli
-- Admin - tutti i permessi
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin';

-- Manager - permessi limitati
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'manager' 
AND p.name IN ('users.read', 'users.update', 'data.create', 'data.read', 'data.update', 'roles.read');

-- User - permessi base
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'user' 
AND p.name IN ('data.create', 'data.read');

-- ============================================================================
-- VIEWS PER SEMPLIFICARE LE QUERY
-- ============================================================================

-- Vista per utenti con ruoli
CREATE VIEW user_with_roles AS
SELECT 
    u.id,
    u.uuid,
    u.email,
    u.first_name,
    u.last_name,
    u.is_active,
    u.is_verified,
    u.last_login_at,
    u.created_at,
    GROUP_CONCAT(r.name) as roles,
    GROUP_CONCAT(r.display_name) as role_names
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.uuid, u.email, u.first_name, u.last_name, u.is_active, u.is_verified, u.last_login_at, u.created_at;

-- Vista per permessi utente
CREATE VIEW user_permissions AS
SELECT DISTINCT
    u.id as user_id,
    u.email,
    p.name as permission,
    p.resource,
    p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = TRUE;

-- ============================================================================
-- STORED PROCEDURES E FUNZIONI
-- ============================================================================

-- Funzione per verificare permessi utente
DELIMITER //
CREATE FUNCTION user_has_permission(user_email VARCHAR(255), required_permission VARCHAR(100))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE permission_count INT DEFAULT 0;
    DECLARE sql_error TINYINT DEFAULT FALSE;
    
    -- Declare exception handler for SQL errors
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET sql_error = TRUE;
    END;
    
    -- Input validation: check for null or empty parameters
    IF user_email IS NULL OR TRIM(user_email) = '' THEN
        RETURN FALSE;
    END IF;
    
    IF required_permission IS NULL OR TRIM(required_permission) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Execute the permission check query with error handling
    SELECT COUNT(*) INTO permission_count
    FROM user_permissions
    WHERE email = user_email 
    AND (permission = required_permission OR permission = '*');
    
    -- If an SQL error occurred during the query, return FALSE
    IF sql_error = TRUE THEN
        RETURN FALSE;
    END IF;
    
    RETURN permission_count > 0;
END //
DELIMITER ;

-- Procedura per assegnare ruolo a utente
DELIMITER //
CREATE PROCEDURE assign_role_to_user(
    IN p_user_email VARCHAR(255),
    IN p_role_name VARCHAR(50),
    IN p_assigned_by_email VARCHAR(255),
    IN p_expires_at TIMESTAMP
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_role_id INT;
    DECLARE v_assigned_by_id INT;
    DECLARE v_exists INT DEFAULT 0;
    
    -- Trova user_id
    SELECT id INTO v_user_id FROM users WHERE email = p_user_email;
    
    -- Trova role_id
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    
    -- Trova assigned_by_id
    SELECT id INTO v_assigned_by_id FROM users WHERE email = p_assigned_by_email;
    
    -- Verifica se l'associazione esiste già
    SELECT COUNT(*) INTO v_exists 
    FROM user_roles 
    WHERE user_id = v_user_id AND role_id = v_role_id;
    
    -- Se non esiste, crea l'associazione
    IF v_exists = 0 THEN
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES (v_user_id, v_role_id, v_assigned_by_id, p_expires_at);
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS PER AUDIT E SICUREZZA
-- ============================================================================

-- Trigger per log delle modifiche utenti
DELIMITER //
CREATE TRIGGER audit_users_changes
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, resource, resource_id, details, success)
    VALUES (
        NEW.id,
        'user.update',
        'users',
        NEW.id,
        JSON_OBJECT(
            'old_email', OLD.email,
            'new_email', NEW.email,
            'old_active', OLD.is_active,
            'new_active', NEW.is_active
        ),
        TRUE
    );
END //
DELIMITER ;

-- Trigger per cleanup sessioni scadute
DELIMITER //
CREATE EVENT cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- Disattiva sessioni scadute
    UPDATE user_sessions 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    -- Revoca refresh token scaduti
    UPDATE refresh_tokens 
    SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = 'expired'
    WHERE expires_at < NOW() AND is_revoked = FALSE;
    
    -- Elimina audit log vecchi (oltre 1 anno)
    DELETE FROM audit_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END //
DELIMITER ;

-- Abilita l'event scheduler
SET GLOBAL event_scheduler = ON;

-- ============================================================================
-- INDICI AGGIUNTIVI PER PERFORMANCE
-- ============================================================================

-- Indici compositi per query comuni
-- Note: MySQL non supporta partial indexes, quindi creiamo indici completi
-- Le query dovranno filtrare attivamente per expires_at nei WHERE clause
CREATE INDEX idx_user_roles_composite ON user_roles (user_id, role_id, expires_at);

CREATE INDEX idx_sessions_user_active ON user_sessions (user_id, is_active, expires_at);

CREATE INDEX idx_refresh_tokens_active ON refresh_tokens (user_id, is_revoked, expires_at);

-- ============================================================================
-- COMMENTI FINALI
-- ============================================================================

-- Questo schema supporta:
-- 1. Autenticazione multi-fattore (pronto per estensioni)
-- 2. Gestione completa dei ruoli e permessi
-- 3. Audit trail completo
-- 4. Sessioni sicure con refresh token
-- 5. Gestione chiavi crittografiche
-- 6. Performance ottimizzate con indici appropriati
-- 7. Cleanup automatico dei dati scaduti
-- 8. Sicurezza attraverso triggers e constraints

-- Per utilizzare questo schema:
-- 1. Creare il database: CREATE DATABASE vicsam_auth;
-- 2. Eseguire questo script
-- 3. Configurare l'applicazione per connettersi al database
-- 4. Implementare i servizi di autenticazione nell'applicazione
