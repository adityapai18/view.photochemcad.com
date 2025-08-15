'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DistributionParams } from '@/lib/distributions';
import { Plus, X, Settings } from 'lucide-react';

interface DistributionModalProps {
  distributions: DistributionParams[];
  onDistributionsChange: (distributions: DistributionParams[]) => void;
}

export function DistributionModal({ distributions, onDistributionsChange }: DistributionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentDistribution, setCurrentDistribution] = useState<DistributionParams>({
    type: 'gaussian',
    lowWavelength: 200,
    highWavelength: 800,
  });

  const resetForm = () => {
    setCurrentDistribution({
      type: 'gaussian',
      lowWavelength: 200,
      highWavelength: 800,
    });
    setEditingIndex(null);
  };

  const handleAddDistribution = () => {
    if (editingIndex !== null) {
      // Update existing distribution
      const newDistributions = [...distributions];
      newDistributions[editingIndex] = currentDistribution;
      onDistributionsChange(newDistributions);
    } else {
      // Add new distribution
      onDistributionsChange([...distributions, currentDistribution]);
    }
    resetForm();
  };

  const handleEditDistribution = (index: number) => {
    setCurrentDistribution(distributions[index]);
    setEditingIndex(index);
  };

  const handleDeleteDistribution = (index: number) => {
    const newDistributions = distributions.filter((_, i) => i !== index);
    onDistributionsChange(newDistributions);
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className='mb-4'>
          <Settings className="h-4 w-4 mr-2" />
          Manage Distributions {distributions.length > 0 && `(${distributions.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Distribution Comparison Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Distributions List */}
          <div className="space-y-3">
            <Label>Current Distributions</Label>
            {distributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No distributions added yet.</p>
            ) : (
              <div className="space-y-2">
                {distributions.map((dist, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{dist.type}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({dist.lowWavelength}-{dist.highWavelength} nm)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDistribution(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDistribution(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Distribution Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingIndex !== null ? 'Edit Distribution' : 'Add New Distribution'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Distribution Type */}
              <div className="space-y-2">
                <Label htmlFor="distribution-type">Distribution Type</Label>
                <Select 
                  value={currentDistribution.type} 
                  onValueChange={(value) => setCurrentDistribution({
                    ...currentDistribution,
                    type: value as 'blackbody' | 'gaussian' | 'lorentzian'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select distribution type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blackbody">Blackbody Radiation</SelectItem>
                    <SelectItem value="gaussian">Gaussian Distribution</SelectItem>
                    <SelectItem value="lorentzian">Lorentzian Distribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Common Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="low-wavelength">Low Wavelength (nm)</Label>
                  <Input
                    id="low-wavelength"
                    type="number"
                    min="0"
                    max="100000"
                    value={currentDistribution.lowWavelength}
                    onChange={(e) => setCurrentDistribution({
                      ...currentDistribution,
                      lowWavelength: parseFloat(e.target.value) || 200
                    })}
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
                    value={currentDistribution.highWavelength}
                    onChange={(e) => setCurrentDistribution({
                      ...currentDistribution,
                      highWavelength: parseFloat(e.target.value) || 800
                    })}
                    placeholder="800"
                  />
                </div>
              </div>

              {/* Blackbody Parameters */}
              {currentDistribution.type === 'blackbody' && (
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (Kelvin)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentDistribution.temperature || 5776}
                    onChange={(e) => setCurrentDistribution({
                      ...currentDistribution,
                      temperature: parseFloat(e.target.value) || 5776
                    })}
                    placeholder="5776"
                  />
                  <p className="text-sm text-muted-foreground">
                    Note: The Sun's photosphere is 5776 K.
                  </p>
                </div>
              )}

              {/* Gaussian Parameters */}
              {currentDistribution.type === 'gaussian' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="peak-wavelength">Peak Wavelength (nm)</Label>
                      <Input
                        id="peak-wavelength"
                        type="number"
                        min="0"
                        value={currentDistribution.peakWavelength || 300}
                        onChange={(e) => setCurrentDistribution({
                          ...currentDistribution,
                          peakWavelength: parseFloat(e.target.value) || 300
                        })}
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
                        value={currentDistribution.standardDeviation || 20}
                        onChange={(e) => setCurrentDistribution({
                          ...currentDistribution,
                          standardDeviation: parseFloat(e.target.value) || 20
                        })}
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
                      value={currentDistribution.gaussianMultiplier || 1}
                      onChange={(e) => setCurrentDistribution({
                        ...currentDistribution,
                        gaussianMultiplier: parseFloat(e.target.value) || 1
                      })}
                      placeholder="1"
                    />
                  </div>
                </div>
              )}

              {/* Lorentzian Parameters */}
              {currentDistribution.type === 'lorentzian' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lorentzian-peak-wavelength">Peak Wavelength (nm)</Label>
                      <Input
                        id="lorentzian-peak-wavelength"
                        type="number"
                        min="0"
                        value={currentDistribution.lorentzianPeakWavelength || 300}
                        onChange={(e) => setCurrentDistribution({
                          ...currentDistribution,
                          lorentzianPeakWavelength: parseFloat(e.target.value) || 300
                        })}
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
                        value={currentDistribution.fwhm || 20}
                        onChange={(e) => setCurrentDistribution({
                          ...currentDistribution,
                          fwhm: parseFloat(e.target.value) || 20
                        })}
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
                      value={currentDistribution.lorentzianMultiplier || 1}
                      onChange={(e) => setCurrentDistribution({
                        ...currentDistribution,
                        lorentzianMultiplier: parseFloat(e.target.value) || 1
                      })}
                      placeholder="1"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddDistribution} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingIndex !== null ? 'Update Distribution' : 'Add Distribution'}
                </Button>
                {editingIndex !== null && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={handleCancel}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
