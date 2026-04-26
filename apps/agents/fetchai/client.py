from __future__ import annotations

import os
from datetime import datetime
from uuid import uuid4

from dotenv import load_dotenv
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import ChatAcknowledgement, ChatMessage, TextContent


load_dotenv()

ORCHESTRATOR_ADDRESS = os.getenv(
    "AIDA_ORCHESTRATOR_AGENT_ADDRESS",
    "agent1qfpmrjtza2fqnm0mlqa7ex3lzxf0f56yxdghttw7g5jlv3re6su8w6tzu25",
)

agent = Agent(name="aida-local-client", seed="aida-local-client-demo-seed", port=8020)
protocol = Protocol()


@agent.on_event("startup")
async def send_message(ctx: Context) -> None:
    prompt = (
        "I am a Mandarin-speaking patient in Los Angeles with Aetna Choice POS II. "
        "My wearable shows resting HR 78 bpm, HRV 42 ms, sleep score 65/100, "
        "and I have felt tired for three days. Find a cardiology appointment, "
        "check insurance, and prepare the clinic-ready intake."
    )
    await ctx.send(
        ORCHESTRATOR_ADDRESS,
        ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=prompt)],
        ),
    )


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.info("Got acknowledgement from %s for %s", sender, msg.acknowledged_msg_id)


@protocol.on_message(ChatMessage)
async def handle_response(ctx: Context, sender: str, msg: ChatMessage) -> None:
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info("Response from %s: %s", sender, item.text)
    ctx.stop()


agent.include(protocol)
agent.run()

