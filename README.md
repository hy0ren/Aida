# Aida

Aida (Appointment Intelligence and Data Agent) is a mobile health app that helps patients turn biometric health data into a scheduled doctor's appointment.

The app is built for people who face friction when trying to get care, especially immigrants, people who do not speak English fluently, parents managing a child's chronic condition, and people who already have access to wearable or health data.

## What It Does

- Lets patients upload health data and insurance information.
- Summarizes biometric information in plain language.
- Supports multilingual patient communication.
- Helps search for providers and verify insurance.
- Uses an AI voice agent to help schedule appointments.
- Sends appointment confirmations through Expo push notifications and an in-app receipt.
- Gives providers access to approved patient intake summaries.

## Main User Flow

1. Patient signs up and verifies identity.
2. Patient selects a preferred language.
3. Patient uploads insurance and health data.
4. Aida generates a health summary.
5. Patient reviews and approves the summary.
6. Aida helps find a provider and book an appointment.
7. Patient receives an Expo confirmation notification and in-app receipt.
8. Provider sees the approved intake summary.

## Tech Stack

- **Mobile:** Expo, React Native, Expo Router, NativeWind
- **Backend:** Next.js API routes
- **Database:** MongoDB Atlas
- **AI Summary:** Google Gemini API (Gemini 2.5 Flash)
- **On-device AI:** ZETIC Melange
- **Voice Agent:** ElevenLabs
- **Calling:** Twilio voice infrastructure + ElevenLabs conversational agent
- **Messaging:** Expo push notifications
- **Identity:** World ID
- **Media Upload:** Cloudinary
- **Agents:** Fetch.ai Agentverse

## Project Structure

```text
Aida/
├── apps/
│   ├── mobile/       # Expo mobile app
│   └── web/          # Next.js backend and web app
├── packages/
│   └── shared/       # Shared TypeScript types
└── package.json
```

## Run Locally

Install dependencies:

```bash
npm install
```

Run the mobile app:

```bash
npm run mobile
```

Run the web/backend app:

```bash
npm run web
```

## Environment Variables

Create environment files as needed for the services you use:

```bash
EXPO_PUBLIC_API_URL=
MONGODB_URI=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_AGENT_PHONE_NUMBER_ID=
ELEVENLABS_LIVE_CALLS=false
ELEVENLABS_DEFAULT_TO_NUMBER=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
WORLD_ID_APP_ID=
WORLD_ID_ACTION_ID=
FETCHAI_API_KEY=
ZETIC_PROJECT_ID=
```

## Status

This project is currently in active hackathon development.
