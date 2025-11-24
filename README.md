# 워드프레스 마케팅 자동화 대시보드

## 프로젝트 개요

- **프로젝트명**: 워드프레스 마케팅 자동화 대시보드
- **목표**: 다수의 클라이언트(업체) 워드프레스 블로그를 통합 관리하고, OpenAI API를 활용하여 콘텐츠를 자동 생성 및 발행하는 올인원 마케팅 대행사 관리자 시스템
- **기술 스택**: Hono + TypeScript + Cloudflare Workers + D1 Database + OpenAI API + TailwindCSS

## 🌐 URL

- **개발 서버**: https://3000-ig51ed43dayktcrmwppqa-c07dda5e.sandbox.novita.ai
- **워드프레스 사이트**: https://studiojuai.co.kr (또는 https://bang6655.mycafe24.com)
- **GitHub 저장소**: https://github.com/ikjoobang/wordpress-marketing-automation

## ✅ 완료된 기능 (Phase 1 + 최신 업데이트)

### ❶ 시스템 아키텍처
- ✅ 워드프레스 REST API 연동 모듈 (완료)
- ✅ Application Passwords 인증 방식 (완료)
- ✅ Cloudflare D1 데이터베이스 스키마 (완료)
- ✅ 보안 미들웨어 구현 (Rate limiting, CSRF, Input sanitization)

### ❷ 업체 관리 시스템
- ✅ 업체 등록/수정/삭제 기능
- ✅ 워드프레스 연결 정보 관리
- ✅ 업체별 OpenAI API 키 관리
- ✅ 업체별 시스템 프롬프트 설정 (실시간 수정 가능)
- ✅ 업체별 통계 조회 기능

### ❸ AI 콘텐츠 생성 엔진
- ✅ OpenAI GPT-4o-mini 기반 텍스트 생성
- ✅ DALL-E 3 기반 이미지 생성 (개선된 UI)
- ✅ **실전 블로그 마케팅 전략 통합 프롬프트**
  - SEO 최적화 (제목 최적화, H1-H3 구조, 키워드 밀도)
  - AEO 최적화 (답변 중심, Q&A 형식, FAQ 섹션)
  - C-RANK 최적화 (전문성 표현, 구체적 수치, 실용적 팁)
  - GEO 최적화 (지역 타겟팅, 로컬 키워드)
  - 독자 중심 작성 전략
  - 행동 유도 (CTA) 전략
- ✅ 업체별 맞춤 프롬프트 적용
- ✅ 키워드 기반 콘텐츠 생성

### ❹ 콘텐츠 관리
- ✅ 콘텐츠 목록 조회
- ✅ 상태 관리 (임시저장, 예약, 발행완료, 실패)
- ✅ 워드프레스 자동 발행 기능
- ✅ 썸네일 이미지 자동 업로드
- ✅ 콘텐츠 미리보기 (전체 HTML 렌더링)
- ✅ **TXT 다운로드 기능** (HTML → Plain Text 변환)
- ✅ **PDF 다운로드 기능** (jsPDF 라이브러리 활용)

### ❺ 통합 대시보드 UI
- ✅ 반응형 웹 디자인 (Tailwind CSS)
- ✅ 대시보드 통계 (업체 수, 콘텐츠 수, 발행 현황)
- ✅ 직관적인 네비게이션
- ✅ 업체 관리 페이지
- ✅ 콘텐츠 목록 페이지
- ✅ **개선된 AI 생성 페이지** (이미지 생성 UI 명확화)
- ✅ GenSpark 스타일 가이드 준수 (❶ ■ ✔️ 이모지 사용)

