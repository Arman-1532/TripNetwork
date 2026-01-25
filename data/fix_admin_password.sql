-- Update admin password to known hash for 'password123'
UPDATE user 
SET password_hash = '$2b$10$ksmi8QMJTGSKP4GWaXCEcuPJ9vl03BpWPQcHCzawPyFhr6Xs9P8nm' 
WHERE email = 'admin1@tripnetwork.com';
