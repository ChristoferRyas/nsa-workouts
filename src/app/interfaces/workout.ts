export interface workout {
    id: number;
    name: string;
    duration?: number; // duration in minutes
    distance?: number; // distance in kilometers
    rest: number;
    paceFactor: number;
    sets: number;
    category?: WorkoutCategory;
}

export enum WorkoutCategory {
    TIME_BASED = "Time-Based",
    DISTANCE_BASED = "Distance-Based",
    TRACK_WORKOUTS = "Track Workouts",
    THREADMILL_WORKOUTS = "Treadmill Workouts",
    CUSTOM = "Custom Workouts"
}