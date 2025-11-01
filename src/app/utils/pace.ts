/**
 * Converts distance (in meters) to duration (in seconds) based on the user's 10km pace
 * @param distanceMeters Distance in meters
 * @param tenKTime User's 10km time in minutes
 * @returns Duration in seconds
 */
export function convertDistanceToDuration(distanceMeters: number, tenKTime: number): number {
    const tenKPace = tenKTime / 10; // pace per km in minutes
    const distanceKm = distanceMeters / 1000; // convert meters to km
    const durationMinutes = distanceKm * tenKPace; // time = distance * pace
    return durationMinutes * 60; // convert to seconds
}

export function calculatePace(duration: number | undefined, tenKTime: number): number {
    const tenKPace = tenKTime / 10; // pace per km for 10K

    if (duration === undefined || duration <= 0) {
        return tenKPace;
    }
    const hmTime = tenKTime * Math.pow(2.11, 1.06); // approximate half marathon time
    const hmPace = hmTime / 21.0975; // pace per km for half marathon

    // Linear interpolation between 10K pace (at 90s) and HM pace (at 300s)
    // Shorter duration = faster pace (10K), longer duration = slower pace (HM)
    // Allow extrapolation for durations > 300s
    const minDuration = 90;
    const maxDuration = 300;

    // Only enforce minimum duration, allow extrapolation beyond max
    const adjustedDuration = Math.max(minDuration, duration);

    // Linear interpolation/extrapolation: pace increases (gets slower) as duration increases
    const t = (duration - minDuration) / (maxDuration - minDuration);
    const pace = tenKPace + (hmPace - tenKPace) * t;

    return pace;
}