-- 자동 발행 관련 컬럼 추가
-- 생성일: 2025-12-01

-- clients 테이블에 자동 발행 관련 컬럼 추가
ALTER TABLE clients ADD COLUMN auto_publish INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN publish_time TEXT DEFAULT '09:00';
ALTER TABLE clients ADD COLUMN publish_frequency TEXT DEFAULT 'daily';
ALTER TABLE clients ADD COLUMN business_type TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_auto_publish ON clients(auto_publish);
