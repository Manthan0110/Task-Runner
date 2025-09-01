// src/__tests__/TasksList.test.tsx
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import TasksList from "../pages/TasksList";

test("renders loading state", () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TasksList />
      </MemoryRouter>
    </QueryClientProvider>
  );

  expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
});
