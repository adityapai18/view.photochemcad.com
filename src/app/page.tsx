import { Suspense } from 'react';
import { SpectrumDashboard } from '@/components/pages/spectrum-dashboard';
import { getCompounds, getAbsorptionData, getEmissionData, getCompoundFromId } from '@/lib/database';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

async function getInitialSpectra(searchParams: SearchParams) {
  const spectra: any[] = [];

  // Find all spectrum parameters regardless of numbering
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key.startsWith('spectrum') && typeof value === 'string') {

      const [compoundId, type] = value.split(':');


      if (!compoundId || !type) return;

      try {
        // Get compound info
        const compound = getCompoundFromId(compoundId);
        // Get spectrum data
        let data;
        if (type === 'absorption') {
          data = getAbsorptionData(compoundId);
        } else if (type === 'emission') {
          data = getEmissionData(compoundId);
        }

        if (data && data.length > 0) {
          spectra.push({
            compound,
            type,
            data
          });
        }
      } catch (error) {
        console.error(`Error loading spectrum ${value}:`, error);
      }
    }
  });

  return spectra;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {

  const params = await searchParams;
  const initialSpectra = await getInitialSpectra(params);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SpectrumDashboard selectedSpectra={initialSpectra} />
    </Suspense>
  );
}
