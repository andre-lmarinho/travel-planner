import { Bus, FileText, Hotel, ShoppingCart, Ticket, Utensils } from "@/ui/components/icon";

const CATEGORIES = [
  { key: "transport", label: "Transportation", icon: Bus },
  { key: "lodging", label: "Lodging", icon: Hotel },
  { key: "food", label: "Food", icon: Utensils },
  { key: "activities", label: "Tours & Activities", icon: Ticket },
  { key: "shopping", label: "Shopping & Extras", icon: ShoppingCart },
  { key: "documents", label: "Documents & Fees", icon: FileText },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
] as const;

export { CATEGORIES };

export interface Entry {
  id: string;
  description: string;
  category: CategoryKey;
  amount: number;
}

export interface BudgetQueryResult {
  budget: number;
  entries: Entry[];
}

export type DescriptionConfig = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
};

export type CategoryConfig = {
  id: string;
  value: CategoryKey;
  onChange: (value: CategoryKey) => void;
  ariaLabel?: string;
};

export type AmountConfig = {
  id: string;
  value: string;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  ariaLabel?: string;
};

export type BudgetRowInputsResult = {
  description: DescriptionConfig;
  category: CategoryConfig;
  amount: AmountConfig;
};
