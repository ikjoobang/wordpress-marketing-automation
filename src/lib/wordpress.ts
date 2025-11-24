/**
 * WordPress REST API Client
 * 워드프레스 REST API와 통신하는 클라이언트 모듈
 */

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string; // Application Password
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status: 'publish' | 'draft' | 'pending' | 'future';
  author?: number;
  excerpt?: string;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  meta?: Record<string, any>;
}

export interface WordPressMedia {
  id: number;
  source_url: string;
  title: string;
  alt_text: string;
}

export class WordPressClient {
  private config: WordPressConfig;
  private authHeader: string;

  constructor(config: WordPressConfig) {
    this.config = config;
    // Basic Authentication with Application Password
    // UTF-8 안전한 Base64 인코딩
    const credentials = `${config.username}:${config.password}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(credentials);
    const base64 = btoa(String.fromCharCode(...data));
    this.authHeader = 'Basic ' + base64;
  }

  /**
   * API 요청을 보내는 헬퍼 메서드
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.siteUrl}/wp-json/wp/v2${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * 글 목록 조회
   */
  async getPosts(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    author?: number;
    categories?: number[];
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    return this.request(`/posts${query ? `?${query}` : ''}`);
  }

  /**
   * 단일 글 조회
   */
  async getPost(id: number) {
    return this.request(`/posts/${id}`);
  }

  /**
   * 새 글 작성
   */
  async createPost(post: WordPressPost) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  /**
   * 글 수정
   */
  async updatePost(id: number, post: Partial<WordPressPost>) {
    return this.request(`/posts/${id}`, {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  /**
   * 글 삭제
   */
  async deletePost(id: number, force: boolean = false) {
    return this.request(`/posts/${id}?force=${force}`, {
      method: 'DELETE',
    });
  }

  /**
   * 미디어 업로드 (이미지)
   */
  async uploadMedia(file: File | Blob, title: string, altText?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (altText) {
      formData.append('alt_text', altText);
    }

    const url = `${this.config.siteUrl}/wp-json/wp/v2/media`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Media Upload Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<WordPressMedia>;
  }

  /**
   * 이미지 URL로 미디어 업로드
   */
  async uploadMediaFromUrl(imageUrl: string, title: string, altText?: string) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return this.uploadMedia(blob, title, altText);
  }

  /**
   * 카테고리 목록 조회
   */
  async getCategories() {
    return this.request('/categories?per_page=100');
  }

  /**
   * 카테고리 생성
   */
  async createCategory(name: string, description?: string, parent?: number) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description, parent }),
    });
  }

  /**
   * 태그 목록 조회
   */
  async getTags() {
    return this.request('/tags?per_page=100');
  }

  /**
   * 태그 생성
   */
  async createTag(name: string, description?: string) {
    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  /**
   * 사이트 정보 조회
   */
  async getSiteInfo() {
    const url = `${this.config.siteUrl}/wp-json`;
    const response = await fetch(url);
    return response.json();
  }

  /**
   * 연결 테스트
   */
  async testConnection() {
    try {
      await this.getSiteInfo();
      await this.getPosts({ per_page: 1 });
      return { success: true, message: '워드프레스 연결 성공!' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '연결 실패' 
      };
    }
  }
}
