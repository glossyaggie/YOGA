-- Drop existing tables to recreate with correct schema
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS scheduled_classes CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Recreate classes table with exact CSV column names
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  class_name TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  temperature_cel INTEGER,
  duration_minute INTEGER DEFAULT 60,
  max_capacity INTEGER DEFAULT 24,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_sessions table (for recurring weekly schedule)
CREATE TABLE class_sessions (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled_classes table (for specific dates)
CREATE TABLE scheduled_classes (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES class_sessions(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 24,
  current_bookings INTEGER DEFAULT 0,
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scheduled_date, start_time, class_id)
);

-- Add indexes for better performance
CREATE INDEX idx_classes_day_time ON classes(day_of_week, start_time);
CREATE INDEX idx_class_sessions_day_time ON class_sessions(day_of_week, start_time);
CREATE INDEX idx_scheduled_classes_date ON scheduled_classes(scheduled_date);
CREATE INDEX idx_scheduled_classes_date_time ON scheduled_classes(scheduled_date, start_time);

-- Add RLS policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY;

-- Public read access for classes and sessions
CREATE POLICY "public read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "public read class_sessions" ON class_sessions FOR SELECT USING (true);
CREATE POLICY "public read scheduled_classes" ON scheduled_classes FOR SELECT USING (true);

-- Staff can manage classes (you'll need to set up staff roles)
CREATE POLICY "staff manage classes" ON classes FOR ALL USING (auth.jwt() ->> 'role' = 'staff');
CREATE POLICY "staff manage class_sessions" ON class_sessions FOR ALL USING (auth.jwt() ->> 'role' = 'staff');
CREATE POLICY "staff manage scheduled_classes" ON scheduled_classes FOR ALL USING (auth.jwt() ->> 'role' = 'staff');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_sessions_updated_at BEFORE UPDATE ON class_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_classes_updated_at BEFORE UPDATE ON scheduled_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
