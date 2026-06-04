-- Drop the auth trigger — profile creation is handled by the app instead
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
