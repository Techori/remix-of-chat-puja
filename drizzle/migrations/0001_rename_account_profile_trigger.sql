DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS create_account_profile ON auth.users;
CREATE TRIGGER create_account_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_account_profile();