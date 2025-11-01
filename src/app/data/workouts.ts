import { workout, WorkoutCategory } from "../interfaces/workout";

export const workouts: workout[] = [
    {
        id: 1,
        name: "10min intervals",
        duration: 600,
        rest: 120,
        paceFactor: 1,
        sets: 3,
        category: WorkoutCategory.TIME_BASED
    },
    {
        id: 2,
        name: "6min intervals",
        duration: 360,
        category: WorkoutCategory.TIME_BASED,
        rest: 90,
        paceFactor: 1,
        sets: 5
    },
    {
        id: 3,
        name: "3min intervals",
        duration: 180,
        rest: 60,
        paceFactor: 0.9,
        sets: 10,
        category: WorkoutCategory.TIME_BASED
    },
    {
        id: 4,
        name: "90/30 intervals",
        duration: 90,
        rest: 30,
        paceFactor: 1,
        sets: 15,
        category: WorkoutCategory.THREADMILL_WORKOUTS
    },
    {
        id: 5,
        name: "400m intervals",
        distance: 400,
        rest: 30,
        paceFactor: 1,
        sets: 20,
        category: WorkoutCategory.TRACK_WORKOUTS
    },
    {
        id: 6,
        name: "45/15 intervals",
        duration: 45,
        rest: 15,
        paceFactor: 1,
        sets: 30,
        category: WorkoutCategory.THREADMILL_WORKOUTS
    },
    {
        id: 7,
        name: "800m intervals",
        distance: 800,
        rest: 60,
        paceFactor: 1,
        sets: 8,
        category: WorkoutCategory.TRACK_WORKOUTS
    },
    {
        id: 8,
        name: "1km intervals",
        distance: 1000,
        rest: 60,
        paceFactor: 1,
        sets: 8,
        category: WorkoutCategory.DISTANCE_BASED
    },
    {
        id: 9,
        name: "2km intervals",
        distance: 2000,
        rest: 90,
        paceFactor: 1,
        sets: 4,
        category: WorkoutCategory.DISTANCE_BASED
    },
    {
        id: 10,
        name: "3km intervals",
        distance: 3000,
        rest: 120,
        paceFactor: 1,
        sets: 3,
        category: WorkoutCategory.DISTANCE_BASED
    },
    {
        id: 11,
        name: "12min intervals",
        duration: 720,
        rest: 120,
        paceFactor: 1,
        sets: 3,
        category: WorkoutCategory.TIME_BASED
    },
    {
        id: 12,
        name: "5min intervals",
        duration: 300,
        rest: 80,
        paceFactor: 1,
        sets: 5,
        category: WorkoutCategory.TIME_BASED
    },
    {
        id: 13,
        name: "8min intervals",
        duration: 480,
        rest: 100,
        paceFactor: 1,
        sets: 4,
        category: WorkoutCategory.TIME_BASED
    },
    {
        id: 14,
        name: "1 mile repeats",
        distance: 1609,
        rest: 90,
        paceFactor: 1,
        sets: 6,
        category: WorkoutCategory.DISTANCE_BASED
    },
    { 
        id: 15,
        name: "15min intervals",
        duration: 900,
        rest: 120,
        paceFactor: 1,
        sets: 4,
        category: WorkoutCategory.TIME_BASED
    },
    {
        id: 16,
        name: "1200m intervals",
        distance: 1200,
        rest: 75,
        paceFactor: 1,
        sets: 5,
        category: WorkoutCategory.TRACK_WORKOUTS
    },
    {
        id: 17,
        name: "1600m intervals",
        distance: 1600,
        rest: 90,
        paceFactor: 1,
        sets: 4,
        category: WorkoutCategory.TRACK_WORKOUTS
    },
    {
        id: 18,
        name: "2000m intervals",
        distance: 2000,
        rest: 120,
        paceFactor: 1,
        sets: 3,
        category: WorkoutCategory.TRACK_WORKOUTS
    }
];
