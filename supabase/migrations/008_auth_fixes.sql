-- Fix profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Supabase client config config note:
-- const supabase = createClient(url, anonKey, {
--   auth: {
--     storage: window.localStorage,
--     storageKey: 's-network-auth-token',
--     autoRefreshToken: true,
--     persistSession: true,
--     detectSessionInUrl: true,
--     flowType: 'pkce'
--   }
-- });

-- Add missing RLS policies
DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;
CREATE POLICY "Public can view active businesses"
  ON businesses FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Vendor views own leads" ON leads;
CREATE POLICY "Vendor views own leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = leads.business_id
      AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles"
  ON profiles FOR SELECT USING (true);
