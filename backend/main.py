from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class CodeRequest(BaseModel):
    code: str
    language: str = "unknown"

@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""You are a senior software engineer. Analyze the following {request.language} code and respond with ONLY a JSON object, no markdown, no explanation outside the JSON.

The JSON must follow this exact structure:
{{
  "explanation": "A plain English explanation of what the code does",
  "bugs": ["bug or issue 1", "bug or issue 2"],
  "improvements": ["improvement 1", "improvement 2"]
}}

If there are no bugs, return an empty array for bugs. Same for improvements.

Code:
{request.code}"""
            }
        ]
    )

    raw = message.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed = json.loads(raw)
    return parsed

class FixRequest(BaseModel):
    code: str
    language: str = "unknown"

@app.post("/fix")
async def fix_code(request: FixRequest):
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": f"""You are a senior software engineer. Fix the following {request.language} code.

Return ONLY the corrected code with no explanation, no markdown, no code fences, just the raw fixed code exactly as it should be written.

Code:
{request.code}"""
            }
        ]
    )

    raw = message.content[0].text.strip()

    # Strip code fences if Claude adds them anyway
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])

    return {"fixed": raw}