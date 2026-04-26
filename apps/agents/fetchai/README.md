# Aida Fetch.ai Agentverse Agents

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

These are Aida's Fetch.ai Agentverse agents. They run on your computer, connect to Agentverse through mailbox mode, and can be invoked from ASI:One Chat.

## Agents

- `aida-orchestrator-agent`: main judge-facing agent. It turns "book me a doctor" into insurance verification, provider matching, translation, and a call-ready next action.
- `aida-insurance-agent`: verifies insurance and returns copay/network status.
- `aida-scheduler-agent`: finds providers and available slots.
- `aida-translator-agent`: creates English clinic intake and patient-language receipt text.

## Setup

```bash
cd apps/agents/fetchai
make setup
cp .env.example .env
```

Fill `.env` with private seeds. If `.env` already exists, keep it.

## Run The Main Agent

```bash
make orchestrator
```

Open the printed Agent Inspector URL, then click **Connect** -> **Mailbox**.

Wait for logs like:

```text
Mailbox access token acquired
Successfully registered as mailbox agent in Agentverse
Agent details updated in Agentverse
```

## Optional: Run All Specialists

Use four terminals:

```bash
make orchestrator
make insurance
make scheduler
make translator
```

## Demo Prompt

```text
I am a Mandarin-speaking patient in Los Angeles with Aetna Choice POS II. My wearable shows resting HR 78 bpm, HRV 42 ms, sleep score 65/100, and I have felt tired for three days. Find a cardiology appointment, check insurance, and prepare the clinic-ready intake.
```

## Devpost Deliverables

- ASI:One chat session URL
- Agentverse profile URL for the orchestrator
- GitHub repo URL
- Demo video showing ASI:One invoking the Aida agent

## Agent Profile Copy

Name:

```text
Aida Medical Appointment Agent
```

Description:

```text
Aida turns patient biometric summaries, insurance details, and language preferences into a booking-ready doctor appointment plan. It verifies insurance, finds providers, prepares clinic-ready intake, and returns patient-language confirmation text.
```

Keywords:

```text
healthcare, appointment booking, insurance verification, medical scheduling, multilingual, patient access, Aida
```

