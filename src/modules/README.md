# Modules Architecture

## Strategic Overview

The `src/modules` directory implements a **presentation layer architecture** that bridges Next.js routing (`app/`) and business logic (`features/`). This layered approach provides clean separation between UI composition and domain logic.

## Module Responsibilities

### **Presentation Layer Focus**
- UI composition and component orchestration
- Form handling and validation
- User interaction patterns
- Route-level data fetching and prop passing
- Layout and navigation concerns

### **Key Characteristics**
- Client-side React components (`"use client"`)
- Form validation with react-hook-form + zod
- State management for UI concerns only
- One-way dependency: **Modules → Features**

## Module Dependencies Summary

| Module | Feature Dependencies | Primary Role |
|--------|---------------------|--------------|
| `auth` | `features/auth` | Authentication UI |
| `planner` | `modules/planner/views/BoardView`, `features/budget`, `features/plan`, `features/members` | Main Workspace |
| `user` | `features/plan`, `features/search` | User Dashboard |


## Integration Patterns

### **Route Integration**
Modules integrate with Next.js App Router through page components:

```typescript
// Route: /login
// src/app/(auth)/login/page.tsx
import { LoginView } from "@/modules/auth/login-view";

// Route: /p/[planId]  
// src/app/(webapp)/p/[planId]/page.tsx
import { PlanIdView } from "@/modules/planner/planid-view";
```

### **Feature Dependencies**
Modules import business logic from features:

```typescript
// Auth module
import { signInWithPassword } from "@/features/auth/handlers/signInWithPassword";

// Planner module  
import BoardView from "@/modules/planner/views/BoardView";
import { PlannerProvider } from "@/features/plan/hooks/PlannerContext";

// User module
import { PlannerCreationForm } from "@/features/plan/components/PlannerCreationForm";
```

## When to Create New Modules

### **Add a Module When:**
1. **New Route Area** - Distinct section of the app (e.g., `/admin`, `/settings`)
2. **Complex UI Composition** - Multi-feature orchestration needed
3. **User Workflow** - Complete user journey spanning multiple features
4. **Layout Requirements** - Specific layout patterns for a section

### **Use Existing Module When:**
1. **Simple Component** - Add to appropriate existing module
2. **Feature-Only Logic** - Keep in features layer
3. **Shared UI** - Use `shared/ui/` components

## Development Guidelines

### **Module Boundaries**
- Modules should contain **only presentation logic**
- No business rules or domain logic in modules
- All data operations go through features

### **Import Rules**
- ✅ Modules can import from features
- ❌ Features cannot import from modules  
- ✅ Both can import from `shared/ui/`
- ✅ Both can import from `shared/lib/`

### **State Management**
- UI state: React state in modules
- Business state: Feature hooks and contexts
- Server state: Feature repositories and services

### **Testing Strategy**
- Module tests: UI interactions with mocked features
- Feature tests: Business logic in isolation
- Integration tests: Module + feature interaction

This layered architecture provides excellent separation between UI and business logic, enabling scalable development with clear boundaries and testable code.