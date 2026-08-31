import { supabase } from '../supabase';

export interface AdminUser {
  userId: string;
  name: string;
  createdAt: string;
}

export async function fetchAdmins(): Promise<AdminUser[]> {
  const { data, error } = await supabase.from('admins').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []).map((row) => ({ userId: row.user_id, name: row.name, createdAt: row.created_at }));
}

/** The currently logged-in admin's own user id — used to stop someone removing their own access by mistake. */
export async function getCurrentUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export async function addAdmin(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('admins').insert({ user_id: userId.trim(), name: name.trim() });
  if (error) throw error;
}

export async function removeAdmin(userId: string): Promise<void> {
  const { error } = await supabase.from('admins').delete().eq('user_id', userId);
  if (error) throw error;
}
