'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DistributionParams } from '@/lib/distributions';

interface DistributionSelectorProps {
  onDistributionChange: (params: DistributionParams | null) => void;
  initialParams?: DistributionParams;
}

export function DistributionSelector({ onDistributionChange, initialParams }: DistributionSelectorProps) {
  const [distributionType, setDistributionType] = useState<'blackbody' | 'gaussian' | 'lorentzian' | 'none'>(
    initialParams?.type || 'none'
  );
  
  // Common parameters
  const [lowWavelength, setLowWavelength] = useState(initialParams?.lowWavelength?.toString() || '200');
  const [highWavelength, setHighWavelength] = useState(initialParams?.highWavelength?.toString() || '800');
  
  // Blackbody parameters
  const [temperature, setTemperature] = useState(initialParams?.temperature?.toString() || '5776');
  
  // Gaussian parameters
  const [peakWavelength, setPeakWavelength] = useState(initialParams?.peakWavelength?.toString() || '300');
  const [standardDeviation, setStandardDeviation] = useState(initialParams?.standardDeviation?.toString() || '20');
  const [gaussianMultiplier, setGaussianMultiplier] = useState(initialParams?.gaussianMultiplier?.toString() || '1');
  
  // Lorentzian parameters
  const [lorentzianPeakWavelength, setLorentzianPeakWavelength] = useState(initialParams?.lorentzianPeakWavelength?.toString() || '300');
  const [fwhm, setFwhm] = useState(initialParams?.fwhm?.toString() || '20');
  const [lorentzianMultiplier, setLorentzianMultiplier] = useState(initialParams?.lorentzianMultiplier?.toString() || '1');

  const isInitialized = useRef(false);

  // Handle initial parameters
  useEffect(() => {
    if (initialParams && !isInitialized.current) {
      isInitialized.current = true;
      onDistributionChange(initialParams);
    }
  }, [initialParams, onDistributionChange]);

  // Update distribution when parameters change
  useEffect(() => {
    // Skip the first render to prevent infinite loop
    if (!isInitialized.current) {
      return;
    }

    if (distributionType === 'none') {
      onDistributionChange(null);
      return;
    }

    const params: DistributionParams = {
      type: distributionType,
      lowWavelength: parseFloat(lowWavelength) || 200,
      highWavelength: parseFloat(highWavelength) || 800,
    };

    switch (distributionType) {
      case 'blackbody':
        params.temperature = parseFloat(temperature) || 5776;
        break;
      case 'gaussian':
        params.peakWavelength = parseFloat(peakWavelength) || 300;
        params.standardDeviation = parseFloat(standardDeviation) || 20;
        params.gaussianMultiplier = parseFloat(gaussianMultiplier) || 1;
        break;
      case 'lorentzian':
        params.lorentzianPeakWavelength = parseFloat(lorentzianPeakWavelength) || 300;
        params.fwhm = parseFloat(fwhm) || 20;
        params.lorentzianMultiplier = parseFloat(lorentzianMultiplier) || 1;
        break;
    }

    onDistributionChange(params);
  }, [
    distributionType,
    lowWavelength,
    highWavelength,
    temperature,
    peakWavelength,
    standardDeviation,
    gaussianMultiplier,
    lorentzianPeakWavelength,
    fwhm,
    lorentzianMultiplier
    // Removed onDistributionChange from dependencies to prevent infinite loop
  ]);

  const handleTypeChange = (value: string) => {
    setDistributionType(value as 'blackbody' | 'gaussian' | 'lorentzian' | 'none');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribution Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="distribution-type">Distribution Type</Label>
          <Select value={distributionType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select distribution type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Distribution</SelectItem>
              <SelectItem value="blackbody">Blackbody Radiation</SelectItem>
              <SelectItem value="gaussian">Gaussian Distribution</SelectItem>
              <SelectItem value="lorentzian">Lorentzian Distribution</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {distributionType !== 'none' && (
          <>
            {/* Common Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="low-wavelength">Low Wavelength (nm)</Label>
                <Input
                  id="low-wavelength"
                  type="number"
                  min="0"
                  max="100000"
                  value={lowWavelength}
                  onChange={(e) => setLowWavelength(e.target.value)}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="high-wavelength">High Wavelength (nm)</Label>
                <Input
                  id="high-wavelength"
                  type="number"
                  min="0"
                  max="100000"
                  value={highWavelength}
                  onChange={(e) => setHighWavelength(e.target.value)}
                  placeholder="800"
                />
              </div>
            </div>

            {/* Blackbody Parameters */}
            {distributionType === 'blackbody' && (
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (Kelvin)</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="5776"
                />
                <p className="text-sm text-muted-foreground">
                  Note: The Sun's photosphere is 5776 K.
                </p>
              </div>
            )}

            {/* Gaussian Parameters */}
            {distributionType === 'gaussian' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peak-wavelength">Peak Wavelength (nm)</Label>
                    <Input
                      id="peak-wavelength"
                      type="number"
                      min="0"
                      value={peakWavelength}
                      onChange={(e) => setPeakWavelength(e.target.value)}
                      placeholder="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="standard-deviation">Standard Deviation (nm)</Label>
                    <Input
                      id="standard-deviation"
                      type="number"
                      min="0"
                      step="0.1"
                      value={standardDeviation}
                      onChange={(e) => setStandardDeviation(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gaussian-multiplier">Multiplier for Height at Peak</Label>
                  <Input
                    id="gaussian-multiplier"
                    type="number"
                    min="0"
                    step="0.1"
                    value={gaussianMultiplier}
                    onChange={(e) => setGaussianMultiplier(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            )}

            {/* Lorentzian Parameters */}
            {distributionType === 'lorentzian' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lorentzian-peak-wavelength">Peak Wavelength (nm)</Label>
                    <Input
                      id="lorentzian-peak-wavelength"
                      type="number"
                      min="0"
                      value={lorentzianPeakWavelength}
                      onChange={(e) => setLorentzianPeakWavelength(e.target.value)}
                      placeholder="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fwhm">FWHM (nm)</Label>
                    <Input
                      id="fwhm"
                      type="number"
                      min="0"
                      step="0.1"
                      value={fwhm}
                      onChange={(e) => setFwhm(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lorentzian-multiplier">Multiplier for Height at Peak</Label>
                  <Input
                    id="lorentzian-multiplier"
                    type="number"
                    min="0"
                    step="0.1"
                    value={lorentzianMultiplier}
                    onChange={(e) => setLorentzianMultiplier(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
