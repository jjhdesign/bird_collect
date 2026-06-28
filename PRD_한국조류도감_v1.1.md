# PRD — 한국 조류 현실 도감 수집 웹앱

> 작성일: 2026-06-24
> 수정일: 2026-06-25
> 버전: v1.1
> 문서 목적: Claude Code 투입용 제품 요구사항 정의
> 변경사항: AI 인식 모델 Claude Vision API → Gemini 3 Flash (무료 티어) 교체

---

## 1. 서비스 개요

한국에 서식하는 조류를 실제로 촬영해 도감을 하나씩 해금하는 웹 기반 수집 서비스.
미발견 조류는 실루엣으로 미리 노출되어 사용자의 탐험 욕구를 자극한다.

**한 줄 컨셉**
> "아직 찍지 못한 새가 당신 동네에 있다"

**핵심 차별점**
- 한국 조류 한정 (글로벌 앱들이 커버하지 못하는 로컬라이제이션)
- 미발견 종을 실루엣으로 先공개 → 탐험 유도
- 철새 도래 시기에 따른 계절 한정 해금
- 환경부 멸종위기 등급 연동 희귀도 시스템

---

## 2. 타깃 & 규모

- 초기 사용자: 약 30명 (지인 / 소규모 사이드 프로젝트)
- 조류·자연 관심층, 산책·아웃도어 활동 유저

---

## 3. 핵심 사용자 루프

```
위치 확인 → 도 단위 도감 진입 → 실루엣 탐색
→ 야외에서 기본 카메라로 촬영 → 갤러리에서 업로드
→ AI 인식 → 도감 해금 → 전국 랭킹 반영
```

---

## 4. 기능 명세

### 4.1 도감
- 사용자 위치 기반으로 해당 **도(광역시·도) 단위** 서식 조류 표시
- 미해금 종은 전부 **동일한 실루엣**으로 처리
- 카테고리 필터: **전체 / 텃새 / 철새**
- 철새가 도래 시즌이 아닐 경우: 실루엣 유지 + "○월~○월에 만날 수 있어요" 텍스트 표기
- 멸종위기 I·II급 종은 별도 **희귀 마킹**
- 비로그인 상태에서도 도감 열람 가능

### 4.2 해금 상세 페이지
해금된 종의 상세 정보를 표시한다.
- 조류 사진 (상단 풀샷)
- 이름 (국명 + 학명)
- 설명
- 서식지
- 희귀도
- 계절 정보 (텃새 / 철새 + 철새의 경우 도래 시기)

### 4.3 촬영 & 인식 플로우

```
도감 화면
  └─ 플로팅 버튼 (📷)
       └─ [비로그인 시] 로그인 게이트
       │    "기록을 남기려면 로그인이 필요해요" → 카카오 로그인
       └─ [로그인 시] 갤러리 사진 업로드
            └─ 인식 중 (로딩)
                 ├─ 성공 → 사진 풀스크린 표시
                 │         스크롤 시 상세 정보 (상세 페이지와 동일 구성)
                 │         → 도감 해금 + 기록 저장
                 └─ 실패 → "사진 인식에 실패했습니다"
                            [확인] [다시 업로드]
```

- 촬영은 사용자의 **기본 카메라 앱**으로 진행 후 갤러리에서 업로드하는 방식
  (별도 인앱 카메라 구현하지 않음)
- 인식은 **Google Gemini 3 Flash API** 사용 (무료 티어: 1,500 req/day)
- 인식 실패 사진도 임시 저장하여 재시도 가능

#### Gemini Vision 프롬프트 전략
```
system: 당신은 한국 조류 전문가입니다. 이미지를 분석하여 한국에 서식하는 새의 종을 식별하세요.
        반드시 JSON 형식으로만 응답하세요.

user: 이 사진에서 새를 식별해주세요.
      응답 형식:
      {
        "is_bird": true/false,
        "name_ko": "황조롱이",
        "name_sci": "Falco tinnunculus",
        "confidence": 0.92,
        "reason": "꼬리 무늬와 날개 패턴이 황조롱이의 특징과 일치합니다"
      }
      새가 없거나 식별 불가 시 is_bird: false로 응답하세요.
```

- `confidence` 임계값: **0.7 이상**일 때만 해금 처리
- `is_bird: false` 또는 임계값 미달 시 → 인식 실패 처리

### 4.4 인증 / 로그인
- **카카오 로그인** 단일 방식
- **로그인 게이트 시점: 촬영 플로팅 버튼 클릭 시**
  - 도감 열람까지는 비로그인 허용
  - 업로드 진입 시 로그인 요구 → 비로그인 유저의 불필요한 API 호출(트래픽·비용) 차단
- 로그인 후 해금 기록 정상 저장

### 4.5 랭킹
- **전국 통합 단일 랭킹** (지역 구분 없음)
- 기준: **해금 종 수**
- 별도 랭킹 테이블 없이 `user_birds`에서 실시간 집계

