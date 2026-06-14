"""
File:    backend/apps/quizzes/certificates.py
Purpose: Render a simple, Udemy-style "Certificate of Achievement" PDF for a
         passed quiz attempt. Generated on the fly (no file storage) and streamed
         to the student. Only called once the attempt is confirmed cert-eligible.
Owner:   Navanish
"""

from __future__ import annotations

import io
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

# Brand palette (matches the frontend tokens: primary green + accent orange).
_PRIMARY = colors.HexColor("#059669")
_ACCENT = colors.HexColor("#F97316")
_INK = colors.HexColor("#0F172A")
_MUTED = colors.HexColor("#64748B")

# Official brand marks (transparent PNGs extracted from the Skillship Logo PDF):
# the circular EDUTECH badge + the orange/teal "SKILLSHIP" wordmark in the
# registered brand font. Used as the certificate letterhead.
_ASSETS = os.path.join(os.path.dirname(__file__), "assets")
_BADGE_PNG = os.path.join(_ASSETS, "skillship-badge.png")
_WORDMARK_PNG = os.path.join(_ASSETS, "skillship-wordmark.png")


def _draw_centered_image(c, path: str, cx: float, top_y: float, width: float) -> float:
    """Draw a transparent PNG centred on `cx`, its TOP edge at `top_y`.

    Width is fixed; height follows the image's aspect ratio. Returns the drawn
    height so callers can stack the next element below it.
    """
    img = ImageReader(path)
    iw, ih = img.getSize()
    height = width * ih / iw
    c.drawImage(img, cx - width / 2, top_y - height, width=width, height=height,
                mask="auto", preserveAspectRatio=True)
    return height


def render_certificate_pdf(attempt) -> bytes:
    """Return the certificate PDF for `attempt` as bytes (landscape A4)."""
    student = attempt.student
    quiz = attempt.quiz
    school = quiz.school

    student_name = (student.get_full_name() or student.username or "Student").strip()
    school_name = getattr(school, "name", "") or "Skillship"
    score = int(round(float(attempt.score_percent))) if attempt.score_percent is not None else None
    issued = attempt.submitted_at or attempt.created_at
    issued_str = issued.strftime("%d %B %Y") if issued else ""
    cert_id = str(attempt.id)

    buf = io.BytesIO()
    W, H = landscape(A4)
    c = canvas.Canvas(buf, pagesize=landscape(A4))

    # ── Frame ────────────────────────────────────────────────────────────────
    c.setFillColor(colors.white)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(_PRIMARY)
    c.setLineWidth(3)
    c.rect(12 * mm, 12 * mm, W - 24 * mm, H - 24 * mm, fill=0, stroke=1)
    c.setStrokeColor(_ACCENT)
    c.setLineWidth(1)
    c.rect(16 * mm, 16 * mm, W - 32 * mm, H - 32 * mm, fill=0, stroke=1)

    cx = W / 2

    # ── Header: official Skillship badge + wordmark (brand logo & font) ───────
    # Embed the real brand marks; fall back to styled text if the asset files
    # are somehow missing so a certificate always renders.
    header_bottom = H - 40 * mm
    try:
        badge_h = _draw_centered_image(c, _BADGE_PNG, cx, H - 19 * mm, 19 * mm)
        wm_top = H - 19 * mm - badge_h - 3 * mm
        wm_h = _draw_centered_image(c, _WORDMARK_PNG, cx, wm_top, 54 * mm)
        header_bottom = wm_top - wm_h
    except Exception:
        c.setFillColor(_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(cx, H - 34 * mm, "SKILLSHIP")
        header_bottom = H - 38 * mm

    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 10)
    c.drawCentredString(cx, header_bottom - 6 * mm, school_name.upper())

    # ── Title ────────────────────────────────────────────────────────────────
    c.setFillColor(_INK)
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(cx, H - 70 * mm, "Certificate of Achievement")

    c.setStrokeColor(_ACCENT)
    c.setLineWidth(2)
    c.line(cx - 40 * mm, H - 74 * mm, cx + 40 * mm, H - 74 * mm)

    # ── Body ─────────────────────────────────────────────────────────────────
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 13)
    c.drawCentredString(cx, H - 86 * mm, "This is proudly presented to")

    c.setFillColor(_PRIMARY)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(cx, H - 100 * mm, student_name)

    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 13)
    c.drawCentredString(cx, H - 114 * mm, "for successfully completing")

    c.setFillColor(_INK)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(cx, H - 126 * mm, quiz.title)

    if score is not None:
        c.setFillColor(_ACCENT)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(cx, H - 137 * mm, f"with a score of {score}%")

    # ── Footer: date (left) + verification id (right) + signature line (center)
    base_y = 30 * mm
    c.setFillColor(_INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(30 * mm, base_y, issued_str)
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(30 * mm, base_y - 5 * mm, "Date issued")

    c.setFillColor(_INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(W - 30 * mm, base_y, "Skillship")
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 9)
    c.drawRightString(W - 30 * mm, base_y - 5 * mm, "Issued by")

    # Verification id along the very bottom.
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 7)
    c.drawCentredString(cx, 18 * mm, f"Certificate ID: {cert_id}")

    c.showPage()
    c.save()
    return buf.getvalue()
