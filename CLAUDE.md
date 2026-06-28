# 한국 조류 현실 도감 — Claude Code 지침

## 프로젝트 개요
한국 조류를 실제 촬영해 도감을 해금하는 웹앱. PRD: `PRD_한국조류도감_v1.1.md`

## 기술 스택
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Supabase (DB + Auth + Storage)
- **AI**: Google Gemini 2.0 Flash API (`gemini-2.0-flash` 모델)
- **Auth**: 카카오 OAuth (Supabase Auth custom provider)
- **Deploy**: Vercel

## 환경변수 (.env)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_KAKAO_REST_API_KEY
VITE_GEMINI_API_KEY
```

## 디렉토리 구조
```
src/
  pages/          # 라우트 단위 페이지 컴포넌트
  components/     # 재사용 UI 컴포넌트
  lib/            # supabase.js, gemini.js, kakao.js 등 외부 연동
  hooks/          # 커스텀 React 훅
  data/           # birds_seed.json (조류 시드 데이터)
```

## 페이지 구조
| 경로 | 설명 |
|------|------|
| `/` | 랜딩 — 위치 기반 도 도감 바로 진입 |
| `/dex` | 도감 메인 — 실루엣 그리드 + 전체/텃새/철새 필터 |
| `/dex/:id` | 해금 종 상세 페이지 |
| `/capture` | 사진 업로드 & Gemini 인식 |
| `/ranking` | 전국 랭킹 |

## 데이터 모델 (Supabase)
- `users`: id, kakao_id, nickname, region, created_at
- `birds`: id, name_ko, name_sci, type(resident/migratory), regions[], season_start, season_end, rarity(common/endangered_2/endangered_1), description, image_url, silhouette_url
- `user_birds`: id, user_id, bird_id, upload_id, unlocked_at — UNIQUE(user_id, bird_id)
- `uploads`: id, user_id, storage_url, image_hash(UNIQUE), exif_taken_at, ai_result, ai_confidence, status(pending/success/failed)

## 핵심 규칙
- 비로그인: 도감 열람 가능, 업로드 불가
- 로그인 게이트: 플로팅 📷 버튼 클릭 시
- Gemini confidence ≥ 0.7 + is_bird: true → 해금 처리
- 이미지 해시 중복 → 업로드 거부
- 철새 비시즌 → 실루엣 유지 + 도래 시기 텍스트 표시
- 멸종위기 I·II급 → 희귀 마킹 표시

## Gemini 프롬프트 (고정)
```json
{
  "system": "당신은 한국 조류 전문가입니다. 이미지를 분석하여 한국에 서식하는 새의 종을 식별하세요. 반드시 JSON 형식으로만 응답하세요.",
  "response_schema": {
    "is_bird": "boolean",
    "name_ko": "string",
    "name_sci": "string",
    "confidence": "float 0~1",
    "reason": "string"
  }
}
```

## 코딩 컨벤션
- 컴포넌트: PascalCase
- 훅: camelCase (`useAuth`, `useBirds`)
- Supabase 쿼리: `src/lib/supabase.js`에서 함수로 분리
- Tailwind만 사용 (별도 CSS 파일 최소화)
- 주석 금지 (코드 자체로 의미 전달)
