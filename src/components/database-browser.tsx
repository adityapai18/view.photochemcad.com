'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Database } from 'lucide-react';

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

interface DatabaseBrowserProps {
  onSpectrumAdd: (spectrum: { compound: Compound; type: 'absorption' | 'emission' }) => void;
  onSpectrumRemove: (compoundId: string, type: 'absorption' | 'emission') => void;
  selectedSpectra: SelectedSpectrum[];
  databases: { name: string, count: number }[]
}

export function DatabaseBrowser({ onSpectrumAdd, onSpectrumRemove, selectedSpectra, databases }: DatabaseBrowserProps) {
  const [databaseCompounds, setDatabaseCompounds] = useState<Record<string, Compound[]>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [selectedCompounds, setSelectedCompounds] = useState<Compound[]>([]);


  // Load compounds for a database when accordion opens
  const loadDatabaseCompounds = async (databaseName: string) => {
    if (databaseCompounds[databaseName]) return; // Already loaded

    setLoadingStates(prev => ({ ...prev, [databaseName]: true }));
    try {
      const response = await fetch(`/api/databases?database=${encodeURIComponent(databaseName)}&limit=15`);
      if (response.ok) {
        const data = await response.json();
        setDatabaseCompounds(prev => ({ ...prev, [databaseName]: data }));
      }
    } catch (error) {
      console.error('Error fetching compounds:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [databaseName]: false }));
    }
  };

  // Search compounds within a database
  const searchDatabaseCompounds = async (databaseName: string, query: string) => {
    if (!query.trim()) {
      // Reload initial compounds
      loadDatabaseCompounds(databaseName);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [databaseName]: true }));
    try {
      const response = await fetch(`/api/databases?database=${encodeURIComponent(databaseName)}&q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setDatabaseCompounds(prev => ({ ...prev, [databaseName]: data }));
      }
    } catch (error) {
      console.error('Error searching compounds:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [databaseName]: false }));
    }
  };

  // Update selected compounds from selectedSpectra
  useEffect(() => {
    setSelectedCompounds(
      Array.from(
        new Map(selectedSpectra.map(s => [s.compound.id, s.compound])).values()
      )
    );
  }, [selectedSpectra]);

  const handleCompoundClick = (compound: Compound) => {
    const exists = selectedCompounds.some(c => c.id === compound.id);
    if (!exists) {
      setSelectedCompounds(prev => [...prev, compound]);
    }
  };

  const handleCheckboxChange = (compound: Compound, type: 'absorption' | 'emission', checked: boolean) => {
    if (checked) {
      onSpectrumAdd({
        compound, type
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
    return selectedSpectra.some(s => s.compound.id === compoundId && s.type === type) || false;
  };

  const isCompoundSelected = (compoundId: string) => {
    return selectedSpectra.some(c => c.compound.id === compoundId);
  };

  const handleSearchChange = (databaseName: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [databaseName]: query }));

    // Debounced search
    const timeoutId = setTimeout(() => {
      searchDatabaseCompounds(databaseName, query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="space-y-4">
      {/* Database Browser with Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Browse Databases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {databases.map((database) => (
              <AccordionItem key={database.name} value={database.name}>
                <AccordionTrigger
                  className="text-left"
                  onClick={() => loadDatabaseCompounds(database.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{database.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({database.count} compounds)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {/* Search within database */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search compounds in this database..."
                        value={searchQueries[database.name] || ''}
                        onChange={(e) => handleSearchChange(database.name, e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Loading state */}
                    {loadingStates[database.name] && (
                      <div className="text-center text-sm text-muted-foreground">
                        Loading...
                      </div>
                    )}

                    {/* Compounds list */}
                    {databaseCompounds[database.name] && databaseCompounds[database.name].length > 0 && (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {databaseCompounds[database.name].map((compound) => (
                          <div
                            key={compound.id}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${isCompoundSelected(compound.id) ? 'bg-muted' : ''
                              }`}
                            onClick={() => handleCompoundClick(compound)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{compound.name}</div>
                                <div className="text-sm text-muted-foreground">{compound.id}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`absorption-${compound.id}`}
                                    checked={isSpectrumSelected(compound.id, 'absorption')}
                                    onCheckedChange={(checked: boolean) =>
                                      handleCheckboxChange(compound, 'absorption', checked)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label
                                    htmlFor={`absorption-${compound.id}`}
                                    className="text-xs cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Abs
                                  </label>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`emission-${compound.id}`}
                                    checked={isSpectrumSelected(compound.id, 'emission')}
                                    onCheckedChange={(checked: boolean) =>
                                      handleCheckboxChange(compound, 'emission', checked)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label
                                    htmlFor={`emission-${compound.id}`}
                                    className="text-xs cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Em
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {!loadingStates[database.name] &&
                      databaseCompounds[database.name] &&
                      databaseCompounds[database.name].length === 0 &&
                      searchQueries[database.name] && (
                        <div className="text-center text-sm text-muted-foreground">
                          No compounds found matching "{searchQueries[database.name]}"
                        </div>
                      )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Selected Compounds */}
      {selectedCompounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Compounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedCompounds.map((compound) => (
                <div key={compound.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{compound.name}</div>
                    <div className="text-sm text-muted-foreground">{compound.database_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`selected-absorption-${compound.id}`}
                        checked={isSpectrumSelected(compound.id, 'absorption')}
                        onCheckedChange={(checked: boolean) =>
                          handleCheckboxChange(compound, 'absorption', checked)
                        }
                      />
                      <label htmlFor={`selected-absorption-${compound.id}`} className="text-xs">
                        Absorption
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`selected-emission-${compound.id}`}
                        checked={isSpectrumSelected(compound.id, 'emission')}
                        onCheckedChange={(checked: boolean) =>
                          handleCheckboxChange(compound, 'emission', checked)
                        }
                      />
                      <label htmlFor={`selected-emission-${compound.id}`} className="text-xs">
                        Emission
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCompound(compound.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
