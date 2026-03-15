# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Lint
npm run lint
```

There are no test commands configured. The app uses Expo's managed workflow — no explicit build step is needed for development.

## Environment

Create a `.env.local` file at the root with:
```
EXPO_PUBLIC_API_URL=http://<your-ip>:5000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-client-id>
```

## Architecture

**React Native + Expo** scholarship management app with two user roles: **students** (browse/apply for scholarships) and **sponsors** (create/manage scholarships and select applicants).

### Routing

Uses **Expo Router** (file-based routing). Layout groups in `app/` organize routes:
- `(auth)/` — Login, register, password reset, OTP verification, legal pages
- `(onboarding)/` — Welcome, role selection, profile setup
- `(student)/` — Student home (applications), scholarship detail/apply, profile
- `(sponsor)/` — Sponsor scholarships list, scholarship management, applicants, profile

Each group has a `_layout.tsx` that wraps screens with role-specific bottom tab navigation. Dynamic segments use `[id]` convention (e.g., `scholarship/[id]/index.tsx`).

Navigation is programmatic via `useRouter()` from `expo-router`. After login, the auth service checks the user's role and profile completion status to route them to the correct section.

### Service Layer

Business logic and API calls live in `services/`:
- `auth.service.ts` — Authentication, token persistence via `expo-secure-store`, profile/role checks
- `profile.service.ts` — Profile CRUD
- `scholarship-creation.service.ts` — Sponsor-side scholarship creation and management
- `scholarship-application.service.ts` — Student-side application submission and retrieval

Services are singleton instances. Components call these directly (no global state library). The API base URL comes from `EXPO_PUBLIC_API_URL`.

### State Management

No global state library. State flows as:
- Component-level `useState` for UI state
- `react-hook-form` + `zod` for all form state and validation
- Services return data directly to component state
- Auth tokens stored in `expo-secure-store`

### Path Aliases

Use `@/` to import from the project root:
```ts
import { authService } from '@/services/auth.service'
import ScholarshipCard from '@/components/scholarship-card'
```

### Theming

Colors and fonts are defined in `constants/theme.ts`. The app supports light/dark mode via `useColorScheme()` hook. Use `useThemeColor()` when a component needs to respond to the current theme.

### Key Libraries

| Purpose | Library |
|---|---|
| Navigation | expo-router, react-navigation |
| Forms | react-hook-form + zod |
| Animations | moti, react-native-reanimated |
| Secure storage | expo-secure-store |
| Icons | @expo/vector-icons (Octicons, MaterialIcons) |
| Gradients | expo-linear-gradient |
