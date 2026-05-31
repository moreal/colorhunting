컬러헌팅
========

Vite, TypeScript, SolidJS 기반의 컬러 팔레트 실험용 웹 프론트엔드입니다.


개발 환경
---------

이 저장소는 [mise]로 개발 도구 버전을 관리합니다.
Node.js 24와 Yarn 4를 사용합니다.

~~~~ bash
mise install
~~~~

프로젝트 명령은 `mise run`으로 실행합니다.

~~~~ bash
mise run install
mise run dev
mise run build
mise run test
mise run lint
mise run format-check
mise run e2e-android-webview
~~~~

로컬 개발 서버는 Vite가 실행합니다.

~~~~ bash
mise run dev
~~~~

소스 포맷은 oxfmt, 린트는 oxlint를 사용합니다.

~~~~ bash
mise run format
mise run format-check
mise run lint
~~~~

Android WebView 수동 저장 fallback은 adb와 Maestro로 로컬 에뮬레이터에서 확인할 수 있습니다.
Android Studio에서 에뮬레이터를 먼저 실행한 뒤 다음 명령을 사용합니다.

~~~~ bash
mise run e2e-android-webview
~~~~

이 명령은 Vite 개발 서버를 시작하거나 기존 `127.0.0.1:5173` 서버를 재사용하고,
`adb reverse`로 에뮬레이터에서 로컬 서버에 접근하게 한 다음 Maestro flow를 실행합니다.
기본 브라우저 패키지는 `com.android.chrome`이며 필요하면 `ANDROID_BROWSER_PACKAGE`로 바꿀 수 있습니다.

[mise]: https://mise.jdx.dev/
