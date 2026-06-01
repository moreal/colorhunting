#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-5173}"
HOST="${HOST:-127.0.0.1}"
FLOW_FILE="${FLOW_FILE:-.maestro/android/webview-manual-save.yaml}"
ANDROID_BROWSER_PACKAGE="${ANDROID_BROWSER_PACKAGE:-com.android.chrome}"
APP_URL="${APP_URL:-http://127.0.0.1:${PORT}/?e2e=1&e2eColor=RED&e2eDownload=manual-save}"
ANDROID_API_LEVEL="${ANDROID_API_LEVEL:-35}"
ANDROID_AUTO_EMULATOR="${ANDROID_AUTO_EMULATOR:-1}"
ANDROID_SDK_AUTO_INSTALL="${ANDROID_SDK_AUTO_INSTALL:-1}"
ANDROID_ACCEPT_SDK_LICENSES="${ANDROID_ACCEPT_SDK_LICENSES:-1}"
ANDROID_EMULATOR_HEADLESS="${ANDROID_EMULATOR_HEADLESS:-1}"
ANDROID_EMULATOR_KEEP_RUNNING="${ANDROID_EMULATOR_KEEP_RUNNING:-0}"
ANDROID_EMULATOR_WIPE_DATA="${ANDROID_EMULATOR_WIPE_DATA:-0}"
ANDROID_BOOT_TIMEOUT_SECONDS="${ANDROID_BOOT_TIMEOUT_SECONDS:-240}"
EMULATOR_LOG="${EMULATOR_LOG:-/tmp/colorhunting-android-webview-emulator.log}"
SERVER_LOG="${SERVER_LOG:-/tmp/colorhunting-android-webview-e2e.log}"
ANDROID_USER_HOME="${ANDROID_USER_HOME:-${HOME}/.android}"
ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-${ANDROID_USER_HOME}/avd}"
export ANDROID_USER_HOME
export ANDROID_AVD_HOME

SERVER_PID=""
EMULATOR_PID=""
EMULATOR_STARTED="0"

log() {
  echo "$*" >&2
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

default_android_abi() {
  case "$(uname -m)" in
    arm64 | aarch64)
      echo "arm64-v8a"
      ;;
    *)
      echo "x86_64"
      ;;
  esac
}

ANDROID_EMULATOR_ABI="${ANDROID_EMULATOR_ABI:-$(default_android_abi)}"
ANDROID_PLATFORM_PACKAGE="${ANDROID_PLATFORM_PACKAGE:-platforms;android-${ANDROID_API_LEVEL}}"
ANDROID_SYSTEM_IMAGE_PACKAGE="${ANDROID_SYSTEM_IMAGE_PACKAGE:-system-images;android-${ANDROID_API_LEVEL};google_apis_playstore;${ANDROID_EMULATOR_ABI}}"
ANDROID_AVD_NAME="${ANDROID_AVD_NAME:-colorhunting_webview_api${ANDROID_API_LEVEL}_${ANDROID_EMULATOR_ABI//-/_}}"

cleanup() {
  if command -v adb >/dev/null 2>&1; then
    adb reverse --remove "tcp:${PORT}" >/dev/null 2>&1 || true
  fi

  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi

  if [[ "${EMULATOR_STARTED}" == "1" && "${ANDROID_EMULATOR_KEEP_RUNNING}" != "1" ]]; then
    adb emu kill >/dev/null 2>&1 || true

    if [[ -n "${EMULATOR_PID}" ]]; then
      kill "${EMULATOR_PID}" >/dev/null 2>&1 || true
      wait "${EMULATOR_PID}" >/dev/null 2>&1 || true
    fi
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

connected_android_device_count() {
  adb devices |
    awk 'NR > 1 && $2 == "device" { count += 1 } END { print count + 0 }'
}

first_connected_android_device() {
  adb devices |
    awk 'NR > 1 && $2 == "device" { print $1; exit }'
}

wait_for_android_device() {
  local deadline=$((SECONDS + ANDROID_BOOT_TIMEOUT_SECONDS))

  while ((SECONDS < deadline)); do
    if [[ "$(connected_android_device_count)" != "0" ]]; then
      return
    fi

    if [[ "${EMULATOR_STARTED}" == "1" && -n "${EMULATOR_PID}" ]] &&
      ! kill -0 "${EMULATOR_PID}" >/dev/null 2>&1; then
      log "Android emulator exited before connecting. Last emulator log lines:"
      tail -n 80 "${EMULATOR_LOG}" >&2 || true
      exit 1
    fi

    sleep 2
  done

  log "Timed out waiting for an Android device to connect."
  if [[ -f "${EMULATOR_LOG}" ]]; then
    tail -n 80 "${EMULATOR_LOG}" >&2 || true
  fi
  exit 1
}

select_single_android_device() {
  local device_count

  if [[ -n "${ANDROID_SERIAL:-}" ]]; then
    if [[ "$(adb -s "${ANDROID_SERIAL}" get-state 2>/dev/null || true)" == "device" ]]; then
      export ANDROID_SERIAL
      return
    fi

    log "ANDROID_SERIAL is set to '${ANDROID_SERIAL}', but that device is not connected."
    adb devices >&2
    exit 1
  fi

  device_count="$(connected_android_device_count)"

  if [[ "${device_count}" == "0" ]]; then
    log "No Android device or emulator is connected."
    exit 1
  fi

  if [[ "${device_count}" != "1" ]]; then
    log "Multiple Android devices are connected. Set ANDROID_SERIAL, then retry."
    adb devices >&2
    exit 1
  fi

  ANDROID_SERIAL="$(first_connected_android_device)"
  export ANDROID_SERIAL
}

accept_android_sdk_licenses() {
  local license_status

  if [[ "${ANDROID_ACCEPT_SDK_LICENSES}" != "1" ]]; then
    return
  fi

  log "Accepting required Android SDK licenses..."
  set +e
  set +o pipefail
  yes | sdkmanager --licenses >/dev/null
  license_status="${PIPESTATUS[1]}"
  set -o pipefail
  set -e

  if [[ "${license_status}" -ne 0 ]]; then
    log "Failed to accept Android SDK licenses."
    exit "${license_status}"
  fi
}

install_android_sdk_packages() {
  if [[ "${ANDROID_SDK_AUTO_INSTALL}" != "1" ]]; then
    return
  fi

  require_command sdkmanager

  accept_android_sdk_licenses
  log "Ensuring Android SDK packages are installed..."
  sdkmanager --install \
    "platform-tools" \
    "emulator" \
    "${ANDROID_PLATFORM_PACKAGE}" \
    "${ANDROID_SYSTEM_IMAGE_PACKAGE}" >/dev/null
}

avd_exists() {
  avdmanager list avd |
    awk -v name="${ANDROID_AVD_NAME}" '$1 == "Name:" && $2 == name { found = 1 } END { exit found ? 0 : 1 }'
}

ensure_android_avd() {
  require_command avdmanager

  if avd_exists; then
    return
  fi

  log "Creating Android virtual device '${ANDROID_AVD_NAME}'..."
  printf 'no\n' |
    avdmanager create avd \
      --force \
      --name "${ANDROID_AVD_NAME}" \
      --package "${ANDROID_SYSTEM_IMAGE_PACKAGE}" \
      --device "pixel_6" >/dev/null
}

find_emulator_binary() {
  local sdk_dir

  if command -v emulator >/dev/null 2>&1; then
    command -v emulator
    return
  fi

  for sdk_dir in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}"; do
    if [[ -n "${sdk_dir}" && -x "${sdk_dir}/emulator/emulator" ]]; then
      echo "${sdk_dir}/emulator/emulator"
      return
    fi
  done

  return 1
}

