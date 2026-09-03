FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG WORKER_USER=worker
ARG WORKER_UID=1000
ARG WORKER_GID=1000

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    DISPLAY=:99 \
    XDG_RUNTIME_DIR=/tmp/runtime-worker \
    PATH=/home/worker/.local/bin:${PATH}

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    dbus-x11 \
    fonts-liberation \
    fonts-noto-color-emoji \
    openbox \
    python3 \
    procps \
    tini \
    x11-utils \
    x11vnc \
    xvfb \
    novnc \
    websockify \
    && rm -rf /var/lib/apt/lists/*

# Official Google Chrome, not Chromium.
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid ${WORKER_GID} ${WORKER_USER} \
    && useradd --uid ${WORKER_UID} --gid ${WORKER_GID} --create-home --shell /bin/bash ${WORKER_USER}

# Force-install the official Anthropic "Claude in Chrome" extension from the
# Chrome Web Store. The profile itself stays persistent in a Docker volume.
RUN mkdir -p /etc/opt/chrome/policies/managed \
    && cat > /etc/opt/chrome/policies/managed/claude-in-chrome.json <<'EOF'
{
  "ExtensionInstallForcelist": [
    "fcoeoabgfenejglbffodgkkbkcdhcgfn;https://clients2.google.com/service/update2/crx"
  ]
}
EOF

# Install current Claude Code using Anthropic's official Linux installer.
USER ${WORKER_USER}
RUN curl -fsSL https://claude.ai/install.sh | bash \
    && /home/${WORKER_USER}/.local/bin/claude --version

USER root
COPY entrypoint.sh /usr/local/bin/claude-chrome-entrypoint
COPY worker-status.sh /usr/local/bin/worker-status
COPY local-test.html /opt/claude-chrome-worker/local-test.html
RUN chmod 0755 /usr/local/bin/claude-chrome-entrypoint /usr/local/bin/worker-status \
    && mkdir -p /workspace/job-hunter /home/${WORKER_USER}/.config/google-chrome /home/${WORKER_USER}/.claude \
    && chown -R ${WORKER_USER}:${WORKER_USER} /workspace /home/${WORKER_USER}

USER ${WORKER_USER}
WORKDIR /workspace/job-hunter

EXPOSE 6080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=4 \
  CMD /usr/local/bin/worker-status --health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/claude-chrome-entrypoint"]
