#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-5173}"
HOST="${HOST:-127.0.0.1}"
FLOW_FILE="${FLOW_FILE:-.maestro/android/webview-manual-save.yaml}"
ANDROID_BROWSER_PACKAGE="${ANDROID_BROWSER_PACKAGE:-com.android.chrome}"
APP_URL="${APP_URL:-http://127.0.0.1:${PORT}/?e2e=1&e2eColor=RED&e2eDownload=manual-save}"

SERVER_PID=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

cleanup() {
  adb reverse --remove "tcp:${PORT}" >/dev/null 2>&1 || true

  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}

wait_for_server() {
  local url="http://${HOST}:${PORT}/"

  for _ in {1..60}; do
    if curl --fail --silent --show-error "${url}" >/dev/null 2>&1; then
      return
    fi

    sleep 0.5
  done

  echo "Timed out waiting for ${url}" >&2
  exit 1
}

ensure_single_android_device() {
  local device_count

  device_count="$(
    adb devices |
      awk 'NR > 1 && $2 == "device" { count += 1 } END { print count + 0 }'
  )"

  if [[ "${device_count}" == "0" ]]; then
    echo "No Android device or emulator is connected. Start an emulator, then retry." >&2
    exit 1
  fi

  if [[ "${device_count}" != "1" && -z "${ANDROID_SERIAL:-}" ]]; then
    echo "Multiple Android devices are connected. Set ANDROID_SERIAL, then retry." >&2
    adb devices >&2
    exit 1
  fi
}

cd "${ROOT_DIR}"

require_command adb
require_command curl
require_command maestro
require_command yarn

trap cleanup EXIT

adb start-server >/dev/null
ensure_single_android_device

if ! curl --fail --silent --show-error "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
  yarn dev --host "${HOST}" --port "${PORT}" >/tmp/colorhunting-android-webview-e2e.log 2>&1 &
  SERVER_PID="$!"
fi

wait_for_server
adb reverse "tcp:${PORT}" "tcp:${PORT}" >/dev/null

maestro test "${FLOW_FILE}" \
  -e "ANDROID_BROWSER_PACKAGE=${ANDROID_BROWSER_PACKAGE}" \
  -e "APP_URL=${APP_URL}"