start_android_emulator() {
  local emulator_bin
  local emulator_args

  if [[ "${ANDROID_AUTO_EMULATOR}" != "1" ]]; then
    log "No Android device or emulator is connected. Start one, then retry."
    exit 1
  fi

  install_android_sdk_packages
  ensure_android_avd

  emulator_bin="$(find_emulator_binary)" || {
    log "Missing required command: emulator"
    exit 127
  }

  emulator_args=(
    -avd "${ANDROID_AVD_NAME}"
    -no-boot-anim
    -no-snapshot-save
  )

  if [[ "${ANDROID_EMULATOR_HEADLESS}" == "1" ]]; then
    emulator_args+=(-no-window -gpu swiftshader_indirect)
  fi

  if [[ "${ANDROID_EMULATOR_WIPE_DATA}" == "1" ]]; then
    emulator_args+=(-wipe-data)
  fi

  log "Starting Android emulator '${ANDROID_AVD_NAME}'..."
  "${emulator_bin}" "${emulator_args[@]}" >"${EMULATOR_LOG}" 2>&1 &
  EMULATOR_PID="$!"
  EMULATOR_STARTED="1"
}

wait_for_android_boot() {
  local boot_completed
  local deadline=$((SECONDS + ANDROID_BOOT_TIMEOUT_SECONDS))

  while ((SECONDS < deadline)); do
    boot_completed="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"

    if [[ "${boot_completed}" == "1" ]]; then
      adb shell input keyevent 82 >/dev/null 2>&1 || true
      return
    fi

    if [[ "${EMULATOR_STARTED}" == "1" && -n "${EMULATOR_PID}" ]] &&
      ! kill -0 "${EMULATOR_PID}" >/dev/null 2>&1; then
      log "Android emulator exited before boot completed. Last emulator log lines:"
      tail -n 80 "${EMULATOR_LOG}" >&2 || true
      exit 1
    fi

    sleep 2
  done

  log "Timed out waiting for Android boot to complete."
  if [[ -f "${EMULATOR_LOG}" ]]; then
    tail -n 80 "${EMULATOR_LOG}" >&2 || true
  fi
  exit 1
}

ensure_android_device() {
  adb start-server >/dev/null

  if [[ "$(connected_android_device_count)" == "0" ]]; then
    start_android_emulator
  fi

  wait_for_android_device
  select_single_android_device
  wait_for_android_boot
}

ensure_browser_package() {
  if adb shell pm path "${ANDROID_BROWSER_PACKAGE}" 2>/dev/null | tr -d '\r' | grep -q '^package:'; then
    return
  fi

  log "Android package '${ANDROID_BROWSER_PACKAGE}' is not installed on ${ANDROID_SERIAL}."
  log "Set ANDROID_BROWSER_PACKAGE to an installed browser package, or use a Google Play system image."
  exit 1
}

cd "${ROOT_DIR}"

require_command curl
require_command maestro
require_command yarn

trap cleanup EXIT

if ! command -v adb >/dev/null 2>&1; then
  install_android_sdk_packages
fi

require_command adb
ensure_android_device
ensure_browser_package

if ! curl --fail --silent --show-error "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
  yarn dev --host "${HOST}" --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
  SERVER_PID="$!"
fi

wait_for_server
adb reverse "tcp:${PORT}" "tcp:${PORT}" >/dev/null

maestro test "${FLOW_FILE}" \
  -e "ANDROID_BROWSER_PACKAGE=${ANDROID_BROWSER_PACKAGE}" \
  -e "APP_URL=${APP_URL}"
