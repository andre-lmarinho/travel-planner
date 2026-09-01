import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoadingScreen } from "./LoadingScreen";

vi.mock("next/image", () => ({ __esModule: true, default: () => null }));
vi.mock("react-dom", () => ({ createPortal: (node: unknown) => node }));
vi.mock("@/ui/components/loading/Spinner", () => ({
  Spinner: () => <span data-testid="spinner" />,
}));

describe("LoadingScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders default text and spinner after mount", async () => {
    render(<LoadingScreen />);

    await waitFor(() => expect(screen.getByText("Loading...")).toBeInTheDocument());
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows custom text when provided", async () => {
    render(<LoadingScreen text="Working" />);

    await waitFor(() => expect(screen.getByText("Working")).toBeInTheDocument());
  });
});
