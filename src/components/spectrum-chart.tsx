'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { ZoomIn, RotateCcw } from 'lucide-react';
import { DistributionParams, calculateDistribution, normalizeDistribution } from '@/lib/distributions';

interface SpectrumData {
  compound_id: string;
  wavelength: number;
  coefficient?: number;
  normalized?: number;
}

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
  data: SpectrumData[];
}

interface SpectrumChartProps {
  data: SelectedSpectrum[];
  isLoading?: boolean;
  distributions?: DistributionParams[];
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

const DISTRIBUTION_COLORS = [
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#d97706', // amber-600
];

export function SpectrumChart({ data, isLoading, distributions = [] }: SpectrumChartProps) {
  const [isNormalized, setIsNormalized] = useState(false);
  
  // Zoom state following the working example pattern
  const [zoomState, setZoomState] = useState({
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    top: 'dataMax+1',
    bottom: 'dataMin-1',
    animation: true,
  });

  // Zoom functions following the working example pattern
  const zoom = () => {
    let { refAreaLeft, refAreaRight } = zoomState;

    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setZoomState(prevState => ({
        ...prevState,
        refAreaLeft: '',
        refAreaRight: '',
      }));
      return;
    }

    // xAxis domain
    if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

    setZoomState(prevState => ({
      ...prevState,
      refAreaLeft: '',
      refAreaRight: '',
      left: refAreaLeft,
      right: refAreaRight,
    }));
  };

  const zoomOut = () => {
    setZoomState(prevState => ({
      ...prevState,
      refAreaLeft: '',
      refAreaRight: '',
      left: 'dataMin',
      right: 'dataMax',
      top: 'dataMax+1',
      bottom: 'dataMin-1',
    }));
  };

  const { left, right, refAreaLeft, refAreaRight, animation } = zoomState;

  // Calculate distribution data
  const distributionData = useMemo(() => {
    if (distributions.length === 0) return [];
    
    return distributions.map(params => {
      const rawDistribution = calculateDistribution(params);
      return {
        params,
        data: isNormalized ? normalizeDistribution(rawDistribution) : rawDistribution
      };
    });
  }, [distributions, isNormalized]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spectrum Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spectrum Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-muted-foreground">
              Select spectra to view comparison
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have valid data
  const validData = data.filter(spectrum => spectrum.data && spectrum.data.length > 0);
  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spectrum Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-muted-foreground">
              No valid spectrum data available
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to normalize values to 0-1 scale
  const normalizeValue = (value: number, min: number, max: number): number => {
    if (max === min) return 0.5; // If all values are the same, center at 0.5
    return (value - min) / (max - min);
  };

  // Transform data for Recharts - simpler approach
  const chartData: any[] = [];
  
  // Get all unique wavelengths from all spectra and distribution
  const allWavelengths = new Set<number>();
  validData.forEach(({ data: spectrumData }) => {
    spectrumData.forEach(point => allWavelengths.add(point.wavelength));
  });
  
  // Add distribution wavelengths if available
  distributionData.forEach(({ data }) => {
    data.forEach(point => allWavelengths.add(point.wavelength));
  });
  
  // Sort wavelengths
  const sortedWavelengths = Array.from(allWavelengths).sort((a, b) => a - b);
  
  // If normalization is enabled, find min/max for each spectrum
  const spectrumRanges: { [key: string]: { min: number; max: number } } = {};
  if (isNormalized) {
    validData.forEach(({ compound, type, data: spectrumData }) => {
      const key = `${compound.name} (${type})`;
      const values = spectrumData.map(point => {
        const value = type === 'absorption' ? point.coefficient : point.normalized;
        return value || 0;
      }).filter(v => v !== null && v !== undefined);
      
      if (values.length > 0) {
        spectrumRanges[key] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });
  }
  
  // Create data points for each wavelength
  sortedWavelengths.forEach(wavelength => {
    const dataPoint: any = { wavelength };
    
    // Add data for each spectrum
    validData.forEach(({ compound, type, data: spectrumData }) => {
      const point = spectrumData.find(p => p.wavelength === wavelength);
      if (point) {
        let value = type === 'absorption' ? point.coefficient : point.normalized;
        
        // Normalize if enabled
        if (isNormalized && value !== null && value !== undefined) {
          const key = `${compound.name} (${type})`;
          const range = spectrumRanges[key];
          if (range) {
            value = normalizeValue(value, range.min, range.max);
          }
        }
        
        dataPoint[`${compound.name} (${type})`] = value;
      }
    });
    
    // Add distribution data if available
    distributionData.forEach(({ params, data }) => {
      const distributionPoint = data.find(p => p.wavelength === wavelength);
      if (distributionPoint) {
        const distributionName = `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Distribution ${distributions.indexOf(params) + 1}`;
        dataPoint[distributionName] = distributionPoint.intensity;
      }
    });
    
    chartData.push(dataPoint);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spectrum Comparison</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              title="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant={isNormalized ? "default" : "outline"}
              size="sm"
              onClick={() => setIsNormalized(!isNormalized)}
            >
              {isNormalized ? "Show Raw Data" : "Normalize (0-1)"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseDown={(e) => setZoomState(prevState => ({ ...prevState, refAreaLeft: e.activeLabel ?? '' }))}
            onDoubleClick={() => setZoomState({
              left: 'dataMin',
              right: 'dataMax',
              refAreaLeft: '',
              refAreaRight: '',
              top: 'dataMax+1',
              bottom: 'dataMin-1',
              animation: true,
            })}
            onMouseMove={(e) => zoomState.refAreaLeft && setZoomState(prevState => ({ ...prevState, refAreaRight: e.activeLabel ?? '' }))}
            onMouseUp={zoom}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="wavelength" 
              label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -10 }}
              allowDataOverflow
              domain={[left, right]}
              type="number"
            />
            <YAxis 
              label={{ 
                value: isNormalized ? 'Normalized Value (0-1)' : 'Value', 
                angle: -90, 
                position: 'insideLeft' 
              }}
              allowDataOverflow
              type="number"
            />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? (isNormalized ? value.toFixed(3) : value.toFixed(2)) : value,
                name
              ]}
              labelFormatter={(label) => `${label} nm`}
            />
            <Legend />
            {validData.map(({ compound, type }, index) => {
              const dataKey = `${compound.name} (${type})`;
              const color = COLORS[index % COLORS.length];
              
              return (
                <Line
                  key={`${compound.id}-${type}`}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 1, fill: color }}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 1 }}
                  connectNulls={true}
                  name={`${compound.name} (${type})`}
                  animationDuration={animation ? 300 : 0}
                />
              );
            })}
            
            {/* Distribution lines */}
            {distributionData.map(({ params, data }, index) => {
              const distributionName = `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Distribution ${index + 1}`;
              const color = DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
              
              return (
                <Line
                  key={`distribution-${index}`}
                  type="monotone"
                  dataKey={distributionName}
                  stroke={color}
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 1 }}
                  connectNulls={true}
                  name={distributionName}
                  animationDuration={animation ? 300 : 0}
                />
              );
            })}
            
            {refAreaLeft && refAreaRight ? (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
