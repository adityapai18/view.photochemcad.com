'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompoundSelector } from '../compound-selector';
import { SpectrumChart } from '../spectrum-chart';



export function SpectrumDashboard({ selectedSpectra = [] }: SpectrumDashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Update URL when selectedSpectra changes (for sharing)
  // useEffect(() => {
  //   const params = new URLSearchParams();
  //   selectedSpectra.forEach((spectrum, index) => {
  //     params.append(`spectrum${index}`, `${spectrum.compound.id}:${spectrum.type}`);
  //   });

  //   const newUrl = params.toString() ? `?${params.toString()}` : '';
  //   router.replace(newUrl, { scroll: false });
  // }, [selectedSpectra, router]);

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportData}
            disabled={selectedSpectra.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
            }}
          >
            Share Link
          </Button>
        </div>
      </div>



      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compound Selector */}
        <div className="lg:col-span-1">
          <CompoundSelector
            onSpectrumAdd={handleSpectrumAdd}
            onSpectrumRemove={handleSpectrumRemove}
            selectedSpectra={selectedSpectra}
          />
        </div>

        {/* Spectrum Chart */}
        <div className="lg:col-span-2">
          <SpectrumChart data={selectedSpectra} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
