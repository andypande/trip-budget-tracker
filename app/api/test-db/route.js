import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT NOW();`;
    return NextResponse.json({ 
      message: 'Database connection successful', 
      serverTime: rows[0].now 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database connection failed', 
      details: error.message 
    }, { status: 500 });
  }
}