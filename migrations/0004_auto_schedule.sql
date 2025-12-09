-- 클라이언트별 자동 발행 시간 설정 테이블
CREATE TABLE IF NOT EXISTS client_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  schedule_type TEXT NOT NULL CHECK(schedule_type IN ('morning', 'lunch', 'evening')),
  time TEXT NOT NULL,  -- HH:MM 형식
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE(client_id, schedule_type)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_client_schedules_client_id ON client_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_client_schedules_active ON client_schedules(is_active);
