import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT * FROM expenses
      ORDER BY date DESC, id DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { amount, description, date } = await request.json();
    
    const { rows } = await sql`
      INSERT INTO expenses (amount, description, date)
      VALUES (${amount}, ${description}, ${date})
      RETURNING *
    `;
    
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add expense' },
      { status: 500 }
    );
  }
}