-- 콘텐츠 이미지 테이블 (본문 내 섹션별 이미지 저장)
CREATE TABLE IF NOT EXISTS content_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  image_data TEXT NOT NULL,  -- base64 이미지 데이터
  alt_text TEXT,
  position INTEGER DEFAULT 0,  -- 본문 내 순서
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_images_content_id ON content_images(content_id);
