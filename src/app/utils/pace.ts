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

/**
 * Calculates the pace adjustment for elevation gain
 * @param pace Pace in minutes per km
 * @param elevationGainPerKm Average elevation gain in meters per km
 * @returns Adjustment in minutes per km
 */
export function calculateElevationAdjustment(pace: number, elevationGainPerKm: number): number {
    // 1 second per (pace_minutes - 1) for each 5m of elevation gain
    const adjustmentSeconds = (elevationGainPerKm / 5) * (pace - 1);
    return adjustmentSeconds / 60;
}

/**
 * Calculates the pace adjustment for wind
 * @param windSpeed Wind speed in m/s
 * @param isHeadwind True for headwind, false for crosswind (1/3 impact)
 * @returns Adjustment in minutes per km
 */
export function calculateWindAdjustment(windSpeed: number, isHeadwind: boolean): number {
    if (windSpeed <= 0) return 0;

    // Piecewise linear interpolation based on headwind data points (seconds per km)
    const points: [number, number][] = [[0, 0], [3, 3], [4, 6], [5.5, 10], [7, 15], [9, 19]];

    let adjustmentSeconds = 0;
    if (windSpeed >= points[points.length - 1][0]) {
        // Extrapolate beyond last point
        const [x0, y0] = points[points.length - 2];
        const [x1, y1] = points[points.length - 1];
        adjustmentSeconds = y1 + ((windSpeed - x1) / (x1 - x0)) * (y1 - y0);
    } else {
        for (let i = 1; i < points.length; i++) {
            if (windSpeed <= points[i][0]) {
                const [x0, y0] = points[i - 1];
                const [x1, y1] = points[i];
                const t = (windSpeed - x0) / (x1 - x0);
                adjustmentSeconds = y0 + t * (y1 - y0);
                break;
            }
        }
    }

    if (!isHeadwind) {
        adjustmentSeconds /= 3;
    }

    return adjustmentSeconds / 60;
}

/**
 * Calculates the pace adjustment factor for temperature
 * @param temperature Temperature in degrees Celsius
 * @returns Multiplier to apply to pace (e.g. 1.01 = 1% slower)
 */
export function calculateTemperatureFactor(temperature: number): number {
    if (temperature < 15) return 1;
    if (temperature < 20) return 1.01;
    if (temperature < 25) return 1.02;
    return 1.04;
}

export function calculatePace(duration: number | undefined, tenKTime: number, elevationGainPerKm = 0, windSpeed = 0, isHeadwind = true, temperature = 0): number {
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

    const adjustedPace = (pace + calculateElevationAdjustment(pace, elevationGainPerKm) + calculateWindAdjustment(windSpeed, isHeadwind)) * calculateTemperatureFactor(temperature);
    return adjustedPace;
}