### ❻ 보안 시스템
- ✅ **Rate Limiting** (API 요청 1분당 60회 제한)
- ✅ **CSRF Protection** (Same-origin 검증)
- ✅ **Input Sanitization** (XSS 방어)
- ✅ **Security Headers** (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- ✅ **Content Validation** (콘텐츠 생성 시 입력값 검증)

## 📊 데이터 아키텍처

### 데이터베이스 스키마 (Cloudflare D1)

**테이블 구조:**
1. **clients** - 클라이언트(업체) 정보
   - 워드프레스 연결 정보
   - OpenAI API 키
   - 시스템 프롬프트

2. **projects** - 프로젝트 정보
   - 업체별 프로젝트 관리
   - 키워드 풀

3. **contents** - 콘텐츠 관리
   - 제목, 본문, 요약
   - 상태 (draft, scheduled, published, failed)
   - 워드프레스 포스트 ID

4. **schedules** - 발행 스케줄
   - 빈도 (daily, weekly, monthly)
   - 다음 실행 시간

5. **activity_logs** - 활동 로그
   - 모든 작업 기록
   - 성공/실패 상태

6. **keyword_pool** - 키워드 로테이션
   - 2개월 주기 관리

## 🚀 사용 가이드

### 1️⃣ 업체 등록

```
1. 대시보드 접속
2. [업체 관리] 클릭
3. [새 업체 등록] 버튼 클릭
4. 필수 정보 입력:
   - 업체명
   - 워드프레스 URL
   - 워드프레스 사용자명
   - Application Password
   - OpenAI API Key (선택)
   - 시스템 프롬프트 (선택)
5. [등록] 클릭
```

### 2️⃣ AI 콘텐츠 생성

```
1. [AI 생성] 메뉴 클릭
2. 업체 선택
3. 키워드 입력 (쉼표로 구분)
4. 제목 입력 (선택, 비워두면 AI가 생성)
5. 이미지 생성 체크 (선택)
6. [생성하기] 클릭
7. 생성 완료 후 [콘텐츠 목록]에서 확인
```

### 3️⃣ 워드프레스 발행

```
1. [콘텐츠] 메뉴 클릭
2. 임시저장 상태의 콘텐츠 찾기
3. 📄 (발행) 아이콘 클릭
4. 확인 팝업에서 [확인] 클릭
5. 자동으로 워드프레스에 발행됨
```

## 📋 API 엔드포인트

### 클라이언트 관리
- `GET /api/clients` - 전체 클라이언트 목록
- `GET /api/clients/:id` - 단일 클라이언트 조회
- `POST /api/clients` - 새 클라이언트 등록
- `PUT /api/clients/:id` - 클라이언트 정보 수정
- `DELETE /api/clients/:id` - 클라이언트 삭제
- `GET /api/clients/:id/stats` - 클라이언트 통계

### 콘텐츠 관리
- `GET /api/contents` - 콘텐츠 목록 조회
- `POST /api/contents/generate` - AI 콘텐츠 생성
- `POST /api/contents/:id/publish` - 워드프레스 발행
- `DELETE /api/contents/:id` - 콘텐츠 삭제

## ⏳ 미구현 기능 (Phase 2)

### ❽ 자동 스케줄링 시스템
- ⏳ Cron Job 기반 자동 발행
- ⏳ 월별/주별/일별 스케줄 설정
- ⏳ 예약 발행 기능

### ❾ 키워드 로테이션
- ⏳ 2개월 주기 키워드 갱신
- ⏳ 키워드 풀 관리
- ⏳ 아이디어 캘린더

### ❿ 고급 기능
- ⏳ 동영상 생성 연동
- ⏳ 프로젝트 관리 기능
- ⏳ 카테고리/태그 자동 설정
- ⏳ 고급 SEO 최적화 (AEO, C-RANK, GEO)
- ⏳ 멀티사이트 지원

## 🛠️ 개발 환경 설정

### 로컬 개발

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# D1 마이그레이션 (로컬)
npm run db:migrate:local

# 개발 서버 시작
npm run dev:sandbox
# 또는 PM2 사용
pm2 start ecosystem.config.cjs
```

### 프로덕션 배포

```bash
# D1 데이터베이스 생성 (최초 1회)
npm run db:create

# wrangler.jsonc에 database_id 추가

# 프로덕션 마이그레이션
npm run db:migrate:prod

# 배포
npm run deploy:prod
```

## 🔐 보안

### 구현된 보안 기능
- ✅ **Application Passwords** 방식으로 워드프레스 인증
- ✅ **OpenAI API 키** 업체별로 분리 저장
- ✅ **Rate Limiting** (1분당 60개 요청 제한)
- ✅ **CSRF Protection** (Same-origin 검증)
- ✅ **Input Sanitization** (XSS 공격 방어)
- ✅ **Security Headers** 자동 추가
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: 위치/마이크/카메라 비활성화
- ✅ **Content Validation** (입력값 검증 및 제한)

### 권장사항
- ⚠️ 프로덕션 환경에서는 비밀번호 암호화 권장
- ⚠️ HTTPS 사용 필수
- ⚠️ CORS 설정을 특정 도메인으로 제한

## 📈 다음 단계 권장사항

1. **우선순위 1: 스케줄링 시스템 구현**
   - Cloudflare Cron Triggers 활용
   - 예약 발행 기능 완성

2. **우선순위 2: 프로젝트 관리 기능**
   - 업체별 여러 프로젝트 관리
   - 프로젝트별 키워드 풀

3. **우선순위 3: 고급 SEO 기능**
   - AEO (Answer Engine Optimization)
   - C-RANK 로직
   - GEO 최적화

4. **우선순위 4: UI/UX 개선**
   - 콘텐츠 미리보기
   - 에디터 기능 추가
   - 대시보드 차트/그래프

## 📝 배포 상태

- **플랫폼**: Cloudflare Pages (준비 완료)
- **데이터베이스**: Cloudflare D1 (로컬 개발 환경 구축 완료)
- **상태**: ✅ 개발 서버 실행 중
- **개발 서버 URL**: https://3000-ig51ed43dayktcrmwppqa-c07dda5e.sandbox.novita.ai
- **마지막 업데이트**: 2025-11-24

### 최신 업데이트 내역 (2025-11-24)
- ✅ 이미지 생성 UI 개선 (명확한 체크박스 및 프롬프트 입력란)
- ✅ 블로그 마케팅 전문 프롬프트 재작성 (SEO/AEO/C-RANK/GEO 통합)
- ✅ 보안 미들웨어 추가 (Rate limiting, CSRF, Input sanitization)
- ✅ PDF 다운로드 기능 구현 (jsPDF)
- ✅ TXT 다운로드 기능 완전 동작 확인
- ✅ 전체 시스템 검증 완료
  - 프론트엔드: ✅ 정상 작동
  - 백엔드 API: ✅ 모든 엔드포인트 정상
  - 데이터베이스: ✅ 마이그레이션 완료, 16개 컬럼 확인
  - 보안 헤더: ✅ 적용 확인
  - 정적 파일: ✅ 서빙 정상
  - 다운로드: ✅ TXT/PDF 모두 정상

## 🤝 연동된 서비스

- **워드프레스**: studiojuai.co.kr
- **OpenAI API**: GPT-4o-mini, DALL-E 3
- **Cloudflare**: Workers, Pages, D1 Database

## 💡 사용 팁

1. **업체 등록 시 Application Password 생성 방법**:
   - 워드프레스 관리자 페이지 로그인
   - [사용자] → [프로필]
   - 아래로 스크롤하여 "Application Passwords" 섹션
   - 이름 입력 후 [Add New Application Password] 클릭
   - 생성된 비밀번호 복사 (한 번만 표시됨!)

2. **OpenAI API 키 발급**:
   - https://platform.openai.com/api-keys 접속
   - [Create new secret key] 클릭
   - 키 복사하여 안전하게 보관

3. **시스템 프롬프트 예시**:
   ```
   You are a professional SEO content writer specializing in Korean business blogs.
   Write engaging, informative posts optimized for search engines.
   Use proper HTML structure with H1, H2, H3 tags.
   Focus on local SEO for Dongtan, Gyeonggi-do area.
   Include call-to-action at the end.
   ```

---

**개발자**: Claude (Anthropic)  
**버전**: 1.0.0  
**라이선스**: MIT
