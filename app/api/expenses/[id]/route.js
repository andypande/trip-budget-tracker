import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const { id } = params;
  
  try {
    await sql`DELETE FROM expenses WHERE id = ${id}`;
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}