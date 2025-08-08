import { NextRequest, NextResponse } from 'next/server';
import { getAbsorptionData, getEmissionData } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compoundId = searchParams.get('compound_id') || searchParams.get('compoundId');
    const type = searchParams.get('type'); // 'absorption' or 'emission'

    if (!compoundId || !type) {
      return NextResponse.json(
        { error: 'Missing compound_id/compoundId or type parameter' },
        { status: 400 }
      );
    }

    let data;
    if (type === 'absorption') {
      data = getAbsorptionData(compoundId);
    } else if (type === 'emission') {
      data = getEmissionData(compoundId);
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Use "absorption" or "emission"' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching spectra data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spectra data' },
      { status: 500 }
    );
  }
}
