# 03. Supabase client/admin 연결 골격

## 목표

Supabase를 실제 화면이나 API에 연결하기 전에, 브라우저용 client와 서버 전용 admin client를 분리한 기본 구조를 만들었다.

이번 단계에서는 Supabase 쿼리, 인증, API route, 녹화 기능은 구현하지 않았다.

## 추가한 파일

```text
lib/
  supabase/
    client.ts
    admin.ts
  utils.ts
  validators.ts
```

## 브라우저용 client

`lib/supabase/client.ts`에는 anon key를 사용하는 브라우저용 Supabase client를 만들었다.

사용 환경변수:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

둘 중 하나라도 없으면 어떤 값이 빠졌는지 알 수 있는 에러를 던진다.

## 서버 전용 admin client

`lib/supabase/admin.ts`에는 service role key를 사용하는 admin client를 만들었다.

사용 환경변수:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 번들에 포함되면 안 되므로 다음 조치를 했다.

- 파일 최상단에 `import "server-only";` 추가
- 파일 주석으로 Server Components, Server Actions, Route Handlers, 서버 전용 모듈에서만 import하도록 명시
- 현재 클라이언트 컴포넌트나 화면 파일에서는 `admin.ts`를 import하지 않음

## 기본 유틸과 검증 골격

`lib/utils.ts`에는 className 조합용 `cn`과 기본 문자열 assertion을 추가했다.

`lib/validators.ts`에는 이후 폼 검증에 사용할 수 있는 `ValidationResult` 타입과 필수값 검증 함수를 추가했다.

## 검증

다음 명령을 실행해 정상 통과를 확인했다.

```bash
npm run lint
npm run build
```

현재 Supabase client 파일은 화면에서 아직 사용하지 않기 때문에, 환경변수가 없어도 기존 정적 화면 빌드는 유지된다. 실제 import 시점에는 누락된 환경변수에 대해 명확한 에러가 발생한다.
