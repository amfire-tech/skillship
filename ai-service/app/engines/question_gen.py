"""
File:    ai-service/app/engines/question_gen.py
Purpose: Generate MCQ/TF/SHORT questions using Gemini JSON mode.
"""

import logging
import uuid
from pathlib import Path
from typing import Optional

from google import genai
from google.genai import types

from app.config import settings
from app.schemas.common import Difficulty, Option, Question, QuestionType
from app.utils.json import parse_llm_json

logger = logging.getLogger(__name__)

_PROMPT_TEMPLATE = (
    Path(__file__).parent.parent / "prompts" / "question_gen.md"
).read_text(encoding="utf-8")


def _build_prompt(topic, grade, count, difficulty, q_types, course_context) -> str:
    type_labels = ", ".join(t.value.upper() for t in q_types)
    context_block = f"\nAdditional course context:\n{course_context}\n" if course_context else ""
    replacements = {
        "{topic}": topic,
        "{grade}": grade,
        "{count}": str(count),
        "{difficulty}": difficulty.value,
        "{types}": type_labels,
        "{course_context_block}": context_block,
    }
    prompt = _PROMPT_TEMPLATE
    for placeholder, value in replacements.items():
        prompt = prompt.replace(placeholder, value)
    return prompt


def _parse(raw: str, requested_count: Optional[int] = None) -> list[Question]:
    data = parse_llm_json(raw, expected="array")
    questions: list[Question] = []
    for item in data:
        q_type = QuestionType(item["type"])
        options = [Option(id=str(o["id"]), text=str(o["text"])) for o in item.get("options", [])]
        question = Question(
            id=str(uuid.uuid4()),
            text=str(item["text"]).strip(),
            type=q_type,
            options=options,
            correct_option_ids=[str(option_id) for option_id in item.get("correct_option_ids", [])],
            difficulty=Difficulty(item.get("difficulty", "medium")),
            tags=[str(tag) for tag in item.get("tags", [])],
            rubric=str(item.get("rubric", "")),
        )
        _validate_question(question)
        questions.append(question)

    if requested_count is not None and len(questions) != requested_count:
        raise ValueError(f"Expected {requested_count} questions, got {len(questions)}.")
    return questions


def _validate_question(question: Question) -> None:
    if not question.text:
        raise ValueError("Question text must not be empty.")
    if question.type == QuestionType.MCQ:
        if len(question.options) != 4:
            raise ValueError("MCQ questions must have exactly 4 options.")
        if len(question.correct_option_ids) != 1:
            raise ValueError("MCQ questions must have exactly one correct option.")
    elif question.type == QuestionType.TF:
        option_ids = {option.id for option in question.options}
        if option_ids != {"True", "False"}:
            raise ValueError("TF questions must have True and False options.")
        if len(question.correct_option_ids) != 1:
            raise ValueError("TF questions must have exactly one correct option.")
    elif question.type == QuestionType.SHORT:
        if question.options or question.correct_option_ids:
            raise ValueError("SHORT questions must not include options or correct_option_ids.")
        if not question.rubric:
            raise ValueError("SHORT questions must include a rubric.")


def _mock_questions(
    topic: str,
    count: int,
    difficulty: Difficulty,
    types_: list[QuestionType],
) -> list[Question]:
    questions: list[Question] = []
    for index in range(count):
        q_type = types_[index % len(types_)]
        if q_type == QuestionType.TF:
            options = [
                Option(id="True", text="True"),
                Option(id="False", text="False"),
            ]
            correct_option_ids = ["True"]
            rubric = ""
            text = f"{topic} practice statement {index + 1}."
        elif q_type == QuestionType.SHORT:
            options = []
            correct_option_ids = []
            rubric = (
                f"Check whether the answer explains the key idea of {topic} "
                "clearly with one relevant example."
            )
            text = f"Explain one important concept related to {topic}."
        else:
            options = [
                Option(id="A", text="A correct concept"),
                Option(id="B", text="A common misconception"),
                Option(id="C", text="An unrelated idea"),
                Option(id="D", text="A partially correct idea"),
            ]
            correct_option_ids = ["A"]
            rubric = ""
            text = f"Which option best describes {topic}?"

        questions.append(
            Question(
                id=str(uuid.uuid4()),
                text=text,
                type=q_type,
                options=options,
                correct_option_ids=correct_option_ids,
                difficulty=difficulty,
                tags=[topic.lower(), "mock"],
                rubric=rubric,
            )
        )
    return questions


async def generate(
    client: genai.Client,
    topic: str,
    grade: str,
    count: int = 5,
    difficulty: Difficulty = Difficulty.MEDIUM,
    types_: Optional[list[QuestionType]] = None,
    course_context: str = "",
) -> list[Question]:
    if types_ is None:
        types_ = [QuestionType.MCQ]

    if settings.USE_MOCK_AI:
        logger.info("Mock mode enabled; generated %d mock questions on '%s'", count, topic)
        return _mock_questions(topic=topic, count=count, difficulty=difficulty, types_=types_)

    prompt = _build_prompt(topic, grade, count, difficulty, types_, course_context)

    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    questions = _parse(response.text, requested_count=count)
    logger.info("Generated %d questions on '%s' (%s)", len(questions), topic, difficulty.value)
    return questions
