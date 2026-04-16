<!--
File:    docs/ai/agents.md
Purpose: High-level map of every AI agent — what it does, inputs, outputs, tools.
Owner:   Navanish
-->

# Agent map

| Agent           | Input                                        | Output                                    | Tools         |
| --------------- | -------------------------------------------- | ----------------------------------------- | ------------- |
| CareerPilot     | student_context + question + history         | answer + suggested_paths + confidence     | fetch_scores, fetch_interests, search_courses |
| Tutor           | question + course + chat_history             | answer + references                       | retriever.retrieve |
| Content         | title + description + kind + file_url        | tags + summary + grade_level              | chunker, retriever |
| Analyst         | school_snapshot                               | summary_md + highlights + concerns        | (none — pure text) |
| Risk            | [{student, recent_stats, ...}]               | [{student_id, level, kind, reason}]       | rules_engine  |
| Orchestrator    | intent + payload                             | delegates to one of the above             | —             |
