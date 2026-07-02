# 01. 프로젝트 초기화

## 목표

Demodrop MVP 개발을 시작하기 위해 Next.js 기반 프로젝트를 만들고, TypeScript, Tailwind CSS, ESLint가 정상 동작하는 초기 상태를 구성했다.

이번 단계에서는 Supabase 연결, 녹화 기능, 실제 제품 기능 구현은 진행하지 않았다. 프로젝트가 실행 가능한 뼈대를 갖추는 것까지만 완료했다.

## 생성한 프로젝트 구조

`create-next-app`을 사용해 `demodrop` 폴더 안에 App Router 기반 Next.js 프로젝트를 생성했다.

주요 생성 구조는 다음과 같다.

```text
demodrop/
  app/
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  docs/
    devlog/
      00-index.md
      01-project-init.md
  public/
    file.svg
    globe.svg
    next.svg
    vercel.svg
    window.svg
  .gitignore
  eslint.config.mjs
  next-env.d.ts
  next.config.ts
  package-lock.json
  package.json
  postcss.config.mjs
  README.md
  tsconfig.json
```

`create-next-app` 실행 과정에서 Git 저장소도 함께 초기화되었다.

## 설치한 패키지와 이유

기본 프로젝트 생성으로 설치된 주요 패키지는 다음과 같다.

| 패키지 | 이유 |
| --- | --- |
| `next` | App Router 기반 웹 애플리케이션 프레임워크 |
| `react`, `react-dom` | Next.js 화면 구성의 기반 |
| `typescript` | 타입 안정성과 유지보수성 확보 |
| `tailwindcss`, `@tailwindcss/postcss` | Tailwind CSS 기반 스타일링 |
| `eslint`, `eslint-config-next` | 코드 품질 점검 및 Next.js 권장 규칙 적용 |
| `@types/node`, `@types/react`, `@types/react-dom` | TypeScript 타입 지원 |

추가로 설치한 패키지는 다음과 같다.

| 패키지 | 이유 |
| --- | --- |
| `lucide-react` | MVP UI에 사용할 아이콘 컴포넌트 |
| `@supabase/supabase-js` | 이후 Supabase 인증, DB, 스토리지 연동을 위한 클라이언트 |
| `nanoid` | 짧고 충돌 가능성이 낮은 ID 생성 |

## 설정한 항목

- TypeScript 사용
- Tailwind CSS 사용
- ESLint 사용
- Next.js App Router 사용
- npm 기반 패키지 관리
- import alias `@/*` 설정

## .gitignore 확인

`.gitignore`에는 초기 프로젝트에서 제외해야 하는 항목들이 포함되어 있다.

확인한 주요 항목은 다음과 같다.

```text
/node_modules
/.next/
.env*
```

`.env*` 패턴에 의해 `.env.local`도 Git 추적 대상에서 제외된다.

## 실행 방법

개발 서버 실행:

```bash
npm run dev
```

기본 접속 주소:

```text
http://localhost:3000
```

정적 빌드 검증:

```bash
npm run build
```

ESLint 실행:

```bash
npm run lint
```

## 이번 단계에서 있었던 문제와 해결

처음 `npx create-next-app@latest`와 `npm install`을 실행했을 때, 샌드박스 환경의 npm 캐시 제한 때문에 레지스트리에서 패키지를 가져오지 못했다.

해결 방법:

- 네트워크 접근 승인을 받은 뒤 동일 명령을 다시 실행했다.
- 이후 Next.js 프로젝트 생성과 추가 패키지 설치가 정상 완료되었다.

추가로 `npm run build` 실행 시 기본 템플릿의 `next/font/google` 설정이 Google Fonts를 다운로드하려고 하면서 네트워크 제한 환경에서 빌드가 실패했다.

해결 방법:

- `app/layout.tsx`에서 `next/font/google` 사용을 제거했다.
- `app/globals.css`의 Tailwind font theme 값을 시스템 폰트로 변경했다.
- 이후 외부 폰트 요청 없이 빌드가 가능하도록 정리했다.

그 다음 빌드 검증에서 컴파일은 성공했지만 TypeScript 단계에서 `spawn EPERM`이 발생했다. 이는 코드 오류가 아니라 샌드박스 권한 제한으로 판단했다.

해결 방법:

- 동일한 `npm run build` 명령을 정상 권한으로 다시 실행했다.
- TypeScript 검사, 정적 페이지 생성, 최종 최적화까지 정상 완료되는 것을 확인했다.

## 다음 단계

다음 단계에서는 MVP 범위를 더 작게 확정하고, 첫 화면에서 필요한 정보 구조와 핵심 사용자 흐름을 정리한다.
