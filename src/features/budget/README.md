# Budget Feature

Manages trip expenses and budget tracking.

## Features

- Plan budget - Set total budget for the trip
- Track expenses - Add, edit, and delete budget entries by category
- Category breakdown - View spending by category (Transport, Lodging, Food, Activities, Shopping, Documents)
- Progress tracking - Compare planned budget vs. actual spending
- Activity integration - Activities can have budgets that auto-aggregate into "Tours & Activities" category

## Categories

| Key | Label | Default Icon |
|-----|-------|--------------|
| `transport` | Transportation | 🚌 Bus |
| `lodging` | Lodging | 🏨 Hotel |
| `food` | Food | 🍽️ Utensils |
| `activities` | Tours & Activities | 🎫 Ticket |
| `shopping` | Shopping & Extras | 🛒 Cart |
| `documents` | Documents & Fees | 📄 FileText |

## State Management

Uses React Query with React hooks for client-side state:

- **useBudget**: Main hook managing budget data, entries, and mutations
- **Optimistic updates**: UI updates immediately, rolls back on error
- **Persistence**: Optional local-only mode or server persistence
- **Permissions**: access is restricted to authenticated plan members and owners

