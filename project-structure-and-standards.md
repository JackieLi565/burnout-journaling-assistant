# Project Structure and Standards

**Purpose**  
Define how this repository is organized, how code is written, and how Git is used so all contributors follow a consistent workflow.

## Folder Hierarchy

frontend/
    src/
        components/
        pages/
        utils/
    public/
    tests/

backend/
    src/
        api/
        db/
        services/
        models/
    migrations/
    tests/

infra/
    docker/

docs/

scripts/


## Practices
Reusable UI components

## Tools
Gemini Live API: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api
-Live burnout check-ins: Ask users questions by voice/text and get immediate contextual responses.
-Natural journaling assistant: Create a “smart journal buddy” that helps users reflect on their day and surface emotional insights interactively.
-Live mood extraction + tools: Combine with function calling so when the user says “I feel overwhelmed with work stress,” our app saves that sentiment and triggers analytics updates in real time.

LangExtract: https://developers.googleblog.com/introducing-langextract-a-gemini-powered-information-extraction-library/
-Emotion & cause tagging: Turn natural journal text into structured sentiment tags (e.g., “frustrated at work” → {emotion: “frustration”, cause: “work”}).
-Trend extraction: Pull out regular patterns like recurring stress events or self-reported sleep hours.
-Dashboard data: Feed structured JSON outputs into analytics (e.g., daily/monthly burnout score trends).

Gemini 2.5 Flash: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash
-Free API Usage
