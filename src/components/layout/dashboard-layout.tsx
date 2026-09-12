import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar"
import { logout } from "@/app/actions/auth"
import Link from "next/link"
import { Home, FileText, Upload, LogOut, Settings, UserCircle } from "lucide-react"

export default function DashboardLayout({ children, role, userName }: { children: React.ReactNode, role: string, userName: string }) {
  
  const getNavItems = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          { title: "Dashboard", url: "/admin/dashboard", icon: Home },
          { title: "Certificates", url: "/admin/certificates", icon: FileText },
          { title: "Upload", url: "/certificate/upload", icon: Upload },
          { title: "Settings", url: "/admin/settings", icon: Settings },
        ]
      case 'faculty':
        return [
          { title: "Dashboard", url: "/faculty/dashboard", icon: Home },
          { title: "Upload", url: "/certificate/upload", icon: Upload },
        ]
      case 'student':
      default:
        return [
          { title: "Dashboard", url: "/student/dashboard", icon: Home },
        ]
    }
  }

  const items = getNavItems(role)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
        <Sidebar className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <SidebarHeader className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-3 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-blue-600 text-white shadow-sm">
                <span className="text-sm font-bold">IB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-900 dark:text-slate-100">Institution Name</span>
                <span className="text-xs text-slate-500 font-normal">Certificate Platform</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm">
                        <Link href={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-200 p-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCircle className="h-8 w-8 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">{userName}</span>
                  <span className="text-xs text-slate-500 capitalize mt-1">{role}</span>
                </div>
              </div>
              <form action={logout}>
                <button type="submit" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </button>
              </form>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
