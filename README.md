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

[mise]: https://mise.jdx.dev/
