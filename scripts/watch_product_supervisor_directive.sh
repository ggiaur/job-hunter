#!/usr/bin/env bash
# GitHub -> Cloud Claude Product Architect control-channel watcher.
# Reads committed directives from origin/main and only notifies the configured
# Claude tmux session. It never executes directive contents as shell code.
set -euo pipefail

readonly REPO_DIR="${JOBHUNTER_REPO_DIR:-/srv/projects/job-hunter}"
readonly REMOTE="${JOBHUNTER_SUPERVISOR_REMOTE:-origin}"
readonly BRANCH="${JOBHUNTER_SUPERVISOR_BRANCH:-main}"
readonly DIRECTIVE_PATH="docs/agent-runtime/product-supervisor-directive.yaml"
readonly ACK_PATH="docs/agent-runtime/product-supervisor-ack.yaml"
readonly CONTINUITY_POLICY_PATH="docs/EXECUTION_CONTINUITY_POLICY.md"
readonly STATE_DIR="${JOBHUNTER_SUPERVISOR_STATE_DIR:-${HOME}/.local/state/job-hunter-product-supervisor}"
readonly LOG_FILE="${STATE_DIR}/watcher.log"
readonly SENT_FILE="${STATE_DIR}/last-sent.env"
readonly LOCK_FILE="${STATE_DIR}/watcher.lock"
readonly POLL_SECONDS="${JOBHUNTER_SUPERVISOR_POLL_SECONDS:-60}"
readonly REMINDER_SECONDS="${JOBHUNTER_SUPERVISOR_REMINDER_SECONDS:-300}"

mkdir -p "${STATE_DIR}"

log() {
    printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" >>"${LOG_FILE}"
}

scalar() {
    local key="$1" text="$2"
    sed -n "s/^${key}:[[:space:]]*//p" <<<"${text}" | head -n 1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

find_claude_session() {
    local candidate
    if [[ -n "${JOBHUNTER_CLAUDE_TMUX_SESSION:-}" ]] && tmux has-session -t "${JOBHUNTER_CLAUDE_TMUX_SESSION}" 2>/dev/null; then
        printf '%s' "${JOBHUNTER_CLAUDE_TMUX_SESSION}"
        return 0
    fi
    for candidate in job-hunter-claude claude-job-hunter claude; do
        if tmux has-session -t "${candidate}" 2>/dev/null; then
            printf '%s' "${candidate}"
            return 0
        fi
    done
    return 1
}

run_once() {
    local remote_ref directive ack directive_id directive_status instruction_file requires_ack
    local last_applied ack_status blocker_class continuity_violation
    local session fingerprint old_id old_fp old_sent now age message prefix

    if [[ ! -d "${REPO_DIR}/.git" ]]; then
        log "ERROR repo unavailable: ${REPO_DIR}"
        return 2
    fi

    if ! git -C "${REPO_DIR}" fetch --quiet "${REMOTE}" "${BRANCH}"; then
        log "ERROR git fetch failed: ${REMOTE}/${BRANCH}"
        return 3
    fi

    remote_ref="${REMOTE}/${BRANCH}"
    directive="$(git -C "${REPO_DIR}" show "${remote_ref}:${DIRECTIVE_PATH}" 2>/dev/null || true)"
    [[ -n "${directive}" ]] || { log "directive file not present on ${remote_ref}"; return 0; }

    directive_id="$(scalar directive_id "${directive}")"
    directive_status="$(scalar status "${directive}")"
    instruction_file="$(scalar instruction_file "${directive}")"
    requires_ack="$(scalar requires_ack "${directive}")"

    if [[ -z "${directive_id}" || -z "${instruction_file}" ]]; then
        log "ERROR malformed directive pointer"
        return 4
    fi
    [[ "${directive_status}" == "ACTIVE" ]] || return 0

    if ! git -C "${REPO_DIR}" cat-file -e "${remote_ref}:${instruction_file}" 2>/dev/null; then
        log "ERROR directive ${directive_id} references missing ${instruction_file}"
        return 5
    fi
    if ! git -C "${REPO_DIR}" cat-file -e "${remote_ref}:${CONTINUITY_POLICY_PATH}" 2>/dev/null; then
        log "ERROR continuity policy missing on ${remote_ref}: ${CONTINUITY_POLICY_PATH}"
        return 7
    fi

    ack="$(git -C "${REPO_DIR}" show "${remote_ref}:${ACK_PATH}" 2>/dev/null || true)"
    last_applied="$(scalar last_applied_directive_id "${ack}")"
    ack_status="$(scalar status "${ack}")"
    blocker_class="$(scalar blocker_class "${ack}")"

    continuity_violation=false
    if [[ "${ack_status}" == BLOCKED* ]]; then
        case "${blocker_class:-}" in
            BLOCKED_PRODUCT_DECISION|BLOCKED_HUMAN_PERMISSION) continuity_violation=false ;;
            *) continuity_violation=true ;;
        esac
    fi

    if [[ "${last_applied}" == "${directive_id}" && "${continuity_violation}" != true ]]; then
        return 0
    fi

    fingerprint="$(printf '%s\n%s\n%s\n%s\n' "${directive}" "${instruction_file}" "${ack_status}" "${blocker_class}" | sha256sum | awk '{print $1}')"
    old_id=""; old_fp=""; old_sent=0
    if [[ -f "${SENT_FILE}" ]]; then
        # shellcheck disable=SC1090
        source "${SENT_FILE}"
        old_id="${DIRECTIVE_ID:-}"
        old_fp="${FINGERPRINT:-}"
        old_sent="${SENT_AT:-0}"
    fi

    now="$(date -u +%s)"
    age=$((now - old_sent))
    if [[ "${old_id}" == "${directive_id}" && "${old_fp}" == "${fingerprint}" && "${age}" -lt "${REMINDER_SECONDS}" ]]; then
        return 0
    fi

    if ! session="$(find_claude_session)"; then
        log "PENDING ${directive_id}: no Claude tmux session found; set JOBHUNTER_CLAUDE_TMUX_SESSION"
        return 6
    fi

    prefix=""
    if [[ "${continuity_violation}" == true ]]; then
        prefix="EXECUTION CONTINUITY VIOLATION: ACK status=${ack_status:-unset}, blocker_class=${blocker_class:-unset}. Park technical blockers and continue authorized work. "
    fi

    message="${prefix}Job Hunter PRODUCT ARCHITECT directive ${directive_id} is ACTIVE on ${remote_ref}. Before the next orchestration state transition: inspect ${DIRECTIVE_PATH}; read ${instruction_file}; enforce ${CONTINUITY_POLICY_PATH}; reconcile with Product Owner decisions; update ${ACK_PATH}; commit and push ACK/evidence. Gemini/Codex do not receive Product Architect directives directly; Claude remains the sole ACTIVE_ORCHESTRATOR. requires_ack=${requires_ack}."

    tmux send-keys -t "${session}" -l -- "${message}"
    tmux send-keys -t "${session}" Enter

    cat >"${SENT_FILE}" <<EOF
DIRECTIVE_ID='${directive_id}'
FINGERPRINT='${fingerprint}'
SENT_AT='${now}'
EOF
    log "SENT ${directive_id} -> tmux:${session}"
}

main() {
    exec 9>"${LOCK_FILE}"
    flock -n 9 || exit 0
    if [[ "${1:-}" == "--daemon" ]]; then
        log "daemon started poll=${POLL_SECONDS}s"
        while true; do
            run_once || true
            sleep "${POLL_SECONDS}"
        done
    fi
    run_once
}

main "$@"
