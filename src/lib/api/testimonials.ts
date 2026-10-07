import { api } from '../../api/client';
import type { Testimonial } from '../../types';

/** Storefront: enabled testimonials. */
export async function fetchTestimonials(): Promise<Testimonial[]> {
  return api.get<Testimonial[]>('/testimonials');
}

export async function fetchAdminTestimonials(): Promise<Testimonial[]> {
  return api.get<Testimonial[]>('/admin/testimonials');
}

export interface TestimonialInput {
  image: string;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createTestimonial(input: TestimonialInput): Promise<void> {
  await api.post('/admin/testimonials', input);
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<void> {
  await api.put(`/admin/testimonials/${id}`, input);
}

export async function deleteTestimonial(id: string): Promise<void> {
  await api.delete(`/admin/testimonials/${id}`);
}
