import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const ui = vi.hoisted(() => ({ state: { status: "idle" } as { status: "idle" | "success" | "error"; current?: string; message?: string }, pending: false }));
vi.mock("@/features/job-actions/actions", () => ({ initialJobStatusActionState: { status: "idle" }, saveJobStatusAction: vi.fn() }));
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<typeof import("react")>()), useActionState: () => [ui.state, vi.fn(), ui.pending] }));

import { JobStatusControls } from "./job-status-controls";

describe("JobStatusControls", () => {
  it("shows the current status with accessible action buttons and pressed state", () => {
    render(<JobStatusControls profileId="profile" jobId="job" currentStatus="applied" />);
    expect(screen.getByRole("status")).toHaveTextContent("Current state: applied");
    expect(screen.getByRole("button", { name: "Applied" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Ignore" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Rejected" })).toBeEnabled();
  });

  it("disables controls while pending and renders controlled success and error feedback", () => {
    ui.pending = true;
    const { rerender } = render(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    ui.pending = false; ui.state = { status: "success", current: "saved", message: "Job status updated." };
    rerender(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByText("Job status updated.")).toBeInTheDocument();

    ui.state = { status: "error", message: "Job status could not be saved." };
    rerender(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Job status could not be saved.");

    ui.state = { status: "idle" };
    rerender(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
