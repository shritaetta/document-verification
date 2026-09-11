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
        <Sidebar className="border-r border-slate-200 dark:border-slate-800">
          <SidebarHeader className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                CV
              </div>
              <span>CertManage</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{userName}</span>
                  <span className="text-xs text-slate-500 capitalize">{role}</span>
                </div>
              </div>
              <form action={logout}>
                <button type="submit" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Log out</span>
                </button>
              </form>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
