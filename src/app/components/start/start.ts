import { Component, signal, OnInit, computed, AfterViewChecked } from '@angular/core';
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
export class Start implements OnInit, AfterViewChecked {
  private readonly STORAGE_KEY = 'nsa-estimated-10km-time';
  private readonly EXCLUDED_WORKOUTS_KEY = 'nsa-excluded-workouts';
  private readonly TOTAL_TIME_KEY = 'nsa-total-interval-time';
  private readonly COLLAPSED_CATEGORIES_KEY = 'nsa-collapsed-categories';
  private readonly CUSTOM_WORKOUTS_KEY = 'nsa-custom-workouts';

  protected baseWorkouts = workouts;
  protected customWorkouts = signal<workout[]>([]);
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
  protected collapsedCategories = signal<Set<string>>(new Set());
  protected isInputSectionCollapsed = signal(false);

  // Custom workout form inputs
  protected customDistance = signal<number | null>(null);
  protected customRest = signal<number | null>(null);

  private intervalId: any = null;
  private currentIndex = 0;
  private nextCustomWorkoutId = 1000; // Start custom IDs at 1000 to avoid conflicts

  // Reactive workouts list that combines base and custom workouts
  protected workouts = computed(() => {
    return [...this.baseWorkouts, ...this.customWorkouts()];
  });

  protected availableWorkouts = computed(() => {
    const excluded = this.excludedWorkoutIds();
    return this.workouts().filter(w => !excluded.has(w.id));
  });

  protected workoutsByCategory = computed(() => {
    const categories = new Map<WorkoutCategory, workout[]>();

    // Initialize all categories
    Object.values(WorkoutCategory).forEach(category => {
      categories.set(category, []);
    });

    // Group workouts by category
    this.workouts().forEach(workout => {
      const category = workout.category || WorkoutCategory.TIME_BASED;
      const categoryWorkouts = categories.get(category) || [];
      categoryWorkouts.push(workout);
      categories.set(category, categoryWorkouts);
    });

    // Filter out empty categories, sort workouts by duration/distance, and convert to array
    return Array.from(categories.entries())
      .filter(([_, workouts]) => workouts.length > 0)
      .map(([category, workouts]) => ({
        category,
        workouts: workouts.sort((a, b) => {
          // Sort by duration if both have duration
          if (a.duration !== undefined && b.duration !== undefined) {
            return a.duration - b.duration;
          }
          // Sort by distance if both have distance
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          // If one has duration and other has distance, put duration first
          if (a.duration !== undefined) return -1;
          if (b.duration !== undefined) return 1;
          return 0;
        })
      }));
  });

  protected categoryOrder = [
    WorkoutCategory.CUSTOM,
    WorkoutCategory.TIME_BASED,
    WorkoutCategory.DISTANCE_BASED,
    WorkoutCategory.TRACK_WORKOUTS
  ];

  ngOnInit() {
    this.loadEstimatedTime();
    this.loadExcludedWorkouts();
    this.loadTotalIntervalTime();
    this.loadCollapsedCategories();
    this.loadCustomWorkouts();

    // Collapse input section if user has already entered values
    if (this.estimatedTime() !== null && this.totalIntervalTime() !== null) {
      this.isInputSectionCollapsed.set(true);
    }
  }

  toggleInputSection() {
    this.isInputSectionCollapsed.set(!this.isInputSectionCollapsed());
  }

