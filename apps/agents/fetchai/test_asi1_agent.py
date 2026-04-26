from __future__ import annotations

import argparse
import json
import os
import uuid

import requests
from dotenv import load_dotenv


load_dotenv()


def main() -> None:
    parser = argparse.ArgumentParser(description="Smoke-test an Agentverse agent through ASI:One.")
    parser.add_argument("agent_address")
    parser.add_argument(
        "prompt",
        nargs="?",
        default=(
            "I am a Mandarin-speaking patient in Los Angeles with Aetna Choice POS II. "
            "My wearable shows resting HR 78 bpm, HRV 42 ms, sleep score 65/100, "
            "and I have felt tired for three days. Find a cardiology appointment, "
            "check insurance, and prepare the clinic-ready intake."
        ),
    )
    args = parser.parse_args()
    api_key = os.getenv("ASI1_API_KEY") or os.getenv("FETCHAI_API_KEY")
    if not api_key:
        raise SystemExit("Set ASI1_API_KEY in apps/agents/fetchai/.env first.")

    response = requests.post(
        "https://api.asi1.ai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "x-session-id": f"aida-smoke-{uuid.uuid4()}",
        },
        json={
            "model": "asi1",
            "agent_address": args.agent_address,
            "messages": [{"role": "user", "content": args.prompt}],
            "max_tokens": 900,
        },
        timeout=45,
    )
    print(response.status_code)
    print(json.dumps(response.json(), indent=2))


if __name__ == "__main__":
    main()

