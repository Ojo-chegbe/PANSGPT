import { NextResponse } from 'next/server';
import { sendEmail, EMAIL_ADDRESSES } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const { name, level, message } = await request.json();

    const emailResult = await sendEmail({
      from: EMAIL_ADDRESSES.SUPPORT,
      to: process.env.FEEDBACK_EMAIL || 'ojochegbeng@gmail.com',
      subject: `New Feedback from ${name}`,
      text: `New Feedback Received\n\nName: ${name}\nLevel: ${level}\n\nMessage:\n${message}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Level:</strong> ${level}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    if (!emailResult.success) {
      console.error('Error sending feedback:', emailResult.error);
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