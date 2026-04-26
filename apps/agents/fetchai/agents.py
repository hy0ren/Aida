from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import uuid4

from dotenv import load_dotenv
from openai import OpenAI
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)


load_dotenv()

JsonDict = dict[str, Any]
ASI1_API_KEY = os.getenv("ASI1_API_KEY", "")


def ensure_event_loop() -> None:
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())


def asi1_client() -> OpenAI | None:
    if not ASI1_API_KEY:
        return None
    return OpenAI(base_url="https://api.asi1.ai/v1", api_key=ASI1_API_KEY)


@dataclass(frozen=True)
class AgentConfig:
    key: str
    name: str
    seed_env: str
    port_env: str
    default_port: int
    handler: Callable[[JsonDict, str], JsonDict]


CLINICS: list[JsonDict] = [
    {
        "id": "clinic-mission-heart",
        "name": "Mission Heart & Vascular",
        "doctor": "Dr. Ruth Okonkwo",
        "specialty": "Cardiology",
        "address": "2100 Market St, Los Angeles, CA",
        "phone": "+1 415 555 0191",
        "distance": "1.1 mi",
        "next_available": "2026-05-07T09:00:00-07:00",
        "network_status": "in-network",
        "languages": ["English", "Spanish", "Mandarin"],
        "accepted_carriers": ["aetna", "blue shield", "united"],
        "copay": 25,
    },
    {
        "id": "clinic-bayview-family",
        "name": "Bayview Family Medicine",
        "doctor": "Dr. Lin Chen",
        "specialty": "General Practitioner",
        "address": "1840 Mission St, Los Angeles, CA",
        "phone": "+1 415 555 0184",
        "distance": "0.4 mi",
        "next_available": "2026-05-06T14:30:00-07:00",
        "network_status": "in-network",
        "languages": ["English", "Spanish", "Korean", "Mandarin"],
        "accepted_carriers": ["aetna", "medi-cal", "blue shield"],
        "copay": 20,
    },
    {
        "id": "clinic-sunset-internal",
        "name": "Sunset Internal Medicine",
        "doctor": "Dr. Paula Vasquez",
        "specialty": "Internal Medicine",
        "address": "1201 Irving St, Los Angeles, CA",
        "phone": "+1 415 555 0117",
        "distance": "2.0 mi",
        "next_available": "2026-05-08T11:00:00-07:00",
        "network_status": "review-plan",
        "languages": ["English", "Spanish"],
        "accepted_carriers": ["united", "cigna"],
        "copay": 40,
    },
]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    content: list[Any] = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(timestamp=utc_now(), msg_id=uuid4(), content=content)


def text_from_message(message: ChatMessage) -> str:
    parts: list[str] = []
    for item in message.content:
        if isinstance(item, TextContent):
            parts.append(item.text)
        elif getattr(item, "type", None) == "text" and hasattr(item, "text"):
            parts.append(str(item.text))
    return "\n".join(parts).strip()


def extract_json(text: str) -> JsonDict:
    text = text.strip()
    if not text:
        return {}
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {"value": parsed}
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {"intent": text}
    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else {"value": parsed}
    except json.JSONDecodeError:
        return {"intent": text}


def envelope(data: JsonDict, intent: str, source: str) -> JsonDict:
    return {
        "ok": True,
        "intent": intent,
        "source": source,
        "generated_at": utc_now().isoformat(),
        **data,
    }


def find_clinic(provider_id: str | None, specialty: str | None = None) -> JsonDict:
    if provider_id:
        for clinic in CLINICS:
            if clinic["id"] == provider_id:
                return clinic
    if specialty:
        specialty_lower = specialty.lower()
        for clinic in CLINICS:
            if specialty_lower in clinic["specialty"].lower():
                return clinic
    return CLINICS[0]


