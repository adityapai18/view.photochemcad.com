import { NextRequest, NextResponse } from 'next/server';
import { getCompounds, searchCompounds } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let compounds;
    if (query) {
      compounds = searchCompounds(query);
    } else {
      compounds = getCompounds();
    }

    return NextResponse.json(compounds);
  } catch (error) {
    console.error('Error fetching compounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compounds' },
      { status: 500 }
    );
  }
}
