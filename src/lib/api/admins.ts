import { api } from '../../api/client';
import type { TeamMember } from '../../api/types';

export async function fetchAdmins(): Promise<TeamMember[]> {
  return api.get<TeamMember[]>('/admin/team');
}

/** Owner only: creates the login directly (no more creating it in Supabase first). */
export async function addAdmin(input: { name: string; email: string; password: string }): Promise<TeamMember> {
  return api.post<TeamMember>('/admin/team', input);
}

/** Owner only. Takes effect on the member's very next request. */
export async function removeAdmin(id: string): Promise<void> {
  await api.delete(`/admin/team/${id}`);
}

/** Owner only. Signs the member out everywhere. */
export async function resetAdminPassword(id: string, password: string): Promise<void> {
  await api.put(`/admin/team/${id}/password`, { password });
}
