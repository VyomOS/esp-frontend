-- ESP Platform v3.0 Migration Script
-- Run this in Neon SQL Editor (console.neon.tech) or pgAdmin

-- Vendor Profile new columns
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS impact_statement VARCHAR(300);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS cities_served TEXT;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS year_founded INTEGER;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS is_women_owned BOOLEAN DEFAULT FALSE;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS women_ownership_percent INTEGER DEFAULT 0;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS team_size_band VARCHAR(20);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS annual_turnover_band VARCHAR(30);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS certification_types TEXT;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS sdg_tags TEXT;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS service_categories TEXT;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS gstin VARCHAR(20);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS gstin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS pan VARCHAR(20);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS cin VARCHAR(25);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS mca_data TEXT;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS esg_score FLOAT DEFAULT 0.0;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS esg_band VARCHAR(30);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Buyer profiles (new table)
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255),
    company_type VARCHAR(50),
    sector VARCHAR(100),
    annual_procurement_budget_band VARCHAR(30),
    preferred_vendor_categories TEXT,
    esg_procurement_policy BOOLEAN DEFAULT FALSE,
    sdg_commitments TEXT,
    min_vendor_esg_score INTEGER DEFAULT 0,
    preferred_certifications TEXT,
    phone VARCHAR(20),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Bids (new table)
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES procurement_requests(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    vendor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    cover_note TEXT NOT NULL,
    proposed_price VARCHAR(100),
    timeline VARCHAR(100),
    status VARCHAR(20) DEFAULT 'submitted',
    buyer_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Certification gaps (new table)
CREATE TABLE IF NOT EXISTS certification_gaps (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    gap_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    action TEXT NOT NULL,
    advisory_fee VARCHAR(50),
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor catalogues
CREATE TABLE IF NOT EXISTS vendor_catalogues (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor documents new columns
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS status_note TEXT;

-- Procurement requests new columns
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS budget VARCHAR(100);
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS impact_requirements TEXT;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS required_certifications TEXT;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS min_esg_score INTEGER DEFAULT 0;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS sdg_tags TEXT;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS close_reason TEXT;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS selected_vendor_id INTEGER;
ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- ESG metrics new columns (25-field)
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS carbon_emissions FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS renewable_energy_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS ev_fleet_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS waste_recycling_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS biodegradable_packaging_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS water_consumption FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS env_certifications TEXT;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS carbon_offset_programme BOOLEAN DEFAULT FALSE;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS total_employees INTEGER DEFAULT 0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS women_employees_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS women_leadership_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS sc_st_obc_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS pwd_employees_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS jobs_created INTEGER DEFAULT 0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS jobs_marginalised INTEGER DEFAULT 0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS living_wage_compliance BOOLEAN DEFAULT FALSE;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS health_insurance_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS training_hours_per_emp FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS community_sourcing_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS women_ownership_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS women_board_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS grievance_mechanism BOOLEAN DEFAULT FALSE;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS compliance_certs TEXT;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS avg_payment_days INTEGER DEFAULT 30;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS annual_report_filed BOOLEAN DEFAULT FALSE;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS data_privacy_policy BOOLEAN DEFAULT FALSE;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS esg_score_computed FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS esg_band_computed VARCHAR(30);
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS local_sourcing_pct FLOAT DEFAULT 0.0;
ALTER TABLE esg_metrics ADD COLUMN IF NOT EXISTS msme_certified BOOLEAN DEFAULT FALSE;

-- Notifications new columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(512);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

SELECT 'Migration v3.0 complete!' as result;
