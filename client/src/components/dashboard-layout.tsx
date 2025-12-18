import React, { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, title, breadcrumbs = [] }: DashboardLayoutProps) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Separator orientation="vertical" className="h-6" />
            
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
                {breadcrumbs.map((crumb, index) => [
                  index > 0 ? <BreadcrumbSeparator key={`sep-${index}`} /> : null,
                  <BreadcrumbItem key={`item-${index}`}>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ]).flat()}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold" data-testid={`heading-${title.toLowerCase().replace(/\s+/g, "-")}`}>
                {title}
              </h1>
            </div>
            {children}
          </main>

          <footer className="border-t bg-muted/30 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Government of India - Ministry of Electronics and Information Technology</span>
              <span>Developed by AIRAVATA Technologies</span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
