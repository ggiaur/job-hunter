#!/usr/bin/env bash
set -euo pipefail

QUERY="${1:-IT vezető}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "GATE0_BLOCKED: docker is not installed or not available in PATH" >&2
  exit 1
fi

mkdir -p evidence

echo "Building Sprint 1 on-prem Gate 0 image..."
docker build -f Dockerfile.gate0 -t job-hunter-sprint1-gate0 .

echo "Running exact-final-environment Gate 0 for query: $QUERY"
exec docker run --rm --init --ipc=host \
  -e "GATE0_QUERY=$QUERY" \
  -v "$SCRIPT_DIR/evidence:/evidence" \
  job-hunter-sprint1-gate0
