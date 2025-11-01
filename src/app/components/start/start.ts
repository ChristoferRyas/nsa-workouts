import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { workouts } from '../../data/workouts';
import { workout, WorkoutCategory } from '../../interfaces/workout';
import { calculatePace, convertDistanceToDuration } from '../../utils/pace';

@Component({
  selector: 'app-start',
  imports: [CommonModule, FormsModule],
  templateUrl: './start.html',
  styleUrl: './start.scss'
})
export class Start implements OnInit {
  private readonly STORAGE_KEY = 'nsa-estimated-10km-time';
  private readonly EXCLUDED_WORKOUTS_KEY = 'nsa-excluded-workouts';
  private readonly TOTAL_TIME_KEY = 'nsa-total-interval-time';

  protected workouts = workouts;
  protected excludedWorkoutIds = signal<Set<number>>(new Set());
  protected estimatedTime = signal<number | null>(null);
  protected previousTime = signal<number | null>(null);
  protected totalIntervalTime = signal<number | null>(null);
  protected previousTotalTime = signal<number | null>(null);
  protected selectedWorkout = signal<workout | null>(null);
  protected suggestedPace = signal<number | null>(null);
  protected calculatedSets = signal<number | null>(null);
  protected highlightedWorkoutId = signal<number | null>(null);
  protected isRandomizing = signal(false);

  private intervalId: any = null;
  private currentIndex = 0;

  protected availableWorkouts = computed(() => {
    const excluded = this.excludedWorkoutIds();
    return this.workouts.filter(w => !excluded.has(w.id));
  });

  protected workoutsByCategory = computed(() => {
    const categories = new Map<WorkoutCategory, workout[]>();

    // Initialize all categories
    Object.values(WorkoutCategory).forEach(category => {
      categories.set(category, []);
    });

    // Group workouts by category
    this.workouts.forEach(workout => {
      const category = workout.category || WorkoutCategory.TIME_BASED;
      const categoryWorkouts = categories.get(category) || [];
      categoryWorkouts.push(workout);
      categories.set(category, categoryWorkouts);
    });

    // Filter out empty categories, sort workouts by name, and convert to array
    return Array.from(categories.entries())
      .filter(([_, workouts]) => workouts.length > 0)
      .map(([category, workouts]) => ({
        category,
        workouts: workouts.sort((a, b) => a.name.localeCompare(b.name))
      }));
  });

  protected categoryOrder = [
    WorkoutCategory.TIME_BASED,
    WorkoutCategory.DISTANCE_BASED,
    WorkoutCategory.TRACK_WORKOUTS
  ];

  ngOnInit() {
    this.loadEstimatedTime();
    this.loadExcludedWorkouts();
    this.loadTotalIntervalTime();
  }

