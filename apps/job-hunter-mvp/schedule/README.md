# Job Hunter MVP — unattended schedule (definition only, not enabled)

This directory contains a systemd service + timer definition that runs the
exact same tested pipeline (`apps/job-hunter-mvp/run.mjs`) roughly twice a
week, matching Sprint 1's low-volume operating requirement, with no
notification/email/Telegram side effects — it only regenerates
`docs/evidence/real-job-hunter-mvp-live-run.json`.

**These units are provided as a definition only and have deliberately not
been installed or enabled** — activating a recurring unattended job that
consumes the SerpApi key automatically is a standing decision the Product
Owner should make explicitly, not something to switch on silently as a side
effect of a one-off MVP run. It also depends on a valid, non-expired
`SERPAPI_API_KEY` being present in `/home/dockeruser/.job-hunter-secrets/serpapi.env`
at run time (the current test key is expected to be rotated).

## To enable (manual, explicit action)

```bash
sudo cp job-hunter-mvp.service job-hunter-mvp.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now job-hunter-mvp.timer
```

## To check status / run once on demand

```bash
systemctl list-timers job-hunter-mvp.timer
sudo systemctl start job-hunter-mvp.service   # manual one-off trigger
journalctl -u job-hunter-mvp.service -n 50
```

## Schedule

`Mon,Thu 08:00` local time — twice a week, matching the Sprint 1 requirement.
Adjust the `OnCalendar=` line in `job-hunter-mvp.timer` if a different cadence
is wanted.
