# MovieWatch

A social movie tracking application built with React, TypeScript, and Supabase.

<img width="1915" height="907" alt="image" src="https://github.com/user-attachments/assets/b9d01a90-dc96-40ef-84c0-6a03a08441f7" />
<img width="1916" height="905" alt="image" src="https://github.com/user-attachments/assets/713dee93-5efd-4d9d-bc62-d1a759351757" />
<img width="1916" height="905" alt="image" src="https://github.com/user-attachments/assets/975cfff7-b9a2-46f9-960f-68ac159daaee" />
<img width="1901" height="905" alt="image" src="https://github.com/user-attachments/assets/1a4ca0e1-df95-4b46-a59a-b9068357f7c0" />
<img width="1901" height="907" alt="image" src="https://github.com/user-attachments/assets/75c0ab7c-aa31-42bb-865a-4b06163f87bd" />
<img width="1897" height="906" alt="image" src="https://github.com/user-attachments/assets/94ec827a-2159-4991-acf9-22f756cfcd7c" />
<img width="1901" height="907" alt="image" src="https://github.com/user-attachments/assets/376a0b40-1ac3-4b02-b21c-5d85edb35a62" />
<img width="1900" height="907" alt="image" src="https://github.com/user-attachments/assets/161591f7-c510-40fe-b9c9-d6f16b9f42da" />


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
