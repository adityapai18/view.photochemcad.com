'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatabaseBrowser } from '../database-browser';
import { SpectrumChart } from '../spectrum-chart';
import { DistributionModal } from '../distribution-modal';
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

interface SelectedSpectrum {
  compound: Compound;
  type: 'absorption' | 'emission';
  data: any[];
}

interface SpectrumDashboardProps {
  selectedSpectra?: SelectedSpectrum[];
  databases?: { name: string; count: number }[];
  initialDistributionParams?: DistributionParams[];
}



export function SpectrumDashboard({ selectedSpectra = [], databases = [], initialDistributionParams }: SpectrumDashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [distributions, setDistributions] = useState<DistributionParams[]>(initialDistributionParams || []);

  const handleSpectrumAdd = async (spectrum: { compound: Compound; type: 'absorption' | 'emission' }) => {
    // Get current spectra from URL params
    const params = new URLSearchParams(window.location.search);
    let found = false;
    let maxIndex = -1;
    for (const [key, value] of params.entries()) {
      if (key.startsWith('spectrum')) {
        const [id, type] = value.split(':');
        if (id === spectrum.compound.id && type === spectrum.type) {
          found = true;
        }
        const idx = parseInt(key.replace('spectrum', ''), 10);
        if (!isNaN(idx) && idx > maxIndex) {
          maxIndex = idx;
        }
      }
    }
    if (found) return;

    // Always use a new index (maxIndex + 1)
    const nextIndex = maxIndex + 1;
    params.append(`spectrum${nextIndex}`, `${spectrum.compound.id}:${spectrum.type}`);

    // Redirect with updated params
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(newUrl, { scroll: false });
  };

  const handleSpectrumRemove = (compoundId: string, type: 'absorption' | 'emission') => {
    // Get current spectra from URL params
    const params = new URLSearchParams(window.location.search);

    // Remove spectrum param
    for (const [key, value] of params.entries()) {
      if (key.startsWith('spectrum')) {
        const [id, spectrumType] = value.split(':');
        if (id === compoundId && spectrumType === type) {
          params.delete(key);
          break;
        }
      }
    }

    // Redirect with updated params only if there are params left
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;

    router.replace(newUrl, { scroll: false });
  };

  const handleDistributionsChange = useCallback((newDistributions: DistributionParams[]) => {
    setDistributions(newDistributions);

    // Update URL with distribution parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Remove ALL existing distribution parameters (including old indexed ones)
    const allKeys = Array.from(urlParams.keys());
    allKeys.forEach(key => {
      if (key.startsWith('dist') || key === 'distributionType' || key === 'lowWavelength' ||
        key === 'highWavelength' || key === 'temperature' || key === 'peakWavelength' ||
        key === 'standardDeviation' || key === 'gaussianMultiplier' ||
        key === 'lorentzianPeakWavelength' || key === 'fwhm' || key === 'lorentzianMultiplier') {
        urlParams.delete(key);
      }
    });

    // Add all distributions to URL with proper indexing
    newDistributions.forEach((params, index) => {
      const prefix = `dist${index}`;
      urlParams.set(`${prefix}Type`, params.type);
      urlParams.set(`${prefix}LowWavelength`, params.lowWavelength.toString());
      urlParams.set(`${prefix}HighWavelength`, params.highWavelength.toString());

      switch (params.type) {
        case 'blackbody':
          if (params.temperature) urlParams.set(`${prefix}Temperature`, params.temperature.toString());
          break;
        case 'gaussian':
          if (params.peakWavelength) urlParams.set(`${prefix}PeakWavelength`, params.peakWavelength.toString());
          if (params.standardDeviation) urlParams.set(`${prefix}StandardDeviation`, params.standardDeviation.toString());
          if (params.gaussianMultiplier) urlParams.set(`${prefix}GaussianMultiplier`, params.gaussianMultiplier.toString());
          break;
        case 'lorentzian':
          if (params.lorentzianPeakWavelength) urlParams.set(`${prefix}LorentzianPeakWavelength`, params.lorentzianPeakWavelength.toString());
          if (params.fwhm) urlParams.set(`${prefix}Fwhm`, params.fwhm.toString());
          if (params.lorentzianMultiplier) urlParams.set(`${prefix}LorentzianMultiplier`, params.lorentzianMultiplier.toString());
          break;
      }
    });

    const newUrl = urlParams.toString() ? `?${urlParams.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const exportData = () => {
    if (selectedSpectra.length === 0) return;

    let csvContent = 'Wavelength (nm)';
    selectedSpectra.forEach(spectrum => {
      csvContent += `,${spectrum.compound.name} (${spectrum.type})`;
    });
    csvContent += '\n';

    // Get all unique wavelengths
    const allWavelengths = new Set<number>();
    selectedSpectra.forEach(({ data }) => {
      data.forEach(point => allWavelengths.add(point.wavelength));
    });

    const sortedWavelengths = Array.from(allWavelengths).sort((a, b) => a - b);

    sortedWavelengths.forEach(wavelength => {
      csvContent += wavelength;
      selectedSpectra.forEach(({ data }) => {
        const point = data.find(p => p.wavelength === wavelength);
        csvContent += `,${point ? (point.coefficient || point.normalized || '') : ''}`;
      });
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spectrum_comparison.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Spectrum Comparison Dashboard</h1>
          <p className="text-muted-foreground">
            Compare absorption and emission spectra from the PhotochemCAD database
          </p>
        </div>
      </div>



      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Compound Selector */}
        <div className="xl:col-span-2">
          <DatabaseBrowser
            databases={databases}
            onSpectrumAdd={handleSpectrumAdd}
            onSpectrumRemove={handleSpectrumRemove}
            selectedSpectra={selectedSpectra}
          />
        </div>

        {/* Spectrum Chart */}
        <div className="xl:col-span-3">
          <DistributionModal
            distributions={distributions}
            onDistributionsChange={handleDistributionsChange}
          />
          <SpectrumChart
            data={selectedSpectra}
            isLoading={isLoading}
            distributions={distributions}
          />
        </div>
      </div>
    </div>
  );
}
