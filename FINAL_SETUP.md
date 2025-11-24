# 🎯 최종 설정 및 배포 가이드

## ✅ 완료된 작업

1. ✅ D1 Production 데이터베이스 생성: `webapp-production`
2. ✅ Database ID 설정: `8805fe70-936c-4e83-bb3f-9884ccc0c9ed`
3. ✅ wrangler.jsonc 업데이트 완료
4. ✅ 프로젝트 빌드 완료 (dist/ 생성)

---

## 🚀 이제 해야 할 것

### Step 1: Cloudflare Pages에서 D1 바인딩 추가

1. **Cloudflare 대시보드**: https://dash.cloudflare.com
2. **Workers & Pages** → `webapp` 프로젝트 선택
3. **Settings** 탭 → **Functions** 클릭
4. **D1 database bindings** 섹션에서:
   - **Add binding** 버튼 클릭
   - Variable name: `DB`
   - D1 database: `webapp-production` 선택
   - **Save** 클릭

### Step 2: Production D1에 테이블 생성 (마이그레이션)

**방법 A: 로컬에서 실행 (API 토큰 필요)**

터미널에서:

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply webapp-production
```

**방법 B: Cloudflare 대시보드에서 직접 실행**

1. **Workers & Pages** → **D1 SQL Database** 탭
2. `webapp-production` 클릭
3. **Console** 탭 클릭
4. 아래 SQL을 복사해서 실행:

```sql
-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  wordpress_url TEXT NOT NULL,
  wordpress_username TEXT NOT NULL,
  wordpress_password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contents table
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT,
  status TEXT DEFAULT 'draft',
  wordpress_post_id INTEGER,
  image_url TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contents_client_id ON contents(client_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);
```

### Step 3: 재배포 (선택사항)

이미 빌드가 완료되었으므로, Cloudflare Pages는 다음 push 시 자동 배포됩니다.

수동 배포를 원하시면:

```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name webapp-2t1
```

---

## ✅ 완료 후 테스트

### 1. 프로덕션 URL 접속

https://c2e5ab55.webapp-2t1.pages.dev

또는

https://webapp-2t1.pages.dev

### 2. 업체 등록

- **이름**: Studio JUAI
- **워드프레스 URL**: https://studiojuai.co.kr
- **사용자명**: [워드프레스 관리자 계정]
- **비밀번호**: [Application Password]

### 3. 콘텐츠 생성 및 발행

1. **콘텐츠 생성** 버튼 클릭
2. 키워드 입력: "AI 디자인 스튜디오"
3. 이미지 생성 체크
4. 생성 완료 후 **워드프레스 발행** 클릭
5. https://studiojuai.co.kr 에서 실제 게시물 확인!

### 4. 블로그 꾸미기

1. **블로그 꾸미기** 탭
2. 업체 선택: Studio JUAI
3. 테마/색상 변경
4. studiojuai.co.kr에서 실제 변경 확인

---

## 🎉 최종 목표 달성!

```
✅ D1 Production 데이터베이스 생성
✅ 프로덕션 환경 설정 완료
✅ 빌드 완료

다음 단계:
→ D1 바인딩 추가 (1분)
→ 테이블 생성 (1분)
→ 테스트 시작!
```

---

## 📊 시스템 구성도

```
사용자
  ↓
Cloudflare Pages (webapp-2t1.pages.dev)
  ↓
Hono API (Cloudflare Workers)
  ↓
D1 Database (webapp-production)
  ↓
WordPress REST API (studiojuai.co.kr)
```

---

## 🔧 문제 해결

### Q: D1 바인딩을 추가했는데도 오류가 나요
A: Pages 프로젝트를 재배포하거나, 설정 저장 후 1-2분 기다려주세요.

### Q: 테이블이 생성되지 않았어요
A: Console에서 `SELECT name FROM sqlite_master WHERE type='table'` 실행해서 확인하세요.

### Q: 워드프레스 발행이 안 돼요
A: 
1. Application Password가 올바른지 확인
2. studiojuai.co.kr/wp-json/wp/v2/posts 접근 가능한지 확인
3. 브라우저 콘솔(F12)에서 오류 메시지 확인

---

## 📞 완료 후 알려주세요!

D1 바인딩과 테이블 생성 완료 후, 실제 테스트 결과를 공유해주세요!
