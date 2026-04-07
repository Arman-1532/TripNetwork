-- Insert standard admin user
-- Password is 'password123' (hash taken from previous user output or generated)
INSERT INTO user (name, email, phone, password_hash, role, status)
VALUES ('System Admin', 'admin1@tripnetwork.com', '0000000000', '$2b$10$aMsNKiab74wQHNNXdahFSuNk7X77E7JxoaC0SAgcQGx9VM0J/fpz2', 'ADMIN', 'ACTIVE');