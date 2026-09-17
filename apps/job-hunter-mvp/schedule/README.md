# Job Hunter MVP — unattended schedule

## Verified current state — 2026-09-16

The existing user crontab still contains the Monday/Thursday 08:00 entry below,
and `cron.service` is active. No schedule was added, enabled or changed during
the CV repair. The user systemd bus remains unavailable.

The wrapper invokes `run.mjs`, which now loads the CV and certificates and writes
both machine-readable results and human-readable `CURRENT_RESULTS.md` plus
`docs/evidence/current-cv-results.html`. Previously this scheduled entry point
only wrote JSON; that missing report refresh has been fixed.

This is local scheduling. It does not push to GitHub, email the user or submit
applications. The GitHub workflow definition is separate; local code edits alone
do not update the remote repository or its credentials.

## Installation history

**Update (JH-SUP-0023):** systemd could not be installed on this host — the
Job Hunter service account has no root/sudo access and no user-level
systemd/D-Bus session is running here. **A crontab entry was installed
instead**, calling the identical tested pipeline via `run-job-hunter-mvp.sh`:

```
0 8 * * 1,4 /srv/projects/job-hunter/apps/job-hunter-mvp/schedule/run-job-hunter-mvp.sh >>/home/dockeruser/job-hunter-mvp-cron.log 2>&1
```

Verify with `crontab -l`. Output/errors go to
`/home/dockeruser/job-hunter-mvp-cron.log`. `cron.service` was confirmed
active on this host at install time. The systemd unit/timer files below
remain available for a host with root access, but are not what is actually
scheduled here.

---

## Original systemd definition (not installed on this host — see above)

This directory contains a systemd service + timer definition that runs the
exact same tested pipeline (`apps/job-hunter-mvp/run.mjs`) roughly twice a
week, matching Sprint 1's low-volume operating requirement, with no
notification/email/Telegram side effects. Current outputs are
`docs/evidence/real-job-hunter-current-run.json`, dated snapshots, and the
HTML/Markdown reports described above.

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
