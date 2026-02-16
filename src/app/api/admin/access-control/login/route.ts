import { NextResponse } from 'next/server';

// Simple token generation (in production, use a proper JWT library)
function generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // Get credentials from environment variables
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'pansgpt2024';

        if (username === adminUsername && password === adminPassword) {
            const token = generateToken();
            return NextResponse.json({ token, success: true });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
