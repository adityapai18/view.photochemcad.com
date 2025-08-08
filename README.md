# PhotochemCAD Spectrum Comparison Dashboard

A Next.js dashboard for comparing absorption and emission spectra of multiple compounds from the PhotochemCAD database.

## Features

- **Compound Search**: Search and select compounds from the PhotochemCAD database
- **Spectrum Comparison**: Compare absorption and emission spectra of multiple compounds
- **Interactive Charts**: Beautiful, responsive charts using Recharts
- **Data Export**: Export comparison data as CSV files
- **Modern UI**: Built with shadcn/ui components for a clean, modern interface

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Recharts** - Chart library
- **better-sqlite3** - SQLite database access
- **Lucide React** - Icons

## Database Schema

The application connects to a SQLite database with the following key tables:

- `compounds` - Compound information and metadata
- `compounds_absorptions` - Absorption spectrum data
- `compounds_emissions` - Emission spectrum data

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Select Spectrum Type**: Choose between "Absorption" or "Emission" spectra
2. **Search Compounds**: Use the search box to find compounds with available data
3. **Add Compounds**: Click on compounds to add them to the comparison
4. **View Charts**: The interactive chart will display all selected compounds
5. **Export Data**: Download the comparison data as a CSV file

## API Endpoints

- `GET /api/compounds?q=<query>` - Search compounds
- `GET /api/spectra?compoundId=<id>&type=<absorption|emission>` - Get spectrum data

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── compounds/route.ts
│   │   └── spectra/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── compound-selector.tsx
│   └── spectrum-chart.tsx
├── database/
│   └── photochemcad.sqlite
└── lib/
    ├── database.ts
    └── utils.ts
```

## Database Setup

The application expects a SQLite database file at `src/database/photochemcad.sqlite` with the PhotochemCAD schema. The database should contain:

- Compound information with absorption/emission data flags
- Absorption spectrum data (wavelength, coefficient)
- Emission spectrum data (wavelength, normalized intensity)

## Development

- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting and formatting
- **Hot Reload**: Fast development with Next.js hot reload
- **API Routes**: Server-side API endpoints for database access

## Deployment

The application can be deployed to Vercel, Netlify, or any other Next.js-compatible hosting platform.

## License

This project is for educational and research purposes related to photochemistry and spectroscopy.
