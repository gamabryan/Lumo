import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getAppShellData } from "@/lib/app-data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getAppShellData();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="app-canvas flex h-svh overflow-hidden">
      <AppSidebar data={data} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
