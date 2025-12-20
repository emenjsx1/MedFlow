-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Create a new function that creates tenant, profile, settings and role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  user_name text;
BEGIN
  -- Get user name from metadata or use email
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Create a new tenant for this user
  INSERT INTO public.tenants (name, timezone)
  VALUES (user_name || '''s Clinic', 'America/Sao_Paulo')
  RETURNING id INTO new_tenant_id;
  
  -- Create profile for the user linked to the new tenant
  INSERT INTO public.profiles (id, email, full_name, tenant_id)
  VALUES (NEW.id, NEW.email, user_name, new_tenant_id);
  
  -- Assign admin role to the new user (they are the owner of their tenant)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  -- Create default tenant settings
  INSERT INTO public.tenant_settings (tenant_id)
  VALUES (new_tenant_id);
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();