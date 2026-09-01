---
title: Isolate Technology Choices Behind Repositories
impact: CRITICAL
impactDescription: Enables technology changes without codebase-wide refactors
tags: data, repository, supabase, orm, isolation
---

## Isolate Technology Choices Behind Repositories

**Impact: CRITICAL**

Technology choices must not seep through the application. The Supabase problem illustrates this perfectly: we currently have references to Supabase scattered across hundreds of files. This creates massive coupling and makes technology changes prohibitively expensive.

**Incorrect (Supabase leaking throughout codebase):**

```typescript
// In a service file
import { supabase } from '@/supabase/client';

async function getPlan(id: string) {
  // Direct Supabase usage in service
  const { data } = await supabase
    .from('plans')
    .select('*, plan_destinations(*)')
    .eq('id', id)
    .single();
  return data;
}
```

**Correct (Repository abstraction):**

```typescript
// In repository file
import { supabase } from '@/supabase/server';
import type { Database } from '@/supabase/types';
import type { Plan } from './types';

export class PlanRepository {
  async findById(id: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .select('id, title, destination_name, user_id')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToDTO(data);
  }

  private mapToDTO(row: Database['public']['Tables']['plans']['Row']): Plan {
    return {
      id: row.id,
      title: row.title,
      destinationName: row.destination_name,
      ownerId: row.user_id,
    };
  }
}

// In service file - no Supabase knowledge
import { PlanRepository } from "./repositories/PlanRepository";

async function getPlan(id: string) {
  return this.planRepository.findById(id);
}
```

**The standard:**
- All database access must go through Repository classes
- Repositories are the only code that knows about Supabase (or any other database client)
- No business logic should be in repositories
- Repositories are injected via Dependency Injection containers
- Repositories should expose DTOs, never raw Supabase row types
- Use explicit column selection, never `select('*')`

**Benefits:**
If we ever switch from Supabase to another database client, the only changes required are:
- Repository implementations
- DI container wiring for new repositories
- Nothing else in the codebase should care or change
