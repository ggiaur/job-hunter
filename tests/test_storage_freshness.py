from datetime import UTC, datetime, timedelta
from tools.storage import JobStorage, canonical_url

def job(url="https://board.test/1?utm_source=x", description="first"):
    return {"source":"board","source_job_id":"1","url":url,"title":"IT Manager","company":"A","location":"Budapest","description":description}

def test_canonical_tracking_url_and_fingerprint_change_re_evaluates():
    store=JobStorage(mock_mode=True); one=store.observe(job()); store.mark_notified(job())
    same=store.observe(job("https://board.test/1?utm_campaign=y")); changed=store.observe(job(description="changed"))
    assert canonical_url(job()["url"]) == "https://board.test/1"
    assert one["changed"] and same["already_notified"] and changed["changed"] and not changed["already_notified"]

def test_stale_after_14_days_and_rediscovery_reopens():
    store=JobStorage(mock_mode=True); start=datetime(2026,1,1,tzinfo=UTC); store.observe(job(),start)
    assert store.expire_stale(start+timedelta(days=14)) == 1
    result=store.observe(job(),start+timedelta(days=15))
    assert result["reopened"] and result["record"]["state"] == "open"
