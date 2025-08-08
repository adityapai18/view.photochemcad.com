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

interface SpectrumDashboardProps {
  selectedSpectra?: SelectedSpectrum[];
}