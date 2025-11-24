# 프로덕션 배포 가이드

## 현재 상태
- ✅ GitHub: https://github.com/ikjoobang/wordpress-marketing-automation
- ✅ Cloudflare Pages: https://c2e5ab55.webapp-2t1.pages.dev
- ⚠️ D1 Database: 바인딩 추가 필요

## 실제 워드프레스 발행을 위한 설정

### 1단계: Cloudflare 대시보드에서 D1 바인딩 추가

1. **Cloudflare 대시보드 접속**: https://dash.cloudflare.com
2. **Pages 프로젝트 선택**: `webapp-2t1`
3. **Settings → Functions 탭**으로 이동
4. **D1 database bindings** 섹션에서:
   - Variable name: `DB`
   - D1 database: `webapp-production` (또는 새로 생성)
5. **Save** 클릭

### 2단계: 환경 변수 설정

**Settings → Environment variables**에서 추가:

```
OPENAI_API_KEY=your-openai-api-key
```

### 3단계: 재배포

바인딩 추가 후 자동으로 재배포되거나, 수동으로:

```bash
cd /home/user/webapp
npm run deploy
```

---

## 카페24 워드프레스 설정 확인

### ✅ 이미 올바르게 설정되어 있습니다

**도메인 정보**:
- 대표 도메인: bang6655.mycafe24.com
- 연결 도메인: studiojuai.co.kr
- 관리자 URL: bang6655.mycafe24.com/wp-admin
- SSL: 양쪽 모두 설치됨

**워드프레스 발행에 필요한 것**:
1. 워드프레스 사용자명
2. Application Password (워드프레스 관리자 → Users → Application Passwords에서 생성)

### Application Password 생성 방법

1. **워드프레스 관리자 로그인**: https://bang6655.mycafe24.com/wp-admin
2. **Users → Profile** 메뉴로 이동
3. 하단 **Application Passwords** 섹션에서:
   - Application Name: `WordPress Marketing Automation`
   - **Add New Application Password** 클릭
4. 생성된 비밀번호를 복사 (한 번만 표시됨!)
5. 업체 등록 시 이 비밀번호 사용

---

## 테스트 방법

### 개발 서버 (시뮬레이션 모드)
- URL: https://3000-ig51ed43dayktcrmwppqa-c07dda5e.sandbox.novita.ai
- 워드프레스 발행: DB 상태만 변경 (published)
- 모든 기능 테스트 가능

### 프로덕션 서버 (실제 발행)
- URL: https://c2e5ab55.webapp-2t1.pages.dev
- D1 바인딩 추가 후 → 실제 워드프레스 발행 가능
- studiojuai.co.kr에 게시물 생성됨

---

## 문제 해결

### Q: 발행 버튼을 눌렀는데 아무 일도 안 일어나요
A: 개발 서버에서는 시뮬레이션 모드가 작동합니다. 콘텐츠 목록에서 상태가 "발행완료"로 변경되는지 확인하세요.

### Q: 실제 워드프레스에 게시하고 싶어요
A: Cloudflare Pages에서 D1 바인딩을 추가하고 프로덕션 URL(https://c2e5ab55.webapp-2t1.pages.dev)을 사용하세요.

### Q: Application Password가 뭔가요?
A: 워드프레스 REST API 인증 방식입니다. 일반 비밀번호 대신 앱 전용 비밀번호를 사용합니다.

---

## 보안 체크리스트

- ✅ Rate Limiting 활성화
- ✅ CSRF Protection 활성화
- ✅ XSS 방지
- ✅ Security Headers 설정
- ✅ Application Password 사용 (일반 비밀번호 노출 방지)
- ✅ HTTPS 강제 (Cloudflare Pages 자동)

---

## 다음 단계

1. Cloudflare 대시보드에서 D1 바인딩 추가
2. 워드프레스 Application Password 생성
3. 프로덕션 URL에서 업체 등록
4. 실제 워드프레스 발행 테스트
5. 완료!
