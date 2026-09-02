from tools.analyzer import JobAnalyzer
from tools.feedback import FeedbackStore
from tools.notifier import TelegramNotifier
from models.job import JobListing

def test_feedback_store_creates_empty_runtime_history(tmp_path):
    path=tmp_path/"history.json"; store=FeedbackStore(str(path))
    assert store.load_feedbacks()==[] and path.exists()

def test_notifier_mock_and_html_escape():
    n=TelegramNotifier(mock_mode=True); message=n.format_job_message({"title":"A < B", "url":"https://x", "company":"C&D"},90,"ok")
    assert "A &lt; B" in message and "C&amp;D" in message and n.send_job_notification({"title":"x","url":"https://x"},90,"ok")

def test_job_model_legacy_serialization():
    assert JobListing(url="https://example.test/job",title="IT Manager").to_dict()["url"] == "https://example.test/job"

def test_mock_analyzer_preserves_deterministic_score():
    assert JobAnalyzer(mock_mode=True).analyze_job({"title":"IT Vezető", "description":""})["score"] == 90
