/*
 * ╔════════════════════════════════════════════╗
 * ║   S-Network — Emergency Admin Recovery     ║
 * ╚════════════════════════════════════════════╝
 *
 * Run this in Supabase Studio → SQL Editor if you ever lose admin access.
 *
 * Admin credentials after running:
 *   Email:    admin@snetwork.app
 *   Password: SNetwork@Admin2024!
 *
 * ⚠️  CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN via /admin/settings
 *
 * To make any existing user an admin by email:
 *   UPDATE profiles SET role = 'admin'
 *   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
 */

-- Reset admin password
UPDATE auth.users
SET encrypted_password = crypt('SNetwork@Admin2024!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'admin@snetwork.app';

-- Ensure profile role is admin
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@snetwork.app');

-- Verify
SELECT u.email, p.role, p.name
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE p.role = 'admin';
