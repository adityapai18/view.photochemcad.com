'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Search, Plus } from 'lucide-react';

interface CompoundSelectorProps {
  onSpectrumAdd: (spectrum: SelectedSpectrum) => void;
  onSpectrumRemove: (compoundId: string, type: 'absorption' | 'emission') => void;
  selectedSpectra: SelectedSpectrum[];
}

export function CompoundSelector({ onSpectrumAdd, onSpectrumRemove, selectedSpectra }: CompoundSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompounds, setSelectedCompounds] = useState<Compound[]>([]);

  // Get selected compounds from URL parameters
  useEffect(() => {
    setSelectedCompounds(
      Array.from(
      new Map(selectedSpectra.map(s => [s.compound.id, s.compound])).values()
      )
    );
  }, [selectedSpectra]);

  useEffect(() => {
    const fetchCompounds = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/compounds?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setCompounds(data);
        }
      } catch (error) {
        console.error('Error fetching compounds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchCompounds();
      } else {
        setCompounds([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCompoundClick = (compound: Compound) => {
    const exists = selectedCompounds.some(c => c.id === compound.id);
    if (!exists) {
      setSelectedCompounds(prev => [...prev, compound]);
    }
    setSearchQuery('');
    setCompounds([]);
  };

  const handleCheckboxChange = (compound: Compound, type: 'absorption' | 'emission', checked: boolean) => {
    if (checked) {
      onSpectrumAdd({
        compound, type,
        data: selectedSpectra.find(s => s.compound.id === compound.id && s.type === type)?.data || []
      });
    } else {
      onSpectrumRemove(compound.id, type);
    }
  };

  const handleRemoveCompound = (compoundId: string) => {
    setSelectedCompounds(prev => prev.filter(c => c.id !== compoundId));
    // Also remove any spectra for this compound
    selectedSpectra.forEach(spectrum => {
      if (spectrum.compound.id === compoundId) {
        onSpectrumRemove(compoundId, spectrum.type);
      }
    });
  };

  const isSpectrumSelected = (compoundId: string, type: 'absorption' | 'emission') => {
    // Check URL parameters for selected spectra
    return selectedSpectra.some(s => s.compound.id === compoundId && s.type === type) || false;
  };

  const isCompoundSelected = (compoundId: string) => {
    return selectedSpectra.some(c => c.compound.id === compoundId);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for compounds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          Searching...
        </div>
      )}

      {/* Search Results */}
      {compounds.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              <div className="p-2 text-sm text-muted-foreground">
                Found {compounds.length} compounds
              </div>
              {compounds.map((compound) => (
                <div
                  key={compound.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${isCompoundSelected(compound.id) ? 'bg-muted' : ''
                    }`}
                  onClick={() => handleCompoundClick(compound)}
                >
                  <div className="font-medium">{compound.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {compound.id} • {compound.category_name}
                  </div>
                  {isCompoundSelected(compound.id) && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Already selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Compounds with Checkboxes */}
      {selectedCompounds.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Compounds:</Label>
          <div className="space-y-2">
            {selectedCompounds.map((compound) => (
              <Card key={compound.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">{compound.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {compound.id} • {compound.category_name}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCompound(compound.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    {compound.has_absorption_data === '1' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`absorption-${compound.id}`}
                          checked={isSpectrumSelected(compound.id, 'absorption')}
                          onCheckedChange={(checked: boolean) =>
                            handleCheckboxChange(compound, 'absorption', checked)
                          }
                        />
                        <Label htmlFor={`absorption-${compound.id}`} className="text-sm">
                          Absorption
                        </Label>
                      </div>
                    )}
                    {compound.has_emission_data === '1' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`emission-${compound.id}`}
                          checked={isSpectrumSelected(compound.id, 'emission')}
                          onCheckedChange={(checked: boolean) =>
                            handleCheckboxChange(compound, 'emission', checked)
                          }
                        />
                        <Label htmlFor={`emission-${compound.id}`} className="text-sm">
                          Emission
                        </Label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
