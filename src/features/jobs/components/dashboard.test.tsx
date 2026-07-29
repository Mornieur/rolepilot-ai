import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dashboard } from "./dashboard";
import { jobAnalyses, jobs, profiles } from "../mock-data";

describe("Dashboard", () => {
  it("renders the initial profile, mocked jobs, and recommendation labels", () => {
    render(<Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} />);

    expect(screen.getByRole("heading", { name: "Job intelligence for focused decisions." })).toBeInTheDocument();
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("Recommended")).toHaveLength(2);
    expect(screen.getAllByText("Worth considering")).toHaveLength(2);
    expect(screen.getAllByText("Skipped")).toHaveLength(4);
    expect(screen.getByText("React and TypeScript core match")).toBeInTheDocument();
  });

  it("updates job analyses and summary values when the profile changes", () => {
    render(<Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} />);

    expect(screen.getByText("94%")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Candidate profile"), { target: { value: "rafael-data" } });

    expect(screen.getByText("96%")).toBeInTheDocument();
    expect(screen.getByText("SQL and Python core match")).toBeInTheDocument();
    expect(screen.getAllByText("Skipped")).toHaveLength(4);
  });
});
