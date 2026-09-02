# Features Architecture

## Strategic Overview

The travel planner application follows a **feature-based architecture** with clear separation of concerns, enabling independent development, testing, and deployment of functional areas.

## Core Architecture Principles

- **Feature Isolation**: Each feature is self-contained with its own components, services, and types
- **Type Safety**: Strong TypeScript boundaries between features
- **Real-time Collaboration**: Event-driven updates across all features
- **Performance Optimization**: Snapshot system for large-scale plans

## Feature Categories

### 🏗️ Foundation Layer
**Core data models and orchestration**

- **`activity`** - Fundamental data structures (Activity, DayPlan, ActivityColor)
- **`plan`** - Central orchestration via PlannerContext

### 🎨 User Interface Layer  
**Visual planning interfaces**

- **`budget`** - Financial tracking and expense management

### 🤝 Collaboration Layer
**Real-time features and data persistence**

- **`events`** - Event sourcing for real-time collaboration
- **`snapshots`** - State persistence and performance optimization
- **`members`** - Access control and user management

### 🔧 Service Layer
**External integrations and supporting services**

- **`search`** - External API integration (Geoapify, Wikidata)
- **`auth`** - Authentication and session management
- **`profile`** - User profile data and slug management

### 📢 Content & Sharing
**Public-facing features and content**

- **`inspirations`** - Pre-built travel templates
- **`shareLink`** - Public sharing via tokens
- **`website`** - Marketing and landing pages

## Key Integration Points

### **PlannerContext** - Central State Hub
Connects: `activity`, planner module views and components, `budget`, `events`
Provides: Plan state, permissions, editing capabilities, collaboration state

### **Event System** - Real-time Backbone
Connects: All UI features via `events` → `snapshots` → state updates
Enables: Multi-user collaboration with conflict resolution

### **Activity Types** - Shared Foundation
Used by: 10+ features for type safety and data consistency
Defines: Core data structures across the application

### **Search Services** - External Integration
Connects: planner `ActivityDialog` → `search` → external APIs
Provides: Location suggestions and activity recommendations

## Data Flow Patterns

### **Plan Loading**
```
Plan Repository → Snapshot → Events → Activity State → UI Components
```

### **Collaboration**
```
User Action → Event Generation → Event Persistence → Real-time Broadcast → State Update
```

### **Permission Check**
```
Plan Access → Member Check → Permission Context → Feature Authorization
```

## Feature Boundaries

- Each feature owns its components, services, and types
- Cross-feature communication happens through well-defined interfaces
- Avoid circular dependencies between features

## When to Add New Features

1. **New Domain Area** - Distinct business logic (e.g., "itinerary", "bookings")
2. **External Integration** - New API or service (e.g., "weather", "flights")
3. **Major UI Paradigm** - New interaction pattern (e.g., "timeline", "calendar")

## Feature Dependencies Summary

| Feature | Direct Dependencies | Role |
|---------|-------------------|------|
| `activity` | None | Core Domain |
| `auth` | `profile` | Infrastructure - Authentication |
| `budget` | `activity`, `plan` | UI - Financial Tracking |
| `events` | `activity`, `snapshots` | Infrastructure - Event Sourcing |
| `members` | `plan`, `profile`, `shareLink` | UI - Collaboration |
| `plan` | `activity`, `events`, `search`, `budget`, `snapshots` | Central Orchestrator |
| `profile` | None | User Data |
| `search` | None | External Service |
| `snapshots` | `activity`, `events` | Infrastructure - State Persistence |

This architecture enables scalable development with clear ownership, type safety, and sophisticated real-time collaboration capabilities.