-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'club_leader', 'department_head', 'member');

-- Custom type for activity status
CREATE TYPE activity_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'ongoing', 'completed', 'cancelled');

-- Custom type for registration status
CREATE TYPE registration_status AS ENUM ('registered', 'cancelled', 'waitlisted', 'checked_in');

-- Custom type for repair priority
CREATE TYPE repair_priority AS ENUM ('low', 'medium', 'high');

-- Custom type for repair status
CREATE TYPE repair_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- Custom type for item condition
CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'good', 'fair');

-- Custom type for item status
CREATE TYPE item_status AS ENUM ('available', 'reserved', 'sold', 'cancelled');

-- Custom type for verification status
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Custom type for message type
CREATE TYPE message_type AS ENUM ('system', 'activity', 'reminder', 'review', 'notification');

-- Custom type for seat violation type
CREATE TYPE violation_type AS ENUM ('no_show', 'late', 'cancelled_late');

-- User profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    role user_role DEFAULT 'member',
    department VARCHAR(100),
    club_id UUID,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    leader_id UUID REFERENCES user_profiles(id),
    department VARCHAR(100),
    logo_url TEXT,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    location VARCHAR(200) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 50,
    current_participants INTEGER NOT NULL DEFAULT 0,
    status activity_status DEFAULT 'draft',
    category VARCHAR(50),
    cover_image TEXT,
    created_by UUID REFERENCES user_profiles(id),
    reviewed_by UUID REFERENCES user_profiles(id),
    review_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    status registration_status DEFAULT 'registered',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    check_in_time TIMESTAMPTZ,
    seat_number INTEGER,
    has_reminder BOOLEAN DEFAULT true,
    reminder_sent BOOLEAN DEFAULT false,
    UNIQUE(activity_id, user_id)
);

-- Check-in records table
CREATE TABLE check_in_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_in_method VARCHAR(20) DEFAULT 'manual',
    location VARCHAR(200),
    UNIQUE(activity_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type message_type DEFAULT 'notification',
    related_type VARCHAR(50),
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repair requests table
CREATE TABLE repair_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    dormitory VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    priority repair_priority DEFAULT 'medium',
    status repair_status DEFAULT 'pending',
    reporter_id UUID REFERENCES user_profiles(id),
    handler_id UUID REFERENCES user_profiles(id),
    related_activity_id UUID REFERENCES activities(id),
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Second-hand items table
CREATE TABLE second_hand_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category VARCHAR(50),
    condition item_condition DEFAULT 'good',
    images TEXT[],
    seller_id UUID REFERENCES user_profiles(id),
    buyer_id UUID REFERENCES user_profiles(id),
    status item_status DEFAULT 'available',
    related_activity_id UUID REFERENCES activities(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity verifications table
CREATE TABLE identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50),
    department VARCHAR(100),
    club_id UUID REFERENCES clubs(id),
    id_card_front TEXT,
    id_card_back TEXT,
    status verification_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES user_profiles(id),
    review_comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Seat violations table
CREATE TABLE seat_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    activity_id UUID REFERENCES activities(id),
    registration_id UUID REFERENCES registrations(id),
    type violation_type NOT NULL,
    count INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_activities_club_id ON activities(club_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_start_time ON activities(start_time);
CREATE INDEX idx_registrations_activity_id ON registrations(activity_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_is_read ON messages(user_id, is_read);
CREATE INDEX idx_repair_requests_status ON repair_requests(status);
CREATE INDEX idx_repair_requests_reporter_id ON repair_requests(reporter_id);
CREATE INDEX idx_second_hand_items_status ON second_hand_items(status);
CREATE INDEX idx_second_hand_items_seller_id ON second_hand_items(seller_id);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_hand_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policy
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Clubs policies
CREATE POLICY "Everyone can view clubs"
    ON clubs FOR SELECT
    USING (true);

CREATE POLICY "Club leaders can update their club"
    ON clubs FOR UPDATE
    USING (leader_id = auth.uid());

-- Activities policies
CREATE POLICY "Everyone can view approved activities"
    ON activities FOR SELECT
    USING (status = 'approved' OR created_by = auth.uid() OR 
           (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'department_head'))));

CREATE POLICY "Club leaders can create activities"
    ON activities FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'club_leader'))));

CREATE POLICY "Creators can update their activities"
    ON activities FOR UPDATE
    USING (created_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'department_head')));

-- Registrations policies
CREATE POLICY "Users can view their own registrations"
    ON registrations FOR SELECT
    USING (user_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM activities a WHERE a.id = registrations.activity_id AND a.created_by = auth.uid()) OR
           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'department_head')));

CREATE POLICY "Users can register for activities"
    ON registrations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel their registration"
    ON registrations FOR UPDATE
    USING (user_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM activities a WHERE a.id = registrations.activity_id AND a.created_by = auth.uid()) OR
           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'department_head')));

-- Messages policies
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
    ON messages FOR UPDATE
    USING (user_id = auth.uid());

-- Repair requests policies
CREATE POLICY "Users can view their own repair requests"
    ON repair_requests FOR SELECT
    USING (reporter_id = auth.uid() OR handler_id = auth.uid() OR
           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'department_head')));

CREATE POLICY "Users can create repair requests"
    ON repair_requests FOR INSERT
    WITH CHECK (reporter_id = auth.uid());

-- Second-hand items policies
CREATE POLICY "Everyone can view available items"
    ON second_hand_items FOR SELECT
    USING (status = 'available' OR seller_id = auth.uid() OR buyer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create items"
    ON second_hand_items FOR INSERT
    WITH CHECK (seller_id = auth.uid());

-- Identity verifications policies
CREATE POLICY "Users can view their own verification"
    ON identity_verifications FOR SELECT
    USING (user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'department_head')));

CREATE POLICY "Users can submit verification"
    ON identity_verifications FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
