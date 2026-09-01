"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";

import type { Entry } from "../types";
import { useBudget } from "./useBudget";

interface BudgetProviderProps {
  planId: string;
  activitiesTotal: number;
  initialBudget?: number;
  initialEntries?: Entry[];
  canEdit?: boolean;
}

const BudgetContext = createContext<ReturnType<typeof useBudget> | undefined>(undefined);

export function BudgetProvider({ children, ...props }: PropsWithChildren<BudgetProviderProps>) {
  const value = useBudget(props.planId, props.activitiesTotal, {
    initialBudget: props.initialBudget,
    initialEntries: props.initialEntries,
    canEdit: props.canEdit,
  });

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgetContext() {
  const value = useContext(BudgetContext);
  if (value === undefined) {
    throw new Error("useBudgetContext must be inside BudgetProvider");
  }
  return value;
}
