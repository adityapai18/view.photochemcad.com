import { Suspense } from 'react';
import { SpectrumDashboard } from '@/components/pages/spectrum-dashboard';
import { getCompounds, getAbsorptionData, getEmissionData, getCompoundFromId, EmissionData, AbsorptionData, getDatabases } from '@/lib/database';

interface Compound {
  id: string;
  name: string;
  slug: string;
  database_name: string;
  category_name: string;
  has_absorption_data: string;
  has_emission_data: string;
}

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

function getInitialSpectra(searchParams: SearchParams) {
  const spectra: { compound: Compound, type: "absorption" | "emission", data: EmissionData[] | AbsorptionData[] }[] = [];

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

        if (compound && data && data.length > 0) {
          spectra.push({
            compound,
            type: type as "absorption" | "emission",
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
  const initialSpectra = getInitialSpectra(params);
  const databases = getDatabases();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SpectrumDashboard selectedSpectra={initialSpectra} databases={databases} />
    </Suspense>
  );
}
