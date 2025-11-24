# 워드프레스 발행을 실제로 작동시키는 단계별 가이드

## ⚠️ 현재 상황
- 개발 서버: DNS 오류로 워드프레스 접근 불가
- 프로덕션: D1 바인딩 없어서 데이터 저장 불가
- **결론: 양쪽 모두 실제 발행은 안 됨**

---

## 🎯 해결 방법: Cloudflare D1 Production 설정

### Step 1: D1 Production 데이터베이스 생성

```bash
# Cloudflare 계정 로그인
npx wrangler login

# Production D1 데이터베이스 생성
npx wrangler d1 create webapp-production

# 출력 예시:
# ✅ Successfully created DB 'webapp-production'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "webapp-production"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 2: wrangler.jsonc 업데이트

생성된 `database_id`를 복사해서 `wrangler.jsonc`에 추가:

```jsonc
{
  "name": "webapp-2t1",
  "compatibility_date": "2025-11-24",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "여기에-실제-ID-붙여넣기"
    }
  ]
}
```

### Step 3: Production 마이그레이션 실행

```bash
# Production D1에 테이블 생성
npx wrangler d1 migrations apply webapp-production

# 확인
npx wrangler d1 execute webapp-production --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 4: 재배포

```bash
# 빌드
npm run build

# Cloudflare Pages에 배포
npx wrangler pages deploy dist --project-name webapp-2t1
```

### Step 5: Cloudflare 대시보드에서 바인딩 확인

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → `webapp-2t1` 선택
3. **Settings** → **Functions** 탭
4. **D1 database bindings** 섹션 확인:
   - Variable name: `DB`
   - D1 database: `webapp-production`
   - ✅ 자동으로 추가되어 있어야 함

---

## ✅ 완료 후 테스트

### 1. 프로덕션 URL에서 업체 등록

```
URL: https://c2e5ab55.webapp-2t1.pages.dev

업체 정보:
- 이름: Studio JUAI
- 워드프레스 URL: https://studiojuai.co.kr
- 사용자명: [워드프레스 관리자 계정]
- 비밀번호: [Application Password]
```

### 2. 콘텐츠 생성 및 발행

1. **콘텐츠 생성** 버튼 클릭
2. 키워드 입력: "AI 디자인 스튜디오 소개"
3. 이미지 생성 체크
4. **콘텐츠 생성** 실행
5. 생성 완료 후 **워드프레스 발행** 버튼 클릭
6. studiojuai.co.kr에서 실제 게시물 확인

### 3. 블로그 꾸미기 테스트

1. **블로그 꾸미기** 탭 클릭
2. 업체 선택: Studio JUAI
3. 테마 변경 또는 색상 변경
4. studiojuai.co.kr에서 실제 변경사항 확인

---

## 🔧 Troubleshooting

### Q1: wrangler login이 안 돼요
```bash
# 브라우저가 자동으로 열리지 않으면
npx wrangler login --browser=false

# 출력된 URL을 복사해서 브라우저에 직접 붙여넣기
```

### Q2: D1 create 실패
```bash
# API 토큰 확인
npx wrangler whoami

# 권한 부족 시: Cloudflare 대시보드에서 API 토큰 재생성
# 필요 권한: Account.D1, Account.Workers
```

### Q3: 프로덕션 발행해도 워드프레스에 안 나와요

**확인 사항:**
1. Application Password가 올바른지 확인
   - bang6655.mycafe24.com/wp-admin
   - Users → Profile → Application Passwords
   - 새로 생성해서 다시 테스트

2. 워드프레스 REST API 활성화 확인
   ```bash
   curl https://studiojuai.co.kr/wp-json/wp/v2/posts
   # 정상이면 게시물 목록 반환
   ```

3. 콘솔 로그 확인
   - 브라우저 F12 → Console 탭
   - 발행 버튼 클릭 시 오류 메시지 확인

---

## 📊 예상 결과

### ✅ 성공 시

```
프로덕션 URL: https://c2e5ab55.webapp-2t1.pages.dev

[콘텐츠 생성] → AI 콘텐츠 생성 완료
     ↓
[워드프레스 발행] → studiojuai.co.kr에 실제 게시물 생성
     ↓
[블로그 꾸미기] → studiojuai.co.kr 디자인 실시간 변경
```

### ❌ 아직 D1 바인딩 없으면

```
프로덕션 URL: https://c2e5ab55.webapp-2t1.pages.dev

[콘텐츠 생성] → ❌ DB 바인딩 없음 오류
[워드프레스 발행] → ❌ 실행조차 안 됨
[블로그 꾸미기] → ❌ 실행조차 안 됨
```

---

## 🎯 최종 목표

모든 단계 완료 후:

```
✅ 개발 서버: 시뮬레이션 모드로 테스트
✅ 프로덕션: 실제 워드프레스 발행 및 블로그 꾸미기 작동
✅ studiojuai.co.kr: 실시간으로 콘텐츠 발행 및 디자인 변경
```

