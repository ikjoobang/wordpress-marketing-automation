# Cloudflare D1 수동 설정 가이드

## ⚠️ 현재 상황
- API 토큰에 D1 생성 권한 없음
- 대시보드에서 직접 생성 필요

---

## 🎯 Cloudflare 대시보드에서 D1 생성

### Step 1: D1 데이터베이스 생성

1. **Cloudflare 대시보드 접속**: https://dash.cloudflare.com
2. 좌측 메뉴에서 **Workers & Pages** 선택
3. 상단 탭에서 **D1 SQL Database** 클릭
4. **Create database** 버튼 클릭
5. **Database name** 입력: `webapp-production`
6. **Create** 버튼 클릭

### Step 2: Database ID 복사

생성 완료 후:
1. 생성된 데이터베이스 클릭
2. 우측 패널에서 **Database ID** 복사
   - 형식: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 3: wrangler.jsonc 업데이트

복사한 Database ID를 `/home/user/webapp/wrangler.jsonc`에 추가:

```jsonc
{
  "name": "webapp-2t1",
  "compatibility_date": "2025-11-24",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "여기에-복사한-ID-붙여넣기"
    }
  ]
}
```

### Step 4: 테이블 생성 (마이그레이션)

터미널에서:

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply webapp-production
```

이 명령은 `/home/user/webapp/migrations/` 폴더의 SQL 파일들을 실행합니다.

### Step 5: 확인

```bash
# 테이블 목록 확인
npx wrangler d1 execute webapp-production --command="SELECT name FROM sqlite_master WHERE type='table'"

# 예상 출력:
# - clients
# - contents
```

### Step 6: 재배포

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name webapp-2t1
```

### Step 7: Pages 프로젝트에 바인딩 연결

1. **Cloudflare 대시보드**: https://dash.cloudflare.com
2. **Workers & Pages** → `webapp-2t1` 선택
3. **Settings** → **Functions** 탭
4. **D1 database bindings** 섹션:
   - **Add binding** 클릭
   - Variable name: `DB`
   - D1 database: `webapp-production` 선택
   - **Save** 클릭

---

## ✅ 완료!

이제 프로덕션 URL에서 실제 워드프레스 발행이 작동합니다:
- https://c2e5ab55.webapp-2t1.pages.dev

---

## 📊 Database ID를 저한테 알려주시면

제가 wrangler.jsonc 업데이트와 마이그레이션, 재배포를 자동으로 해드리겠습니다!

복사한 Database ID만 알려주세요:
예: `12345678-1234-1234-1234-123456789abc`

