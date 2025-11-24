-- Make project_id nullable in contents table
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Create new table with nullable project_id
CREATE TABLE IF NOT EXISTS contents_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER, -- NOW NULLABLE
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status TEXT CHECK(status IN ('draft', 'scheduled', 'published', 'failed')) DEFAULT 'draft',
  scheduled_at DATETIME,
  published_at DATETIME,
  wordpress_post_id INTEGER,
  featured_image_url TEXT,
  categories TEXT,
  tags TEXT,
  keywords TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO contents_new SELECT * FROM contents;

-- Drop old table
DROP TABLE contents;

-- Rename new table
ALTER TABLE contents_new RENAME TO contents;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_contents_client_id ON contents(client_id);
CREATE INDEX IF NOT EXISTS idx_contents_project_id ON contents(project_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_scheduled_at ON contents(scheduled_at);
