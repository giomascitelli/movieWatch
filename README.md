# MovieWatch

A social movie tracking application built with React, TypeScript, and Supabase.

## Features

- 🎬 Track movies you've watched with ratings
- ⭐ Points system based on movie runtime and ratings
- 👥 Discover other users and view their movie portfolios
- 🔍 Search movies using TMDB API
- 🗑️ Add and remove movies from your portfolio
- 📊 View statistics about your movie watching habits

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: The Movie Database (TMDB) API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- TMDB API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and TMDB API credentials.

4. Run the database setup script in your Supabase SQL editor:
   ```sql
   -- Run the content of database-setup.sql
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
```

## Points System

- **Watchtime Points**: Based on movie runtime
  - 0-60 min: 10 points
  - 61-120 min: 20 points
  - 121-180 min: 30 points
  - 180+ min: 40 points
- **Rating Points**: 5 points for rating a movie
- **Total**: Watchtime + Rating points per movie

## Database Schema

The application uses three main tables:
- `users`: User profiles and points
- `movies`: Movie information from TMDB
- `movie_entries`: User's movie portfolio with ratings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