  ngAfterViewChecked() {
    // Update indeterminate state for category checkboxes
    this.workoutsByCategory().forEach(categoryGroup => {
      const checkbox = document.getElementById(`category-${categoryGroup.category}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.indeterminate = this.isCategoryIndeterminate(categoryGroup.workouts);
      }
    });
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

  private loadCollapsedCategories() {
    const saved = localStorage.getItem(this.COLLAPSED_CATEGORIES_KEY);
    if (saved) {
      try {
        const collapsed = JSON.parse(saved) as string[];
        this.collapsedCategories.set(new Set(collapsed));
      } catch (e) {
        console.error('Failed to load collapsed categories:', e);
      }
    }
  }

  private saveCollapsedCategories() {
    const collapsed = Array.from(this.collapsedCategories());
    localStorage.setItem(this.COLLAPSED_CATEGORIES_KEY, JSON.stringify(collapsed));
  }

  private loadCustomWorkouts() {
    const saved = localStorage.getItem(this.CUSTOM_WORKOUTS_KEY);
    if (saved) {
      try {
        const custom = JSON.parse(saved) as workout[];
        this.customWorkouts.set(custom);
        // Update the next ID to be higher than any existing custom workout
        const maxId = custom.reduce((max, w) => Math.max(max, w.id), 999);
        this.nextCustomWorkoutId = maxId + 1;
      } catch (e) {
        console.error('Failed to load custom workouts:', e);
      }
    }
  }

  private saveCustomWorkouts() {
    const custom = this.customWorkouts();
    localStorage.setItem(this.CUSTOM_WORKOUTS_KEY, JSON.stringify(custom));
  }

  onCustomDistanceChange(value: number | null) {
    this.customDistance.set(value);
  }

  onCustomRestChange(value: number | null) {
    this.customRest.set(value);
  }

  isCustomWorkoutValid(): boolean {
    const distance = this.customDistance();
    const rest = this.customRest();

    return distance !== null && distance > 0 &&
           rest !== null && rest >= 0;
  }

  addCustomWorkout() {
    if (!this.isCustomWorkoutValid()) {
      return;
    }

    const distance = this.customDistance()!;
    const rest = this.customRest()!;

    const newWorkout: workout = {
      id: this.nextCustomWorkoutId++,
      name: `${distance}m intervals`,
      distance: distance,
      rest: rest,
      paceFactor: 1,
      sets: 1, // Default to 1, will be calculated based on total time
      category: WorkoutCategory.CUSTOM
    };

    const updated = [...this.customWorkouts(), newWorkout];
    this.customWorkouts.set(updated);
    this.saveCustomWorkouts();

    // Clear the form
    this.customDistance.set(null);
    this.customRest.set(null);
  }

  deleteCustomWorkout(id: number) {
    const updated = this.customWorkouts().filter(w => w.id !== id);
    this.customWorkouts.set(updated);
    this.saveCustomWorkouts();

    // If the deleted workout was selected, clear the selection
    const selected = this.selectedWorkout();
    if (selected && selected.id === id) {
      this.selectedWorkout.set(null);
      this.suggestedPace.set(null);
      this.calculatedSets.set(null);
    }

    // Remove from excluded workouts if it was excluded
    const excluded = new Set(this.excludedWorkoutIds());
    if (excluded.has(id)) {
      excluded.delete(id);
      this.excludedWorkoutIds.set(excluded);
      this.saveExcludedWorkouts();
    }
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

  isCategoryChecked(categoryWorkouts: workout[]): boolean {
    return categoryWorkouts.every(w => this.isWorkoutIncluded(w.id));
  }

  isCategoryIndeterminate(categoryWorkouts: workout[]): boolean {
    const includedCount = categoryWorkouts.filter(w => this.isWorkoutIncluded(w.id)).length;
    return includedCount > 0 && includedCount < categoryWorkouts.length;
  }

  toggleCategory(categoryWorkouts: workout[], event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const excluded = new Set(this.excludedWorkoutIds());

    categoryWorkouts.forEach(workout => {
      if (checkbox.checked) {
        excluded.delete(workout.id);
      } else {
        excluded.add(workout.id);
      }
    });

    this.excludedWorkoutIds.set(excluded);
    this.saveExcludedWorkouts();
  }

  isCategoryCollapsed(category: string): boolean {
    return this.collapsedCategories().has(category);
  }

  toggleCategoryCollapse(category: string, event: Event) {
    event.stopPropagation();
    const collapsed = new Set(this.collapsedCategories());
    if (collapsed.has(category)) {
      collapsed.delete(category);
    } else {
      collapsed.add(category);
    }
    this.collapsedCategories.set(collapsed);
    this.saveCollapsedCategories();
  }

  selectWorkout(workout: workout) {
    this.selectedWorkout.set(workout);

    // Scroll to stats section on mobile devices
    setTimeout(() => {
      if (window.innerWidth <= 968) {
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
          statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);

    const time = this.estimatedTime();
    const totalTime = this.totalIntervalTime();

    // Calculate number of sets based on total interval time (excluding rest)
    if (totalTime !== null && totalTime > 0) {
      let duration = workout.duration;
      if (duration === undefined && workout.distance !== undefined && time !== null && time > 0) {
        duration = convertDistanceToDuration(workout.distance, time);
      }

      if (duration !== undefined) {
        const totalTimeSeconds = totalTime * 60; // convert minutes to seconds
        // Calculate sets based only on interval time, then round to nearest
        const sets = Math.round(totalTimeSeconds / duration);
        this.calculatedSets.set(sets > 0 ? sets : 1);
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

    // Calculate how many iterations before slowing down (reduced by ~half)
    const minIterations = 8;
    const extraIterations = Math.floor(Math.random() * 5);
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
        }, 200);
      } else {
        // Gradually slow down as we approach the target
        if (iteration > minIterations) {
          const remainingIterations = totalIterations - iteration;
          if (remainingIterations < 5) {
            delay = 80 + (5 - remainingIterations) * 40; // Slow down progressively
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

  formatDuration(durationInSeconds: number | undefined): string {
    console.log(durationInSeconds)
    if (durationInSeconds !== undefined) {
      if (durationInSeconds >= 60) {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        if (seconds === 0) {
          return `${minutes}min`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}min`;
      }
      return `${durationInSeconds}s`;
    }
    return '';
  }

  isTrackWorkout(): boolean {
    const workout = this.selectedWorkout();
    return workout !== null && workout.category === WorkoutCategory.TRACK_WORKOUTS;
  }

  getSecondsPerLap(): string | null {
    const pace = this.suggestedPace();
    if (pace === null) {
      return null;
    }
    // A standard track lap is 400m = 0.4km
    // Pace is in minutes per km, so seconds per 400m = pace * 0.4 * 60
    const secondsPerLap = pace * 0.4 * 60;
    const seconds = Math.floor(secondsPerLap);
    const decimals = Math.round((secondsPerLap - seconds) * 10);

    if (decimals === 0) {
      return `${seconds}s`;
    }
    return `${seconds}.${decimals}s`;
  }

  getSpeedKmh(): string | null {
    const pace = this.suggestedPace();
    if (pace === null) {
      return null;
    }
    // Convert pace (min/km) to speed (km/h)
    // Speed = 60 / pace
    const speedKmh = 60 / pace;
    return speedKmh.toFixed(1);
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