def handle_insurance(payload: JsonDict, raw_text: str) -> JsonDict:
    insurance = payload.get("insurance_details") or payload.get("insurance") or {}
    if not isinstance(insurance, dict):
        insurance = {}
    provider_id = str(payload.get("provider_id") or payload.get("providerId") or "")
    clinic = find_clinic(provider_id or None)
    carrier = str(insurance.get("carrier") or "Aetna").strip().lower()
    eligible = carrier in clinic["accepted_carriers"]

    return envelope(
        {
            "eligible": eligible,
            "carrier": insurance.get("carrier") or "Aetna",
            "plan": insurance.get("plan") or "Choice POS II",
            "member_id": insurance.get("member_id") or insurance.get("memberId") or "DEMO-482-19-7720",
            "group_number": insurance.get("group_number") or insurance.get("groupNumber") or "884216",
            "estimated_copay": clinic["copay"] if eligible else 60,
            "network_status": "in-network" if eligible else "review-plan",
            "message": (
                f"{clinic['name']} accepts this plan. Estimated copay is ${clinic['copay']}."
                if eligible
                else f"{clinic['name']} may be out of network. Manual plan review recommended."
            ),
        },
        "verify_insurance",
        "aida-insurance-agent",
    )


def handle_scheduler(payload: JsonDict, raw_text: str) -> JsonDict:
    specialty = str(payload.get("specialty") or "cardiology")
    location = str(payload.get("location") or "Los Angeles, CA")
    language = str(payload.get("language") or "English")
    specialty_lower = specialty.lower()
    ranked = sorted(
        CLINICS,
        key=lambda c: (
            0 if specialty_lower in c["specialty"].lower() else 1,
            0 if language in c["languages"] else 1,
            c["distance"],
        ),
    )
    providers = [
        {
            "id": clinic["id"],
            "name": clinic["name"],
            "doctor": clinic["doctor"],
            "specialty": clinic["specialty"],
            "address": clinic["address"].replace("Los Angeles, CA", location),
            "phone": clinic["phone"],
            "distance": clinic["distance"],
            "next_available": clinic["next_available"],
            "network_status": clinic["network_status"],
            "languages": sorted(set([*clinic["languages"], language, "English"])),
        }
        for clinic in ranked
    ]
    return envelope(
        {
            "recommended_visit": (
                "Cardiology screening recommended based on elevated resting heart rate, lower HRV, and fatigue."
                if "cardio" in specialty_lower
                else "Primary care visit recommended to review flagged biometric trends."
            ),
            "providers": providers,
            "selected_slot": providers[0]["next_available"],
        },
        "find_providers",
        "aida-scheduler-agent",
    )


def handle_translator(payload: JsonDict, raw_text: str) -> JsonDict:
    language = str(payload.get("language") or payload.get("target_language") or "Spanish")
    patient_text = str(payload.get("patient_text") or payload.get("text") or raw_text)
    summary = str(payload.get("summary") or "Resting heart rate is elevated compared with baseline.")
    receipts = {
        "Spanish": "Aida encontro una clinica y esta llamando para confirmar tu cita.",
        "Korean": "Aida가 진료 예약을 확인하기 위해 병원에 전화하고 있습니다.",
        "Mandarin": "Aida 正在联系诊所以确认您的预约。",
        "Chinese": "Aida 正在联系诊所以确认您的预约。",
    }
    return envelope(
        {
            "detected_language": language,
            "clinic_ready_english": (
                "Patient reports fatigue for three days with wearable data showing elevated resting heart rate, "
                "lower HRV, and reduced sleep. Patient approved sharing this summary for scheduling and intake."
            ),
            "patient_language_receipt": receipts.get(
                language,
                "Aida is contacting the clinic to confirm your appointment.",
            ),
            "normalized_patient_intent": patient_text,
            "summary_used": summary,
        },
        "translate_intake",
        "aida-translator-agent",
    )


def maybe_ask_asi1(system_prompt: str, user_prompt: str) -> str | None:
    client = asi1_client()
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model="asi1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=900,
        )
        return str(response.choices[0].message.content or "").strip()
    except Exception:
        return None


