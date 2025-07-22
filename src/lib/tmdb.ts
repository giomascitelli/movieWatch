const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
  runtime?: number;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string }[];
}

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = TMDB_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('TMDB API key is required. Please add VITE_TMDB_API_KEY to your environment variables.');
    }
    
    this.apiKey = this.apiKey.trim();
  }

  private async fetchFromTMDB(endpoint: string): Promise<any> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TMDB API request failed:', error);
      throw error;
    }
  }

  async searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    return this.fetchFromTMDB(`/search/movie?query=${encodedQuery}&page=${page}&include_adult=false`);
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return this.fetchFromTMDB(`/movie/${movieId}`);
  }

  async getPopularMovies(page: number = 1): Promise<TMDBSearchResponse> {
    return this.fetchFromTMDB(`/movie/popular?page=${page}`);
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBSearchResponse> {
    return this.fetchFromTMDB(`/trending/movie/${timeWindow}`);
  }

  getImageUrl(posterPath: string | null, size: string = 'w500'): string {
    if (!posterPath) {
      return '/placeholder-poster.jpg';
    }
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  }

  getFullImageUrl(posterPath: string | null): string {
    return this.getImageUrl(posterPath, 'original');
  }
}

export const tmdbService = new TMDBService();