### 4.6 어뷰징 방어
- **이미지 해시 중복 체크**: 동일 사진 재업로드 차단 (DB UNIQUE 제약)
- **EXIF 메타데이터 확인**: 촬영일시 검증 (미래 날짜 등 비정상 반려)
- **조류 외 사진 반려**: Gemini 응답의 `is_bird: false` 또는 `confidence < 0.7` 시 실패 처리

---

## 5. 데이터 모델

### users
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | Supabase Auth 연동 |
| kakao_id | text (UNIQUE) | 카카오 식별자 |
| nickname | text | 닉네임 |
| region | text | 현재 선택 도 (예: "전라남도") |
| created_at | timestamp | |

### birds
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name_ko | text | 국명 (예: "황조롱이") |
| name_sci | text | 학명 |
| type | enum | 'resident' \| 'migratory' (텃새/철새) |
| regions | text[] | 서식 도 목록 |
| season_start | int | 철새 도래 시작 월 (텃새는 null) |
| season_end | int | 철새 도래 종료 월 |
| rarity | enum | 'common' \| 'endangered_2' \| 'endangered_1' |
| description | text | 설명 |
| image_url | text | 해금 후 실제 이미지 |
| silhouette_url | text | 해금 전 실루엣 |
| created_at | timestamp | |

### user_birds
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK → users.id) | |
| bird_id | uuid (FK → birds.id) | |
| upload_id | uuid (FK → uploads.id) | |
| unlocked_at | timestamp | |
| — | UNIQUE (user_id, bird_id) | 중복 해금 방지 |

### uploads
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK → users.id) | |
| storage_url | text | Supabase Storage 경로 |
| image_hash | text (UNIQUE) | 중복 업로드 체크용 MD5 |
| exif_taken_at | timestamp | EXIF 촬영일시 (없으면 null) |
| ai_result | text | Gemini Vision 반환 종명 |
| ai_confidence | float | 인식 신뢰도 |
| status | enum | 'pending' \| 'success' \| 'failed' |
| created_at | timestamp | |

### 관계도
```
users ──< user_birds >── birds
users ──< uploads
user_birds ── uploads
```

### 랭킹 집계 쿼리
```sql
SELECT u.nickname, COUNT(ub.id) AS unlocked_count
FROM user_birds ub
JOIN users u ON u.id = ub.user_id
GROUP BY u.id
ORDER BY unlocked_count DESC;
```

---

## 6. 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 (위치 기반 도 도감 바로 진입) |
| `/dex` | 도감 메인 (실루엣 그리드 + 전체/텃새/철새 필터) |
| `/dex/:id` | 해금 종 상세 페이지 |
| `/capture` | 사진 업로드 & 인식 |
| `/ranking` | 전국 랭킹 |

---

## 7. 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React (Vite) + Tailwind |
| 백엔드 | Supabase (DB + Auth + Storage) |
| AI 인식 | **Google Gemini 3 Flash API** (무료 티어) |
| 인증 | 카카오 OAuth |
| 배포 | Vercel |
| 위치 | 브라우저 Geolocation API |

---

## 8. 데이터 소스

| 데이터 | 출처 |
|--------|------|
| 조류 종 목록·서식지·텃새/철새 구분 | 수동 시드 JSON (MVP) |
| 철새 도래 시기·지역 | 수동 시드 JSON (MVP) |
| 멸종위기 등급 | 환경부 멸종위기 야생생물 목록 참고 |
| 조류 인식 | **Google Gemini 3 Flash API** |

---

## 9. 지역 단위 기준

- 서식 도감은 **도(광역시·도) 단위**로 묶는다.
- 생태권역 참고: 강원 / 경기·인천·서울 / 충청 / 전라 / 경상 / 제주

---

## 10. MVP 범위 vs 이후

| 항목 | MVP | 이후 |
|------|-----|------|
| 종 범위 | 한국 주요 조류 약 100종 | 전체 500+종 |
| 지역 단위 | 도 단위 | (유지) |
| 소셜 | 전국 랭킹만 | 사진 공유, 팔로우 |
| 플랫폼 | 웹앱 (모바일 브라우저) | 네이티브 앱 |
| 촬영 | 갤러리 업로드 | 인앱 카메라 고도화 |
| AI 인식 | Gemini 3 Flash 무료 티어 | 트래픽 증가 시 유료 전환 또는 Claude Vision 교체 |

---

## 11. 비용 예상 (30명 기준)

| 항목 | 비용 |
|------|------|
| ~~Claude Vision API~~ → **Gemini 3 Flash API** | **$0** (무료 티어, 1,500 req/day) |
| Supabase / Vercel | $0 (무료 tier) |
| 공공 생물종 API | $0 (미사용, 시드 JSON으로 대체) |
| 도메인 (선택) | 연 ~₩10,000–15,000 |
| **합계** | **$0 / 월** |

---

## 12. API 키 발급 목록

| API | 발급처 | 상태 |
|-----|--------|------|
| 카카오 OAuth | developers.kakao.com | 즉시 발급 |
| Supabase | supabase.com | 즉시 발급 |
| Gemini 3 Flash | ai.google.dev | 즉시 발급 (무료) |

---

## 13. 보류 항목

- 서비스 이름
- 도감 해금 애니메이션 (실루엣 → 이미지 전환 효과)
