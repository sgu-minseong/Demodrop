# 02. MVP 정적 화면 구현

## 목표

Demodrop MVP의 핵심 화면을 더미 데이터 기반 정적 UI로 구성했다. 이번 단계에서는 Supabase, API, 녹화 기능, 폼 제출 동작은 구현하지 않았다.

## 구현한 라우트

| 라우트 | 역할 |
| --- | --- |
| `/` | 랜딩페이지 |
| `/new` | 데모 생성 페이지 |
| `/d/sample` | 공개 데모 페이지 샘플 |
| `/manage/sample` | 데모 관리 페이지 샘플 |

## 화면별 구성

### `/`

- 핵심 카피: "Show your product in 60 seconds. See if people get it."
- 보조 문구: "Record a quick product demo, share one link, and collect real launch reactions."
- `/new`로 이동하는 "Create demo" CTA
- 긴 마케팅 섹션, 가격표, 기능 나열, 고객사 로고는 제외
- 빠른 런치 도구 느낌을 주는 간단한 데모 프리뷰 패널 추가

### `/new`

- 제품명 입력
- 한 줄 설명 입력
- 제품 URL 입력
- 녹화 영역 placeholder
- 피드백 질문 미리보기
- 동작하지 않는 "Create demo" 버튼

### `/d/sample`

- 샘플 제품명과 한 줄 설명
- 영상 영역 placeholder
- 빠른 피드백 폼 UI
- 제품 방문 버튼
- 하단 "Made with Demodrop" 표시

### `/manage/sample`

- 조회수, 재생률, 완주율, 클릭률 카드
- 이해도 분포
- 관심도 분포
- 더미 피드백 목록 UI

## 디자인 방향

고급 영상 편집툴처럼 복잡한 느낌을 피하고, 빠르게 데모를 만들고 반응을 확인하는 런치 도구처럼 보이도록 구성했다.

- 카드 반경은 과하지 않게 유지
- 흰색, 스톤 계열, teal 포인트 컬러 사용
- 큰 기능 설명 섹션 대신 실제 작업 화면에 가까운 UI 배치
- 모바일에서는 단일 컬럼으로 자연스럽게 내려가도록 반응형 grid 사용

## 검증

다음 명령을 실행해 정상 통과를 확인했다.

```bash
npm run lint
npm run build
```

빌드 결과에서 다음 라우트가 정적 페이지로 생성되는 것을 확인했다.

```text
/
/new
/d/sample
/manage/sample
```

## 다음 단계

다음 단계에서는 실제 MVP 범위를 확정하고, mock 화면 중 어떤 부분부터 데이터와 동작을 연결할지 정한다.
