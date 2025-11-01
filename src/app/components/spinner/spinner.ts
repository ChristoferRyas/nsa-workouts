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
  protected rotation = signal(0);
  protected selectedWorkout = signal<workout | null>(null);

  spin() {
    if (this.isSpinning()) return;

    const workoutList = this.workouts();
    if (workoutList.length === 0) return;

    this.isSpinning.set(true);
    this.selectedWorkout.set(null);

    // Randomly select a workout
    const selectedIndex = Math.floor(Math.random() * workoutList.length);
    const selected = workoutList[selectedIndex];

    // Calculate rotation to land on selected workout
    const segmentAngle = 360 / workoutList.length;
    const targetAngle = selectedIndex * (-segmentAngle) - segmentAngle / 2 + 360 * 5; // Offset to center segment at top

    // Add multiple full rotations (5-8) plus the target angle
    const fullRotations = 5 + Math.floor(Math.random() * 4);
    const totalRotation = fullRotations * 360 + targetAngle;

    this.rotation.set(totalRotation);

    // After 3 seconds, emit the selected workout
    setTimeout(() => {
      this.isSpinning.set(false);
      this.selectedWorkout.set(selected);
      this.workoutSelected.emit(selected);
    }, 3000);
  }

  getSegmentStyle(index: number) {
    const total = this.workouts().length;
    const angle = 360 / total;
    const rotation = index * angle;

    return {
      transform: `rotate(${rotation}deg) skewY(${-90 + angle}deg)`,
      backgroundColor: this.getColor(index)
    };
  }

  getTextStyle(index: number) {
    const total = this.workouts().length;
    const angle = 360 / total;

    return {
      transform: `translate(-50%, -50%) rotate(${angle / 2 - 90}deg)`
    };
  }

  private getColor(index: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    return colors[index % colors.length];
  }
}
