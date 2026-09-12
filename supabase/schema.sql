-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update profiles
CREATE POLICY "Admins can update profiles" 
    ON public.profiles FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to automatically create a profile for new users (Default role: student)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'New User'), COALESCE(new.raw_user_meta_data->>'role', 'student'));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create certificates table
CREATE TABLE public.certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL UNIQUE,
    verification_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected', 'revoked')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES auth.users(id),
    revocation_reason TEXT
);

-- Enable RLS on certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Certificates RLS Policies
-- Students can view their own certificates
CREATE POLICY "Students can view own certificates" 
    ON public.certificates FOR SELECT 
    USING (auth.uid() = student_id);

-- Faculty and Admins can view all certificates
CREATE POLICY "Faculty and Admins can view all certificates" 
    ON public.certificates FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

-- Faculty and Admins can insert certificates
CREATE POLICY "Faculty and Admins can insert certificates" 
    ON public.certificates FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

-- Faculty and Admins can update certificates
CREATE POLICY "Faculty and Admins can update certificates" 
    ON public.certificates FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );


-- 3. Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit Logs RLS Policies
-- Only Admins and Faculty can view audit logs
CREATE POLICY "Admins and Faculty can view audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty')
        )
    );

-- Any authenticated user can insert audit logs (for their own actions, enforced via server code)
CREATE POLICY "Authenticated users can insert audit logs" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');


-- 4. Storage Setup
-- Insert storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Enable RLS for storage.objects (Already enabled by default in Supabase, running this causes an error)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies
-- Faculty and Admins can upload certificates
CREATE POLICY "Faculty and Admins can upload certificates" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'certificates' AND 
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

-- Faculty and Admins can view all certificates in storage
CREATE POLICY "Faculty and Admins can view certificates" 
    ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'certificates' AND 
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')
        )
    );

-- Students can view their own certificates (Server-side validation might be needed for path matching, 
-- but simpler approach is signed URLs generated by the server).
-- We'll allow authenticated users to view if they have a signed URL.
-- Alternatively, if we store the path as 'student_id/filename.pdf':
CREATE POLICY "Students can view own certificates" 
    ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'certificates' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );


-- 5. Indexes for performance
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_sha256_hash ON public.certificates(sha256_hash);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
