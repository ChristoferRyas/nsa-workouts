# NSA Project Architecture Guide

## Project Overview

This is an **Angular 20** application named "NSA" (appears to be a Workout Timer/Selector application). The project uses modern Angular architecture with standalone components and a bootstrap-based application structure.

### Project Type
- **Framework**: Angular 20.3.0
- **Language**: TypeScript 5.9.2
- **Styling**: SCSS (via Angular schematics configured for SCSS by default)
- **Testing**: Karma + Jasmine
- **Package Manager**: npm
- **Build Tool**: Angular CLI 20.3.7 with Angular Build system

## Key Architectural Patterns

### 1. Standalone Components (Modern Angular)
This project uses **Angular standalone components** - the modern approach introduced in Angular 14+ where components do not require NgModule declarations.

**Key Characteristics:**
- Components use `standalone: true` configuration
- Direct component imports instead of module-based organization
- Self-contained component dependencies via the `imports` array
- No `AppModule` file (modern bootstrap approach)

**Example:**
```typescript
@Component({
  selector: 'app-spinner',
  imports: [CommonModule],
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss'
})
export class Spinner { ... }
```

### 2. Bootstrap-Based Application
- Uses `bootstrapApplication()` from `@angular/platform-browser` in `main.ts`
- Application configuration via `ApplicationConfig` object
- Providers configured through `app.config.ts`

### 3. Signal-Based Reactive State
Components use Angular **Signals** (new reactive primitive) for state management:
- `signal()` - creates reactive state
- `input()` - creates typed input signals
- `output()` - creates event emitters

### 4. Component-Based Routing
- File-based routing approach with `Routes` array
- Lazy loading ready (though not currently used)
- RouterOutlet for displaying routed components

## File Organization Structure

```
src/
├── main.ts                          # Application entry point, bootstrap
├── index.html                       # HTML template
├── styles.scss                      # Global styles
│
└── app/                             # Main application folder
    ├── app.ts                       # Root component (App)
    ├── app.html                     # Root template
    ├── app.scss                     # Root component styles
    ├── app.spec.ts                  # Root component tests
    ├── app.config.ts                # Application configuration
    ├── app.routes.ts                # Route definitions
    │
    ├── components/                  # Reusable components
    │   ├── start/                   # Start screen component
    │   │   ├── start.ts             # Component logic
    │   │   ├── start.html           # Component template
    │   │   └── start.scss           # Component styles
    │   │
    │   └── spinner/                 # Workout spinner wheel component
    │       ├── spinner.ts           # Component logic
    │       ├── spinner.html         # Component template
    │       └── spinner.scss         # Component styles
    │
    ├── interfaces/                  # TypeScript interfaces
    │   └── workout.ts               # Workout data model
    │
    └── data/                        # Data/constants
        └── workouts.ts              # Predefined workout data

public/                              # Static assets
```

### Naming Conventions
- **Components**: Kebab-case folder names (e.g., `start`, `spinner`)
- **Component files**: Lowercase with extension (e.g., `start.ts`)
- **Interfaces**: Camelcase lowercase (e.g., `workout`)
- **Component selector prefix**: `app-` (configured in `angular.json`)

## Important Configuration Files

### 1. package.json
- Angular version: 20.3.0
- Key scripts:
  - `npm start` or `ng serve` - Start dev server
  - `npm run build` - Production build
  - `npm test` - Run unit tests
- Prettier formatting configured for Angular (100 char width, single quotes)

### 2. angular.json
- **Build Configuration**:
  - Browser entry: `src/main.ts`
  - SCSS support: Inline style language configured
  - Production budgets: 500KB initial, 4KB per component style
  - Assets: Served from `public/` folder
  - Global styles: `src/styles.scss`
- **Architect Commands**:
  - `build` - Production/development builds
  - `serve` - Development server
  - `test` - Karma test runner

### 3. tsconfig.json (Base)
Strict TypeScript configuration:
- `"strict": true` - All strict type-checking options enabled
- `"noImplicitOverride": true` - Requires override keyword
- `"noImplicitReturns": true` - Function returns must be explicit
- `"skipLibCheck": true` - Skip type checking of library files
- Target: ES2022
- Module: preserve (ESM support)

### 4. tsconfig.app.json
- Extends base config
- Includes: `src/**/*.ts`
- Excludes: `src/**/*.spec.ts` (test files)
- Output: `./out-tsc/app`

### 5. tsconfig.spec.json
- Test-specific configuration
- Includes Jasmine types
- Output: `./out-tsc/spec`

## Component Structure Details

### Root Component (app.ts)
- Acts as main container with `<router-outlet />` for routing
- Uses `RouterOutlet` import for navigation support
- Minimal logic - just holds title signal
- No external component dependencies

### Start Component (components/start/)
Entry/home screen component:
- Displays welcome message: "Welcome to NSA Workout Timer"
- Has "Start Workout" button
- Click handler: `onStartClick()` (currently logs to console)
- No external dependencies

### Spinner Component (components/spinner/)
Interactive wheel spinner for workout selection:
- **Inputs**: `workouts` - required signal input of workout array
- **Outputs**: `workoutSelected` - emits selected workout
- **Key Features**:
  - Renders pie-chart style wheel with workout options
  - On `spin()`: Randomly selects a workout
  - Animates rotation (5-8 full rotations + target angle)
  - 3-second animation duration
  - Prevents multiple spins during animation
  - Color-coded segments (8 colors, cycling)
- **Signal State**:
  - `isSpinning`: Prevents concurrent spins
  - `rotation`: CSS transform rotation value
  - `selectedWorkout`: Currently selected workout

### Data Models

**Workout Interface** (interfaces/workout.ts):
```typescript
interface workout {
  id: number;
  name: string;
  duration: number;      // in minutes
  rest: number;          // rest period
  paceFactor: number;    // pace multiplier
  sets: number;
}
```

**Sample Workouts** (data/workouts.ts):
- 3 predefined workouts with various intensity/duration profiles
- Exported as constant array for use in components

## Application Configuration

### app.config.ts
Provides all application-level providers:
- `provideBrowserGlobalErrorListeners()` - Global error handling
- `provideZoneChangeDetection({ eventCoalescing: true })` - Change detection optimization
- `provideRouter(routes)` - Router configuration

### app.routes.ts
Single route currently configured:
```
{ path: '', component: Start }  // Root path loads Start component
```

## Key Dependencies

### Core Angular (v20.3.0)
- `@angular/core` - Core framework
- `@angular/common` - Common directives and pipes
- `@angular/forms` - Forms module
- `@angular/router` - Routing module
- `@angular/platform-browser` - Browser platform

### Utilities
- `rxjs` (7.8.0) - Reactive extensions
- `tslib` (2.3.0) - TypeScript utilities
- `zone.js` (0.15.0) - Zone polyfill for async

### Build & Compiler
- `@angular/build` (20.3.7) - New build system
- `@angular/compiler-cli` (20.3.0) - Ahead-of-time compiler

### Testing
- `jasmine-core` (5.9.0) - Testing framework
- `karma` (6.4.0) - Test runner
- `karma-jasmine` (5.1.0) - Karma adapter
- `karma-chrome-launcher` (3.2.0) - Chrome launcher
- `karma-coverage` (2.2.0) - Code coverage
