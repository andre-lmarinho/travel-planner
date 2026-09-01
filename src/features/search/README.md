# Search Feature

Location and activity search using Geoapify and Wikidata APIs with autocomplete.

## Features
- **Destination search** - Cities, states, and countries for planner creation
- **Address search** - Street-level locations for activity addresses
- **Activity search** - Points of interest and attractions
- **Autocomplete** - Real-time suggestions with debouncing and caching
- **HTTP boundary** - Same-origin Route Handlers proxy Geoapify and Wikidata so API keys remain server-only.
- **Keyboard navigation** - Full accessibility support

## Data Flow

```text
┌─────────────────────────────────────────────────────────────┐
│ Search Feature                                              │
│   • Provides activity location and title search             │
│   • Provides destination search for planner creation        │
└────┬────────────────────────────────────────────────────────┘
     │
     ├──> Activity Feature (activity search)
     │      └──> Plan Feature
     │
     ├──> Plan Feature (destination search)
     │
     └──> Profile Feature (user location data)
```