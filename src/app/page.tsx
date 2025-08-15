import { Suspense } from 'react';
import { SpectrumDashboard } from '@/components/pages/spectrum-dashboard';
import { getCompounds, getAbsorptionData, getEmissionData, getCompoundFromId, EmissionData, AbsorptionData, getDatabases } from '@/lib/database';
import { DistributionParams } from '@/lib/distributions';

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

function getInitialDistributionParams(searchParams: SearchParams): DistributionParams[] {
  const distributions: DistributionParams[] = [];
  
  // Find all distribution parameters
  const distributionIndices = new Set<number>();
  Object.keys(searchParams).forEach(key => {
    if (key.startsWith('dist') && key.includes('Type')) {
      const index = parseInt(key.replace('dist', '').replace('Type', ''), 10);
      if (!isNaN(index)) {
        distributionIndices.add(index);
      }
    }
  });
  
  // Parse each distribution
  Array.from(distributionIndices).sort((a, b) => a - b).forEach(index => {
    const prefix = `dist${index}`;
    const distributionType = searchParams[`${prefix}Type`] as string;
    
    if (!distributionType) return;
    
    const params: DistributionParams = {
      type: distributionType as 'blackbody' | 'gaussian' | 'lorentzian',
      lowWavelength: parseFloat(searchParams[`${prefix}LowWavelength`] as string) || 200,
      highWavelength: parseFloat(searchParams[`${prefix}HighWavelength`] as string) || 800,
    };

    switch (distributionType) {
      case 'blackbody':
        params.temperature = parseFloat(searchParams[`${prefix}Temperature`] as string) || 5776;
        break;
      case 'gaussian':
        params.peakWavelength = parseFloat(searchParams[`${prefix}PeakWavelength`] as string) || 300;
        params.standardDeviation = parseFloat(searchParams[`${prefix}StandardDeviation`] as string) || 20;
        params.gaussianMultiplier = parseFloat(searchParams[`${prefix}GaussianMultiplier`] as string) || 1;
        break;
      case 'lorentzian':
        params.lorentzianPeakWavelength = parseFloat(searchParams[`${prefix}LorentzianPeakWavelength`] as string) || 300;
        params.fwhm = parseFloat(searchParams[`${prefix}Fwhm`] as string) || 20;
        params.lorentzianMultiplier = parseFloat(searchParams[`${prefix}LorentzianMultiplier`] as string) || 1;
        break;
    }
    
    distributions.push(params);
  });

  return distributions;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {

  const params = await searchParams;
  const initialSpectra = getInitialSpectra(params);
  const initialDistributionParams = getInitialDistributionParams(params);
  const databases = getDatabases();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SpectrumDashboard 
        selectedSpectra={initialSpectra} 
        databases={databases} 
        initialDistributionParams={initialDistributionParams}
      />
    </Suspense>
  );
}
