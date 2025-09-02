import { supabase } from '../lib/supabase';

export interface PointsCalculation {
  watchtimePoints: number;
  ratingPoints: number;
  totalPoints: number;
  dailyWatchtime: number;
  isFirstMovieOfDay: boolean;
  canEarnPoints: boolean;
}

export async function calculateDailyWatchtime(userId: string, date: Date = new Date()): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('movie_entries')
    .select(`
      watchtime_minutes,
      movies!inner (runtime)
    `)
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (error) {
    console.error('Error calculating daily watchtime:', error);
    return 0;
  }

  return data?.reduce((total, entry: any) => {
    const runtime = entry.movies?.runtime || entry.watchtime_minutes || 0;
    return total + runtime;
  }, 0) || 0;
}

export async function calculateMoviePoints(
  userId: string, 
  runtime: number, 
  isRated: boolean = true,
  date: Date = new Date(),
  isTryHardMode: boolean = false
): Promise<PointsCalculation> {
  
  if (isTryHardMode) {
    const dailyWatchtime = await calculateDailyWatchtime(userId, date);
    const newDailyWatchtime = dailyWatchtime + runtime;
    
    const isFirstMovieOfDay = dailyWatchtime === 0;
    
    const canEarnPoints = newDailyWatchtime <= 420;
    
    let watchtimePoints = 0;
    let ratingPoints = 0;
    
    if (canEarnPoints) {
      const baseWatchtimePoints = runtime <= 60 ? 10 :
                                 runtime <= 120 ? 20 :
                                 runtime <= 180 ? 30 : 40;
      
      if (isFirstMovieOfDay) {
        watchtimePoints = baseWatchtimePoints;
        ratingPoints = isRated ? 5 : 0;
      } else {
        const reductionFactor = Math.max(0.1, 1 - (dailyWatchtime / 420));
        watchtimePoints = Math.floor(baseWatchtimePoints * reductionFactor);
        ratingPoints = 0;
      }
      
      if (newDailyWatchtime > 420) {
        const excessMinutes = newDailyWatchtime - 420;
        const validPortionRatio = (runtime - excessMinutes) / runtime;
        watchtimePoints = Math.floor(watchtimePoints * validPortionRatio);
        ratingPoints = Math.floor(ratingPoints * validPortionRatio);
      }
    }
    
    return {
      watchtimePoints,
      ratingPoints,
      totalPoints: watchtimePoints + ratingPoints,
      dailyWatchtime: newDailyWatchtime,
      isFirstMovieOfDay,
      canEarnPoints
    };
  } else {
    const watchtimePoints = runtime <= 60 ? 10 :
                           runtime <= 120 ? 20 :
                           runtime <= 180 ? 30 : 40;
    
    const ratingPoints = isRated ? 5 : 0;
    
    return {
      watchtimePoints,
      ratingPoints,
      totalPoints: watchtimePoints + ratingPoints,
      dailyWatchtime: 0,
      isFirstMovieOfDay: true,
      canEarnPoints: true
    };
  }
}

export function calculateTryHardModeUnlockTime(runtime: number): Date {
  const adjustedRuntime = Math.max(10, runtime - 10);
  
  const unlockTime = new Date();
  unlockTime.setMinutes(unlockTime.getMinutes() + adjustedRuntime);
  return unlockTime;
}

export function canRateMovie(canRateAfter?: string): boolean {
  if (!canRateAfter) return true;
  return new Date() >= new Date(canRateAfter);
}
