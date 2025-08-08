import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'database', 'photochemcad.sqlite');

export interface Compound {
  id: string;
  name: string;
  slug: string;
  database_name: string;
  category_name: string;
  has_absorption_data: string;
  has_emission_data: string;
}

export interface AbsorptionData {
  compound_id: string;
  wavelength: number;
  coefficient: number;
}

export interface EmissionData {
  compound_id: string;
  wavelength: number;
  normalized: number;
}

export function getDatabase() {
  try {
    const db = new Database(dbPath);
    return db;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

export function getCompounds(): Compound[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, slug, database_name, category_name, 
           has_absorption_data, has_emission_data
    FROM compounds 
    WHERE (has_absorption_data = '1' OR has_emission_data = '1')
    ORDER BY name
  `);
  return stmt.all() as Compound[];
}

export function getCompoundFromId(id: string): Compound | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, slug, database_name, category_name, 
           has_absorption_data, has_emission_data
    FROM compounds 
    WHERE id = ?
  `);
  return stmt.get(id) as Compound | null;
}

export function getAbsorptionData(compoundId: string): AbsorptionData[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT compound_id, wavelength, coefficient
    FROM compounds_absorptions
    WHERE compound_id = ?
    ORDER BY wavelength
  `);
  return stmt.all(compoundId) as AbsorptionData[];
}

export function getEmissionData(compoundId: string): EmissionData[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT compound_id, wavelength, normalized
    FROM compounds_emissions
    WHERE compound_id = ?
    ORDER BY wavelength
  `);
  return stmt.all(compoundId) as EmissionData[];
}

export function searchCompounds(query: string): Compound[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, slug, database_name, category_name, 
           has_absorption_data, has_emission_data
    FROM compounds 
    WHERE (has_absorption_data = '1' OR has_emission_data = '1')
    AND (name LIKE ? OR id LIKE ?)
    ORDER BY name
    LIMIT 50
  `);
  const searchTerm = `%${query}%`;
  const results = stmt.all(searchTerm, searchTerm) as Compound[];
  return results;
}
