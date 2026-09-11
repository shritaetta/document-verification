import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
  
  if (user) {
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url)) // Default redirect, but can be improved by fetching role
    }
    
    // Check role-based access for protected routes
    const isStudentRoute = request.nextUrl.pathname.startsWith('/student')
    const isFacultyRoute = request.nextUrl.pathname.startsWith('/faculty')
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isCertUploadRoute = request.nextUrl.pathname.startsWith('/certificate/upload')

    if (isStudentRoute || isFacultyRoute || isAdminRoute || isCertUploadRoute) {
        // We need to fetch the profile to get the role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const role = profile?.role

        if (isStudentRoute && role !== 'student') {
            return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
        if (isFacultyRoute && role !== 'faculty' && role !== 'admin') {
             return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
        if (isAdminRoute && role !== 'admin') {
             return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
        if (isCertUploadRoute && role !== 'faculty' && role !== 'admin') {
             return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
    }

  } else if (!isAuthRoute && request.nextUrl.pathname !== '/') {
    // Redirect unauthenticated users to login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}
