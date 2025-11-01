import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { workout } from '../../interfaces/workout';

@Component({
  selector: 'app-spinner',
  imports: [CommonModule],
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss'
})
export class Spinner {
  workouts = input.required<workout[]>();
  workoutSelected = output<workout>();

  protected isSpinning = signal(false);
  protected highlightedIndex = signal<number | null>(null);
  protected selectedWorkout = signal<workout | null>(null);

  private intervalId: any = null;
  private currentIndex = 0;

  spin() {
    if (this.isSpinning()) return;

    const workoutList = this.workouts();
    if (workoutList.length === 0) return;

    this.isSpinning.set(true);
    this.selectedWorkout.set(null);
    this.currentIndex = 0;

    // Randomly select a workout
    const selectedIndex = Math.floor(Math.random() * workoutList.length);
    const selected = workoutList[selectedIndex];

    // Calculate how many iterations before slowing down
    const minIterations = 15;
    const extraIterations = Math.floor(Math.random() * 10);
    const totalIterations = minIterations + extraIterations + selectedIndex;

    let iteration = 0;
    let delay = 50; // Start fast

    const highlight = () => {
      this.highlightedIndex.set(this.currentIndex);
      this.currentIndex = (this.currentIndex + 1) % workoutList.length;
      iteration++;

      if (iteration >= totalIterations && this.currentIndex === selectedIndex) {
        // We've reached the target
        if (this.intervalId) clearInterval(this.intervalId);

        setTimeout(() => {
          this.isSpinning.set(false);
          this.selectedWorkout.set(selected);
          this.workoutSelected.emit(selected);
          this.highlightedIndex.set(null);
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

  isWorkoutHighlighted(index: number): boolean {
    return this.highlightedIndex() === index;
  }
}
