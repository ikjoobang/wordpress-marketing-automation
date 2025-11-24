/**
 * Database Schema Types
 * Cloudflare D1 데이터베이스 스키마 정의
 */

export interface Client {
  id: number;
  name: string;
  description?: string;
  wordpress_url: string;
  wordpress_username: string;
  wordpress_password: string; // Application Password (encrypted)
  openai_api_key?: string; // (encrypted)
  system_prompt?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Project {
  id: number;
  client_id: number;
  name: string;
  description?: string;
  category_id?: number;
  keywords?: string; // JSON array
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: number;
  project_id: number;
  client_id: number;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string;
  published_at?: string;
  wordpress_post_id?: number;
  featured_image_url?: string;
  categories?: string; // JSON array
  tags?: string; // JSON array
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  client_id: number;
  project_id?: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  time: string; // HH:MM format
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  client_id: number;
  action: string;
  details?: string;
  status: 'success' | 'error';
  created_at: string;
}

export interface KeywordPool {
  id: number;
  project_id: number;
  keyword: string;
  used_at?: string;
  rotation_cycle_days: number;
  created_at: string;
}