def handle_orchestrator(payload: JsonDict, raw_text: str) -> JsonDict:
    language = str(payload.get("language") or "Mandarin")
    specialty = str(payload.get("specialty") or "cardiology")
    patient_id = str(payload.get("patient_id") or "patient-demo")
    insurance = handle_insurance(
        {
            "provider_id": payload.get("provider_id") or "clinic-mission-heart",
            "patient_id": patient_id,
            "insurance_details": payload.get("insurance_details")
            or {
                "carrier": "Aetna",
                "plan": "Choice POS II",
                "member_id": "DEMO-482-19-7720",
                "group_number": "884216",
            },
        },
        raw_text,
    )
    scheduler = handle_scheduler(
        {
            "location": payload.get("location") or "Los Angeles, CA",
            "specialty": specialty,
            "language": language,
            "summary_id": payload.get("summary_id") or "summary-demo",
        },
        raw_text,
    )
    translator = handle_translator(
        {
            "language": language,
            "patient_text": payload.get("patient_text") or raw_text,
            "summary": payload.get("summary")
            or "Resting HR 78 bpm, HRV 42 ms, sleep score 65/100, fatigue for three days.",
        },
        raw_text,
    )
    answer = maybe_ask_asi1(
        "You are Aida's Agentverse orchestration agent. Be concise. Explain the executable outcome: provider found, insurance checked, and call-ready intake created.",
        json.dumps({"request": raw_text, "insurance": insurance, "scheduler": scheduler, "translator": translator}),
    )
    return envelope(
        {
            "answer": answer
            or (
                "Aida found an in-network cardiology option, verified insurance, prepared English clinic intake, "
                "and produced patient-language confirmation text. The next action is to start the outbound scheduling call."
            ),
            "insurance": insurance,
            "scheduler": scheduler,
            "translator": translator,
            "next_action": "Trigger ElevenLabs outbound call to confirm the selected slot with the clinic.",
        },
        "book_medical_appointment",
        "aida-orchestrator-agent",
    )


AGENTS: dict[str, AgentConfig] = {
    "orchestrator": AgentConfig("orchestrator", "aida-orchestrator-agent", "AIDA_ORCHESTRATOR_AGENT_SEED", "AIDA_ORCHESTRATOR_AGENT_PORT", 8010, handle_orchestrator),
    "insurance": AgentConfig("insurance", "aida-insurance-agent", "AIDA_INSURANCE_AGENT_SEED", "AIDA_INSURANCE_AGENT_PORT", 8011, handle_insurance),
    "scheduler": AgentConfig("scheduler", "aida-scheduler-agent", "AIDA_SCHEDULER_AGENT_SEED", "AIDA_SCHEDULER_AGENT_PORT", 8012, handle_scheduler),
    "translator": AgentConfig("translator", "aida-translator-agent", "AIDA_TRANSLATOR_AGENT_SEED", "AIDA_TRANSLATOR_AGENT_PORT", 8013, handle_translator),
}


def build_agent(config: AgentConfig) -> Agent:
    seed = os.getenv(config.seed_env)
    if not seed:
        raise RuntimeError(f"{config.seed_env} is required. Copy .env.example to .env and set a private seed.")
    ensure_event_loop()
    port = int(os.getenv(config.port_env, str(config.default_port)))
    agent = Agent(name=config.name, seed=seed, port=port, mailbox=True, publish_agent_details=True)
    protocol = Protocol(spec=chat_protocol_spec)

    @protocol.on_message(ChatMessage)
    async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage) -> None:
        await ctx.send(sender, ChatAcknowledgement(timestamp=utc_now(), acknowledged_msg_id=msg.msg_id))
        raw_text = text_from_message(msg)
        payload = extract_json(raw_text)
        ctx.logger.info("Received %s request from %s: %s", config.key, sender, raw_text)
        response = config.handler(payload, raw_text)
        await ctx.send(sender, create_text_chat(json.dumps(response, separators=(",", ":")), end_session=True))

    @protocol.on_message(ChatAcknowledgement)
    async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
        ctx.logger.info("Acknowledgement from %s for %s", sender, msg.acknowledged_msg_id)

    agent.include(protocol, publish_manifest=True)
    return agent


def print_addresses() -> None:
    for key, config in AGENTS.items():
        agent = build_agent(config)
        print(f"{key}: {agent.address}")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {*AGENTS.keys(), "addresses"}:
        names = ", ".join([*AGENTS.keys(), "addresses"])
        raise SystemExit(f"Usage: python agents.py <{names}>")
    if sys.argv[1] == "addresses":
        print_addresses()
        return
    agent = build_agent(AGENTS[sys.argv[1]])
    print(f"Starting {agent.name} at address {agent.address}")
    agent.run()


if __name__ == "__main__":
    main()

