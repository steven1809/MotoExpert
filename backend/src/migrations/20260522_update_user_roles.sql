-- Standardize user roles to "user"
UPDATE usuarios 
SET role = 'user' 
WHERE role IN ('usuario', 'cliente');
