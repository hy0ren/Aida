import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { demoSmsResponse } from '../_mock/aida-demo';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      console.warn("Twilio credentials missing. Falling back to mock SMS dispatch.");
      return NextResponse.json({
        ok: true,
        data: {
          ...demoSmsResponse,
          appointmentId: body.appointmentId ?? demoSmsResponse.appointmentId,
        },
      });
    }

    const client = twilio(accountSid, authToken);
    const toPhone = body.to || "+1234567890";
    const language = body.language || "English";
    const messageBody = `Aida: Your appointment is confirmed! Join us at ${body.clinicName || 'the clinic'} on ${body.dateTime || 'the scheduled date'}. (Language: ${language})`;

    const message = await client.messages.create({
      body: messageBody,
      from: fromPhone,
      to: toPhone
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...demoSmsResponse,
        smsId: message.sid,
        appointmentId: body.appointmentId ?? demoSmsResponse.appointmentId,
        to: toPhone,
        language: language,
        status: 'sent',
        message: messageBody,
      },
    });
  } catch (error) {
    console.error("Twilio Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to dispatch SMS." }, { status: 500 });
  }
}
