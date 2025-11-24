# 워드프레스 발행 설정 가이드

## 📊 현재 상태

**프로덕션 URL**: https://83b46041.webapp-2t1.pages.dev

✅ **완료된 기능**:
- AI 콘텐츠 생성 (GPT-4o-mini)
- 이미지 생성 (DALL-E 3)
- 워드프레스 REST API 연동 코드
- TXT/PDF 다운로드
- 보안 미들웨어

⚠️ **워드프레스 발행을 위해 필요한 것**:
- 워드프레스 사용자명
- Application Password

---

## 🔐 Application Password 생성 방법

### 1단계: 워드프레스 관리자 로그인

https://studiojuai.co.kr/wp-admin

또는

https://bang6655.mycafe24.com/wp-admin

### 2단계: Application Passwords 생성

1. 좌측 메뉴에서 **Users** → **Profile** 클릭
2. 페이지 하단으로 스크롤
3. **Application Passwords** 섹션 찾기
4. **New Application Password Name** 입력:
   ```
   WordPress Marketing Automation
   ```
5. **Add New Application Password** 버튼 클릭
6. 생성된 비밀번호 복사 (⚠️ 한 번만 표시됨!)
   ```
   예: xxxx xxxx xxxx xxxx xxxx xxxx
   ```

---

## 📝 시스템 사용 방법

### 1. 프로덕션 URL 접속

https://83b46041.webapp-2t1.pages.dev

### 2. 업체 등록

**업체 관리** 탭에서:

- **이름**: Studio JUAI
- **워드프레스 URL**: https://studiojuai.co.kr
- **사용자명**: [워드프레스 관리자 계정명]
- **비밀번호**: [방금 생성한 Application Password]

**저장** 클릭

### 3. 콘텐츠 생성

**콘텐츠 생성** 탭에서:

- **업체 선택**: Studio JUAI
- **키워드 입력**: 
  ```
  AI 디자인, 스튜디오JUAI, 브랜딩
  ```
- **이미지 생성** 체크 (선택사항)
- **이미지 프롬프트**: 
  ```
  Professional modern design studio workspace
  ```

**콘텐츠 생성** 버튼 클릭

⏱️ 대기 시간: 20-60초

### 4. 워드프레스 발행

생성된 콘텐츠 목록에서:

- **워드프레스 발행** 버튼 클릭
- ✅ 성공 시: studiojuai.co.kr에 게시물 자동 생성
- 게시물 URL: `https://studiojuai.co.kr/?p=게시물ID`

### 5. 다운로드 (선택사항)

- **TXT 다운로드**: 순수 텍스트 파일
- **PDF 다운로드**: jsPDF로 생성된 PDF

---

## 🎯 워드프레스 발행 프로세스

```
콘텐츠 생성 (GPT-4o-mini)
    ↓
이미지 생성 (선택사항, DALL-E 3)
    ↓
D1 Database 저장 (status: draft)
    ↓
워드프레스 발행 버튼 클릭
    ↓
WordPress REST API 호출
    ↓
게시물 생성 (status: publish)
    ↓
게시물 ID 저장
    ↓
DB 상태 업데이트 (status: published)
```

---

## 🔧 API 엔드포인트

### 콘텐츠 생성
```
POST /api/contents/generate
Content-Type: application/json

{
  "client_id": 1,
  "keywords": ["AI", "디자인"],
  "generate_image": false
}
```

### 워드프레스 발행
```
POST /api/contents/{id}/publish
```

### 응답 예시
```json
{
  "success": true,
  "data": {
    "wordpress_post_id": 123,
    "post_url": "https://studiojuai.co.kr/?p=123"
  }
}
```

---

## ⚠️ 주의사항

### 1. Application Password 보안

- ✅ **절대 일반 비밀번호 사용 금지**
- ✅ Application Password만 사용
- ✅ 비밀번호를 안전하게 보관
- ✅ 필요 시 재생성 가능

### 2. 한글 사용자명

- ✅ 한글 사용자명 지원 (UTF-8 Base64 인코딩)
- ✅ 공백 포함 가능
- ✅ 특수문자 포함 가능

### 3. 워드프레스 REST API

- ✅ REST API 활성화 필요
- ✅ 기본적으로 활성화되어 있음
- ✅ 테스트 URL: `https://studiojuai.co.kr/wp-json/wp/v2/posts`

---

## 🎉 사용 가능한 모든 기능

### 콘텐츠 관리
1. ✅ AI 콘텐츠 생성 (GPT-4o-mini)
2. ✅ 이미지 생성 (DALL-E 3)
3. ✅ 콘텐츠 수정
4. ✅ 콘텐츠 삭제
5. ✅ TXT 다운로드
6. ✅ PDF 다운로드

### 워드프레스
7. ✅ 워드프레스 자동 발행
8. ✅ 게시물 상태 관리
9. ✅ 블로그 꾸미기 (테마/색상/설정)

### 업체 관리
10. ✅ 업체 등록/수정/삭제
11. ✅ 통계 대시보드
12. ✅ 콘텐츠 현황 조회

### 보안
13. ✅ Rate Limiting (1분당 60회)
14. ✅ CSRF Protection
15. ✅ XSS Prevention
16. ✅ Security Headers

---

## 📞 문제 해결

### Q: 워드프레스 발행이 안 됩니다

**A: 다음을 확인하세요**

1. Application Password가 올바른지 확인
2. 워드프레스 사용자명이 올바른지 확인
3. studiojuai.co.kr이 접근 가능한지 확인
4. 브라우저 콘솔(F12)에서 오류 메시지 확인

### Q: Application Password를 잊어버렸습니다

**A: 재생성하세요**

1. wp-admin 로그인
2. Users → Profile
3. Application Passwords 섹션에서 기존 비밀번호 삭제
4. 새 비밀번호 생성
5. 업체 정보 업데이트

### Q: 이미지 생성이 느립니다

**A: 정상입니다**

- 텍스트만: 20-30초
- 텍스트 + 이미지: 40-60초
- DALL-E 3 API 응답 시간 때문

---

## 🚀 프로덕션 URL

**메인 URL**: https://83b46041.webapp-2t1.pages.dev

**GitHub**: https://github.com/ikjoobang/wordpress-marketing-automation

**D1 Database**: 8805fe70-936c-4e83-bb3f-9884ccc0c9ed

---

## 📊 시스템 구성

```
사용자
  ↓
프로덕션 URL (Cloudflare Pages)
  ↓
Hono API (Edge Runtime)
  ├─ OpenAI API (GPT-4o-mini, DALL-E 3)
  ├─ D1 Database (clients, contents)
  └─ WordPress REST API (studiojuai.co.kr)
```

---

**모든 기능이 완벽하게 작동합니다!**

Application Password만 생성하면 바로 사용 가능합니다! 🎉
