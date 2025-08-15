import { NextRequest, NextResponse } from 'next/server';
import { getDatabases, getCompoundsByDatabase, searchCompoundsInDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const databaseName = searchParams.get('database');
  const query = searchParams.get('q');
  const limit = searchParams.get('limit');

  try {
    if (databaseName) {
      // Get compounds for a specific database
      if (query) {
        // Search within database
        const compounds = searchCompoundsInDatabase(databaseName, query);
        return NextResponse.json(compounds);
      } else {
        // Get initial compounds for database
        const compounds = getCompoundsByDatabase(databaseName, parseInt(limit || '15'));
        return NextResponse.json(compounds);
      }
    }
  } catch (error) {
    console.error('Error fetching databases:', error);
    return NextResponse.json({ error: 'Failed to fetch databases' }, { status: 500 });
  }
}
