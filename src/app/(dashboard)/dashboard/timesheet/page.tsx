import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTimesheetWeek } from "@/actions/timesheet";
import { TimesheetView } from "@/components/timesheet/timesheet-view";
import { getAppShellData } from "@/lib/app-data";

export const metadata: Metadata = {
  title: "Timesheet",
  description: "Lance suas horas nos projetos alocados",
};

type TimesheetPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function TimesheetPage({
  searchParams,
}: TimesheetPageProps) {
  const data = await getAppShellData();
  if (!data) {
    redirect("/login");
  }

  const { week } = await searchParams;
  const timesheet = await getTimesheetWeek(data.activeWorkspace.id, week);

  return (
    <TimesheetView
      key={timesheet.weekStart}
      workspaceId={data.activeWorkspace.id}
      weekStart={timesheet.weekStart}
      projects={timesheet.projects}
      initialEntries={timesheet.entries}
      setupRequired={timesheet.setupRequired}
    />
  );
}
