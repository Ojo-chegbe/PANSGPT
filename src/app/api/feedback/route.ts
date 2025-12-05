import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain email or fallback to Resend's test domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PansGPT <onboarding@resend.dev>';

export async function POST(request: Request) {
  try {
    const { name, level, message } = await request.json();

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.FEEDBACK_EMAIL || 'ojochegbeng@gmail.com',
      subject: `New Feedback from ${name}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Level:</strong> ${level}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    if (error) {
      console.error('Error sending feedback:', error);
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending feedback:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback' },
      { status: 500 }
    );
  }
} 