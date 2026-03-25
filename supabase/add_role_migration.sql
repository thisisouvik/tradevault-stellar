-- Step 1: Add role column to existing profiles table
-- (Use IF NOT EXISTS to be safe if re-running)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'seller'
  CHECK (role IN ('seller', 'buyer', 'arbitrator'));

-- Step 2: Update the auto-create-profile trigger to store role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'seller')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      name  = EXCLUDED.name,
      email = EXCLUDED.email,
      role  = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure trigger is registered (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
