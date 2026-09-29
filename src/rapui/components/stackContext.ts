import { createContext, useContext } from "react";

export type StackState = "idle" | "loading" | "success" | "error";

/** Shared between FormStack and the pills inside it (Button, Input). */
export interface StackContextValue {
  state: StackState;
}

export const StackContext = createContext<StackContextValue | null>(null);
export const useStack = () => useContext(StackContext);
