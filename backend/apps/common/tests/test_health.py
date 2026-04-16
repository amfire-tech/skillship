"""
File:    backend/apps/common/tests/test_health.py
Purpose: Smoke test — GET /healthz/ returns 200 with db + redis ok.
Why:     The very first test in the project; also proves pytest+Django is wired correctly.
Owner:   Navanish
TODO:    @pytest.mark.django_db def test_healthz_ok(client): ... assert 200 and body["status"] == "ok".
"""
