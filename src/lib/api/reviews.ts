import { supabase } from '../supabase';
import type { Review } from '../../types';

interface ReviewRow {
    id: string;
    product_id: string;
    author: string;
    rating: number;
    comment: string;
    created_at: string;
}

function timeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

function mapReview(row: ReviewRow): Review {
    return {
        id: row.id,
        productId: row.product_id,
        author: row.author,
        rating: Number(row.rating),
        date: timeAgo(row.created_at),
        comment: row.comment,
    };
}

export async function fetchReviews(productId: string): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReview);
}

export async function createReview(input: { productId: string; author: string; rating: number; comment: string }): Promise<void> {
    const { error } = await supabase.from('reviews').insert({
        product_id: input.productId,
        author: input.author.trim(),
        rating: input.rating,
        comment: input.comment.trim(),
    });
    if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
}