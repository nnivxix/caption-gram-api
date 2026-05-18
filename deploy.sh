#!/usr/bin/env bash

set -Eeuo pipefail

PROCESS_NAME="captiom-gram-api"
ENTRYPOINT="dist/src/index.js"
START_TIME="$(date +%s)"
STEP=0

if [[ -t 1 ]]; then
  C_RESET='\033[0m'
  C_BOLD='\033[1m'
  C_BLUE='\033[34m'
  C_GREEN='\033[32m'
  C_YELLOW='\033[33m'
  C_RED='\033[31m'
else
  C_RESET=''
  C_BOLD=''
  C_BLUE=''
  C_GREEN=''
  C_YELLOW=''
  C_RED=''
fi

log_info() {
  printf "%b[INFO]%b %s\n" "$C_BLUE" "$C_RESET" "$1"
}

log_ok() {
  printf "%b[ OK ]%b %s\n" "$C_GREEN" "$C_RESET" "$1"
}

log_warn() {
  printf "%b[WARN]%b %s\n" "$C_YELLOW" "$C_RESET" "$1"
}

log_err() {
  printf "%b[FAIL]%b %s\n" "$C_RED" "$C_RESET" "$1" >&2
}

on_error() {
  local exit_code="$?"
  log_err "Deploy failed at step $STEP. Command: ${BASH_COMMAND}"
  log_err "Exit code: $exit_code"
  exit "$exit_code"
}

trap on_error ERR

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_err "Required command not found: $1"
    exit 1
  fi
}

run_step() {
  local title="$1"
  shift

  STEP=$((STEP + 1))
  printf "\n%bStep %d%b - %s\n" "$C_BOLD" "$STEP" "$C_RESET" "$title"
  "$@"
  log_ok "$title completed"
}

print_banner() {
  printf "%b========================================%b\n" "$C_BOLD" "$C_RESET"
  printf "%b  Captiom-Gram API Deploy Script%b\n" "$C_BOLD" "$C_RESET"
  printf "%b========================================%b\n" "$C_BOLD" "$C_RESET"
}

print_summary() {
  local end_time elapsed branch_name

  end_time="$(date +%s)"
  elapsed=$((end_time - START_TIME))
  branch_name="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

  printf "\n%bDeployment Summary%b\n" "$C_BOLD" "$C_RESET"
  printf "- Branch   : %s\n" "$branch_name"
  printf "- Process  : %s\n" "$PROCESS_NAME"
  printf "- Duration : %ss\n" "$elapsed"
}

main() {
  print_banner

  require_cmd git
  require_cmd pnpm
  require_cmd pm2

  run_step "Pull latest source" git pull --ff-only
  run_step "Install dependencies" pnpm install
  run_step "Build" pnpm build

  STEP=$((STEP + 1))
  printf "\n%bStep %d%b - Restart PM2 process\n" "$C_BOLD" "$STEP" "$C_RESET"
  if pm2 restart "$PROCESS_NAME"; then
    log_ok "PM2 restart succeeded for $PROCESS_NAME"
  else
    log_warn "PM2 restart failed or process missing. Falling back to start."
    pm2 start "$ENTRYPOINT" --name "$PROCESS_NAME" --node-args="--env-file=.env"
    log_ok "PM2 start succeeded for $PROCESS_NAME"
  fi

  pm2 status "$PROCESS_NAME"

  pm2 save >/dev/null
  log_ok "PM2 process list saved"

  pm2 logs "$PROCESS_NAME" --lines 10 --nostream

  print_summary
  printf "%bDeploy finished successfully.%b\n" "$C_GREEN" "$C_RESET"
}

main "$@"
