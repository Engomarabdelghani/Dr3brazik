import { supabase } from '../supabase';
import type { Testimonial } from '../../types';

interface TestimonialRow {
  id: string;
  image: string;
  sort_order: number;
  is_enabled: boolean;
}

function mapTestimonial(row: TestimonialRow): Testimonial {
  return { id: row.id, image: row.image, sortOrder: row.sort_order, isEnabled: row.is_enabled };
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase.from('testimonials').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapTestimonial);
}

export interface TestimonialInput {
  image: string;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createTestimonial(input: TestimonialInput): Promise<void> {
  const { error } = await supabase.from('testimonials').insert({
    image: input.image, sort_order: input.sortOrder, is_enabled: input.isEnabled,
  });
  if (error) throw error;
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<void> {
  const { error } = await supabase.from('testimonials').update({
    image: input.image, sort_order: input.sortOrder, is_enabled: input.isEnabled,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}
