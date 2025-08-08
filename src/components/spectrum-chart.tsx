'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

export function SpectrumChart({ data, isLoading }: SpectrumChartProps) {
  const [isNormalized, setIsNormalized] = useState(false);

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
  
  // Get all unique wavelengths from all spectra
  const allWavelengths = new Set<number>();
  validData.forEach(({ data: spectrumData }) => {
    spectrumData.forEach(point => allWavelengths.add(point.wavelength));
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
    
    chartData.push(dataPoint);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spectrum Comparison</CardTitle>
          <Button
            variant={isNormalized ? "default" : "outline"}
            size="sm"
            onClick={() => setIsNormalized(!isNormalized)}
          >
            {isNormalized ? "Show Raw Data" : "Normalize (0-1)"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="wavelength" 
              label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ 
                value: isNormalized ? 'Normalized Value (0-1)' : 'Value', 
                angle: -90, 
                position: 'insideLeft' 
              }}
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
                  // strokeDasharray={lineStyle === 'dashed' ? '5,5' : 
                  //                  lineStyle === 'dotted' ? '2,2' : '0'}
                  dot={{ r: 1, fill: color }}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 1 }}
                  connectNulls={true}
                  name={`${compound.name} (${type})`}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
