-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Students Table
create table public.students (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    roll_no integer not null,
    class integer not null check (class >= 1 and class <= 8),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Subjects Table
create table public.subjects (
    id uuid default uuid_generate_v4() primary key,
    subject_name text not null,
    subject_code text not null unique
);

-- Create Marks Table
create table public.marks (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    marks_obtained numeric(5, 2) not null check (marks_obtained >= 0),
    entered_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(student_id, subject_id)
);

-- Set up Row Level Security (RLS)
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.marks enable row level security;

-- Create basic policies (Allow read access to authenticated users, write to authenticated users)
create policy "Enable read access for authenticated users" on public.students for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.students for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.students for update to authenticated using (true);
create policy "Enable delete for authenticated users" on public.students for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on public.subjects for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.subjects for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.subjects for update to authenticated using (true);
create policy "Enable delete for authenticated users" on public.subjects for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on public.marks for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.marks for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.marks for update to authenticated using (true);
create policy "Enable delete for authenticated users" on public.marks for delete to authenticated using (true);

-- Insert dummy subjects for Grades 1-8
insert into public.subjects (subject_name, subject_code) values
('English', 'ENG'),
('Mathematics', 'MATH'),
('Science', 'SCI'),
('Social Studies', 'SOC'),
('Nepali', 'NEP');