  private loadEstimatedTime() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      const time = parseFloat(saved);
      if (!isNaN(time) && time > 0) {
        this.estimatedTime.set(time);
        this.previousTime.set(time);
      }
    }
  }

  private loadTotalIntervalTime() {
    const saved = localStorage.getItem(this.TOTAL_TIME_KEY);
    if (saved) {
      const time = parseFloat(saved);
      if (!isNaN(time) && time > 0) {
        this.totalIntervalTime.set(time);
        this.previousTotalTime.set(time);
      }
    }
  }

  private loadExcludedWorkouts() {
    const saved = localStorage.getItem(this.EXCLUDED_WORKOUTS_KEY);
    if (saved) {
      try {
        const excluded = JSON.parse(saved) as number[];
        this.excludedWorkoutIds.set(new Set(excluded));
      } catch (e) {
        console.error('Failed to load excluded workouts:', e);
      }
    }
  }

  private saveExcludedWorkouts() {
    const excluded = Array.from(this.excludedWorkoutIds());
    localStorage.setItem(this.EXCLUDED_WORKOUTS_KEY, JSON.stringify(excluded));
  }

  onTimeChange(value: number | null) {
    this.estimatedTime.set(value);
    if (value !== null && value > 0) {
      localStorage.setItem(this.STORAGE_KEY, value.toString());
      this.previousTime.set(value);
    }
  }

  onTotalTimeChange(value: number | null) {
    this.totalIntervalTime.set(value);
    if (value !== null && value > 0) {
      localStorage.setItem(this.TOTAL_TIME_KEY, value.toString());
      this.previousTotalTime.set(value);
    }
  }

  isWorkoutIncluded(workoutId: number): boolean {
    return !this.excludedWorkoutIds().has(workoutId);
  }

  toggleWorkout(workoutId: number, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const excluded = new Set(this.excludedWorkoutIds());

    if (checkbox.checked) {
      excluded.delete(workoutId);
    } else {
      excluded.add(workoutId);
    }

    this.excludedWorkoutIds.set(excluded);
    this.saveExcludedWorkouts();
  }

  selectWorkout(workout: workout) {
    this.selectedWorkout.set(workout);

    const time = this.estimatedTime();
    const totalTime = this.totalIntervalTime();

    // Calculate number of sets based on total interval time
    if (totalTime !== null && totalTime > 0) {
      let duration = workout.duration;
      if (duration === undefined && workout.distance !== undefined && time !== null && time > 0) {
        duration = convertDistanceToDuration(workout.distance, time);
      }

      if (duration !== undefined) {
        const totalTimeSeconds = totalTime * 60; // convert minutes to seconds
        const intervalWithRest = duration + workout.rest; // duration + rest time
        const sets = Math.floor(totalTimeSeconds / intervalWithRest);
        this.calculatedSets.set(sets);
      } else {
        this.calculatedSets.set(null);
      }
    } else {
      this.calculatedSets.set(null);
    }

    if (time !== null && time > 0) {
      // If workout has distance instead of duration, convert it first
      let duration = workout.duration;
      if (duration === undefined && workout.distance !== undefined) {
        duration = convertDistanceToDuration(workout.distance, time);
      }

      const pace = calculatePace(duration, time);
      this.suggestedPace.set(pace);
      console.log('Selected workout:', workout, 'Suggested pace:', pace, 'min/km', 'Calculated sets:', this.calculatedSets());
    } else {
      this.suggestedPace.set(null);
      console.log('Selected workout:', workout);
    }
  }

  onWorkoutClick(workout: workout, event: Event) {
    // Prevent the label from toggling the checkbox
    event.preventDefault();
    this.selectWorkout(workout);
  }

  randomSelect() {
    if (this.isRandomizing()) return;

    const available = this.availableWorkouts();
    if (available.length === 0) return;

    this.isRandomizing.set(true);
    this.selectedWorkout.set(null);
    this.currentIndex = 0;

    // Randomly select a workout
    const selectedIndex = Math.floor(Math.random() * available.length);
    const selected = available[selectedIndex];

    // Calculate how many iterations before slowing down
    const minIterations = 15;
    const extraIterations = Math.floor(Math.random() * 10);
    const totalIterations = minIterations + extraIterations + selectedIndex;

    let iteration = 0;
    let delay = 50; // Start fast

    const highlight = () => {
      const currentWorkout = available[this.currentIndex];
      this.highlightedWorkoutId.set(currentWorkout.id);
      this.currentIndex = (this.currentIndex + 1) % available.length;
      iteration++;

      if (iteration >= totalIterations && this.currentIndex === selectedIndex) {
        // We've reached the target
        if (this.intervalId) clearInterval(this.intervalId);

        setTimeout(() => {
          this.isRandomizing.set(false);
          this.selectWorkout(selected);
          this.highlightedWorkoutId.set(null);
        }, 300);
      } else {
        // Gradually slow down as we approach the target
        if (iteration > minIterations) {
          const remainingIterations = totalIterations - iteration;
          if (remainingIterations < 10) {
            delay = 100 + (10 - remainingIterations) * 50; // Slow down progressively
            if (this.intervalId) clearInterval(this.intervalId);
            this.intervalId = setInterval(highlight, delay);
          }
        }
      }
    };

    this.intervalId = setInterval(highlight, delay);
  }

  isWorkoutHighlighted(workoutId: number): boolean {
    return this.highlightedWorkoutId() === workoutId;
  }

  isWorkoutSelected(workoutId: number): boolean {
    const selected = this.selectedWorkout();
    return selected !== null && selected.id === workoutId;
  }

  formatPace(pace: number): string {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getPaceForWorkout(workout: workout): string | null {
    const time = this.estimatedTime();
    if (time === null || time <= 0) {
      return null;
    }

    // If workout has distance instead of duration, convert it first
    let duration = workout.duration;
    if (duration === undefined && workout.distance !== undefined) {
      duration = convertDistanceToDuration(workout.distance, time);
    }

    const pace = calculatePace(duration, time);
    return this.formatPace(pace);
  }
}
