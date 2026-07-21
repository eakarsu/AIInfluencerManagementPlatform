import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  if (process.env.ALLOW_DESTRUCTIVE_DEMO_SEED !== 'true' || process.env.NODE_ENV === 'production') throw new Error('destructive demo seed is disabled');
  if (!process.env.DEMO_ADMIN_PASSWORD) throw new Error('DEMO_ADMIN_PASSWORD is required for demo seeding');
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL');
    console.log('Dropping existing tables...');

    await client.query(`
      DROP TABLE IF EXISTS roi_calculations CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS benchmarks CASCADE;
      DROP TABLE IF EXISTS competitors CASCADE;
      DROP TABLE IF EXISTS audience_insights CASCADE;
      DROP TABLE IF EXISTS outreach_messages CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS contracts CASCADE;
      DROP TABLE IF EXISTS content_calendar CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS influencers CASCADE;
      DROP TABLE IF EXISTS brands CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('All tables dropped.');

    // ── Create Tables ──────────────────────────────────────────────

    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> users');

    await client.query(`
      CREATE TABLE brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        website VARCHAR(255),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        budget DECIMAL(12,2),
        budget_range VARCHAR(100),
        logo_url VARCHAR(500),
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> brands');

    await client.query(`
      CREATE TABLE influencers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50),
        handle VARCHAR(100),
        followers INTEGER,
        engagement_rate DECIMAL(5,2),
        category VARCHAR(100),
        location VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        avatar_url VARCHAR(500),
        bio TEXT,
        rate_per_post DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> influencers');

    await client.query(`
      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'draft',
        budget DECIMAL(12,2),
        start_date DATE,
        end_date DATE,
        platform VARCHAR(50),
        platforms VARCHAR(255),
        goal TEXT,
        goals TEXT,
        target_audience TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> campaigns');

    await client.query(`
      CREATE TABLE content_calendar (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        platform VARCHAR(50),
        scheduled_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'scheduled',
        content_type VARCHAR(50),
        caption TEXT,
        media_url VARCHAR(500),
        hashtags TEXT,
        notes TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> content_calendar');

    await client.query(`
      CREATE TABLE contracts (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
        value DECIMAL(12,2),
        compensation DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'draft',
        start_date DATE,
        end_date DATE,
        signed_date DATE,
        terms TEXT,
        deliverables TEXT,
        document_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> contracts');

    await client.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
        amount DECIMAL(12,2),
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'pending',
        payment_date DATE,
        due_date DATE,
        method VARCHAR(50),
        payment_method VARCHAR(50),
        invoice_url VARCHAR(500),
        notes TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> payments');

    await client.query(`
      CREATE TABLE outreach_messages (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        subject VARCHAR(255),
        message TEXT,
        channel VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        sent_date TIMESTAMP,
        sent_at TIMESTAMP,
        response TEXT,
        response_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> outreach_messages');

    await client.query(`
      CREATE TABLE audience_insights (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        age_group VARCHAR(50),
        age_range VARCHAR(50),
        gender_split VARCHAR(100),
        top_locations TEXT,
        interests TEXT,
        language VARCHAR(50),
        avg_engagement DECIMAL(5,2),
        authenticity_score DECIMAL(5,2),
        engagement_quality VARCHAR(50),
        growth_rate DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> audience_insights');

    await client.query(`
      CREATE TABLE competitors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand_id INTEGER,
        platform VARCHAR(50),
        website VARCHAR(255),
        social_handles TEXT,
        followers INTEGER,
        follower_count INTEGER,
        engagement_rate DECIMAL(5,2),
        niche VARCHAR(100),
        content_strategy TEXT,
        strengths TEXT,
        weaknesses TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> competitors');

    await client.query(`
      CREATE TABLE benchmarks (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100),
        platform VARCHAR(50),
        metric_name VARCHAR(100),
        value DECIMAL(12,4),
        industry_avg DECIMAL(12,4),
        top_performer DECIMAL(12,4),
        avg_engagement_rate DECIMAL(8,4),
        avg_follower_growth DECIMAL(8,4),
        avg_cost_per_post DECIMAL(12,2),
        avg_roi DECIMAL(8,4),
        avg_reach INTEGER,
        industry VARCHAR(100),
        notes TEXT,
        period VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> benchmarks');

    await client.query(`
      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        platform VARCHAR(50),
        impressions INTEGER,
        reach INTEGER,
        clicks INTEGER,
        conversions INTEGER,
        engagement INTEGER,
        engagement_rate DECIMAL(5,2),
        spend DECIMAL(12,2),
        revenue DECIMAL(12,2),
        roi DECIMAL(8,2),
        date DATE,
        period VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> analytics');

    await client.query(`
      CREATE TABLE roi_calculations (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL,
        investment DECIMAL(12,2),
        total_spend DECIMAL(12,2),
        revenue DECIMAL(12,2),
        total_revenue DECIMAL(12,2),
        roi_percentage DECIMAL(8,2),
        impressions INTEGER,
        conversions INTEGER,
        cost_per_conversion DECIMAL(10,4),
        cpe DECIMAL(10,4),
        cpc DECIMAL(10,4),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  -> roi_calculations');

    console.log('All tables created.\n');

    // ── Seed Data ──────────────────────────────────────────────────

    // Users
    console.log('Seeding users...');
    const adminHash = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, 10);
    const managerHash = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
        ('admin@influencer.io', $1, 'Admin User', 'admin'),
        ('manager@influencer.io', $2, 'Sarah Manager', 'manager')
    `, [adminHash, managerHash]);
    console.log('  -> 2 users seeded');

    // Brands
    console.log('Seeding brands...');
    await client.query(`
      INSERT INTO brands (name, industry, website, contact_email, budget, logo_url, description) VALUES
        ('Nike', 'Sportswear', 'https://nike.com', 'partnerships@nike.com', 5000000.00, 'https://logo.clearbit.com/nike.com', 'Global sportswear and athletic brand'),
        ('Glossier', 'Beauty', 'https://glossier.com', 'collabs@glossier.com', 2000000.00, 'https://logo.clearbit.com/glossier.com', 'Modern beauty brand focused on skin-first philosophy'),
        ('Gymshark', 'Fitness Apparel', 'https://gymshark.com', 'influencers@gymshark.com', 3000000.00, 'https://logo.clearbit.com/gymshark.com', 'Fitness apparel and accessories brand'),
        ('Daniel Wellington', 'Watches', 'https://danielwellington.com', 'pr@danielwellington.com', 1500000.00, 'https://logo.clearbit.com/danielwellington.com', 'Minimalist Scandinavian watch brand'),
        ('HelloFresh', 'Food & Beverage', 'https://hellofresh.com', 'creators@hellofresh.com', 4000000.00, 'https://logo.clearbit.com/hellofresh.com', 'Meal kit delivery service'),
        ('Audible', 'Entertainment', 'https://audible.com', 'sponsorships@audible.com', 6000000.00, 'https://logo.clearbit.com/audible.com', 'Audiobook and podcast platform by Amazon'),
        ('Nord VPN', 'Technology', 'https://nordvpn.com', 'partners@nordvpn.com', 8000000.00, 'https://logo.clearbit.com/nordvpn.com', 'Leading VPN service provider'),
        ('Fenty Beauty', 'Beauty', 'https://fentybeauty.com', 'collabs@fentybeauty.com', 3500000.00, 'https://logo.clearbit.com/fentybeauty.com', 'Inclusive beauty brand by Rihanna'),
        ('Calm', 'Wellness', 'https://calm.com', 'brand@calm.com', 2500000.00, 'https://logo.clearbit.com/calm.com', 'Meditation and sleep app'),
        ('MVMT Watches', 'Accessories', 'https://mvmtwatches.com', 'influencers@mvmt.com', 1000000.00, 'https://logo.clearbit.com/mvmtwatches.com', 'Affordable premium watch brand'),
        ('Skillshare', 'Education', 'https://skillshare.com', 'creators@skillshare.com', 3000000.00, 'https://logo.clearbit.com/skillshare.com', 'Online learning community'),
        ('Revolve', 'Fashion', 'https://revolve.com', 'influencer@revolve.com', 4500000.00, 'https://logo.clearbit.com/revolve.com', 'Premium fashion e-commerce platform'),
        ('Athletic Greens', 'Health', 'https://athleticgreens.com', 'partners@athleticgreens.com', 2000000.00, 'https://logo.clearbit.com/athleticgreens.com', 'All-in-one daily nutrition supplement'),
        ('Squarespace', 'Technology', 'https://squarespace.com', 'sponsorships@squarespace.com', 5000000.00, 'https://logo.clearbit.com/squarespace.com', 'Website building and hosting platform'),
        ('BetterHelp', 'Mental Health', 'https://betterhelp.com', 'partnerships@betterhelp.com', 7000000.00, 'https://logo.clearbit.com/betterhelp.com', 'Online therapy and counseling platform')
    `);
    console.log('  -> 15 brands seeded');

    // Influencers
    console.log('Seeding influencers...');
    await client.query(`
      INSERT INTO influencers (name, platform, handle, followers, engagement_rate, category, location, email, avatar_url, bio, rate_per_post, status) VALUES
        ('Emma Rodriguez', 'Instagram', 'emmarod', 2400000, 4.80, 'Fashion', 'Los Angeles, CA', 'emma@creators.io', 'https://randomuser.me/api/portraits/women/1.jpg', 'Fashion stylist & lifestyle creator. Sharing my curated looks with the world.', 8500.00, 'active'),
        ('Jake Thompson', 'YouTube', 'jakethompson', 5200000, 3.20, 'Tech', 'San Francisco, CA', 'jake@creators.io', 'https://randomuser.me/api/portraits/men/2.jpg', 'Tech reviewer and gadget enthusiast. Honest reviews, always.', 15000.00, 'active'),
        ('Sophia Chen', 'TikTok', 'sophiachen', 8900000, 7.50, 'Beauty', 'New York, NY', 'sophia@creators.io', 'https://randomuser.me/api/portraits/women/3.jpg', 'Makeup artist turned content creator. GRWM queen.', 12000.00, 'active'),
        ('Marcus Williams', 'Instagram', 'marcusfit', 1800000, 5.10, 'Fitness', 'Miami, FL', 'marcus@creators.io', 'https://randomuser.me/api/portraits/men/4.jpg', 'Certified PT and fitness influencer. Transform your body, transform your life.', 6000.00, 'active'),
        ('Aria Patel', 'YouTube', 'ariaeats', 3100000, 4.20, 'Food', 'Chicago, IL', 'aria@creators.io', 'https://randomuser.me/api/portraits/women/5.jpg', 'Home chef sharing recipes that bring families together.', 9500.00, 'active'),
        ('Liam OConnor', 'TikTok', 'liamfunny', 6700000, 8.30, 'Comedy', 'Austin, TX', 'liam@creators.io', 'https://randomuser.me/api/portraits/men/6.jpg', 'Making you laugh one video at a time. Sketch comedy & improv.', 10000.00, 'active'),
        ('Zoe Kim', 'Instagram', 'zoekim', 950000, 6.70, 'Travel', 'Seattle, WA', 'zoe@creators.io', 'https://randomuser.me/api/portraits/women/7.jpg', 'Wanderlust addict. 60+ countries and counting.', 4500.00, 'active'),
        ('Noah Davis', 'YouTube', 'noahgames', 4300000, 3.80, 'Gaming', 'Portland, OR', 'noah@creators.io', 'https://randomuser.me/api/portraits/men/8.jpg', 'Pro gamer & streamer. FPS specialist with a love for indie titles.', 11000.00, 'active'),
        ('Isabella Martinez', 'Instagram', 'isabellalife', 3500000, 5.40, 'Lifestyle', 'Dallas, TX', 'isabella@creators.io', 'https://randomuser.me/api/portraits/women/9.jpg', 'Mom of 3 sharing the beautiful chaos of everyday life.', 7500.00, 'active'),
        ('Ethan Brooks', 'TikTok', 'ethanscience', 4100000, 9.20, 'Education', 'Boston, MA', 'ethan@creators.io', 'https://randomuser.me/api/portraits/men/10.jpg', 'Making science cool again. PhD in Physics, creator at heart.', 8000.00, 'active'),
        ('Olivia Taylor', 'Instagram', 'oliviazen', 1200000, 4.50, 'Wellness', 'Denver, CO', 'olivia@creators.io', 'https://randomuser.me/api/portraits/women/11.jpg', 'Yoga instructor & mindfulness advocate. Breathe, stretch, grow.', 5000.00, 'active'),
        ('Aiden Nakamura', 'YouTube', 'aidenfinance', 2800000, 3.60, 'Finance', 'New York, NY', 'aiden@creators.io', 'https://randomuser.me/api/portraits/men/12.jpg', 'Breaking down complex finance into bite-sized videos.', 9000.00, 'active'),
        ('Mia Johnson', 'TikTok', 'miadance', 7200000, 8.80, 'Dance', 'Atlanta, GA', 'mia@creators.io', 'https://randomuser.me/api/portraits/women/13.jpg', 'Professional dancer & choreographer. Let the rhythm move you.', 11500.00, 'active'),
        ('Lucas Garcia', 'Instagram', 'lucasphoto', 2100000, 5.90, 'Photography', 'San Diego, CA', 'lucas@creators.io', 'https://randomuser.me/api/portraits/men/14.jpg', 'Landscape & portrait photographer. Chasing golden hour everywhere.', 6500.00, 'active'),
        ('Chloe Anderson', 'YouTube', 'chloediy', 1600000, 4.10, 'DIY', 'Nashville, TN', 'chloe@creators.io', 'https://randomuser.me/api/portraits/women/15.jpg', 'Crafting, home decor, and upcycling. Making beautiful things from nothing.', 5500.00, 'active'),
        ('Ryan Mitchell', 'TikTok', 'ryansports', 3300000, 7.10, 'Sports', 'Phoenix, AZ', 'ryan@creators.io', 'https://randomuser.me/api/portraits/men/16.jpg', 'Former college athlete sharing training tips and sports commentary.', 7000.00, 'active')
    `);
    console.log('  -> 16 influencers seeded');

    // Campaigns
    console.log('Seeding campaigns...');
    await client.query(`
      INSERT INTO campaigns (name, brand_id, status, budget, start_date, end_date, platform, goal, description) VALUES
        ('Summer Style Drop', 1, 'active', 150000.00, '2026-03-01', '2026-05-31', 'Instagram', 'Brand awareness and product launch', 'Nike summer collection launch with top fashion influencers'),
        ('Glossier Glow Up', 2, 'active', 85000.00, '2026-03-15', '2026-04-30', 'TikTok', 'Drive product sales', 'Glossier skincare routine challenge on TikTok'),
        ('Gymshark 66 Challenge', 3, 'active', 200000.00, '2026-01-01', '2026-03-07', 'Instagram', 'Community engagement', 'Annual 66-day fitness transformation challenge'),
        ('DW Spring Campaign', 4, 'planned', 60000.00, '2026-04-01', '2026-06-30', 'Instagram', 'Product awareness', 'Daniel Wellington spring watch collection showcase'),
        ('HelloFresh Meal Prep', 5, 'active', 120000.00, '2026-02-15', '2026-04-15', 'YouTube', 'Subscription signups', 'Weekly meal prep series with cooking influencers'),
        ('Audible Book Club', 6, 'completed', 95000.00, '2025-11-01', '2026-01-31', 'YouTube', 'App downloads', 'Monthly book recommendations from top creators'),
        ('NordVPN Security Month', 7, 'active', 180000.00, '2026-03-01', '2026-03-31', 'YouTube', 'Subscription conversions', 'Cybersecurity awareness campaign with tech reviewers'),
        ('Fenty Beauty Launch', 8, 'planned', 250000.00, '2026-04-15', '2026-06-15', 'TikTok', 'Product launch buzz', 'New Fenty Beauty product line launch campaign'),
        ('Calm Sleep Series', 9, 'active', 75000.00, '2026-02-01', '2026-04-30', 'Instagram', 'App downloads', 'Sleep wellness content series with wellness influencers'),
        ('MVMT Holiday Push', 10, 'completed', 45000.00, '2025-11-15', '2025-12-31', 'Instagram', 'Holiday sales', 'Holiday gift guide featuring MVMT watches'),
        ('Skillshare Creator Fund', 11, 'active', 110000.00, '2026-01-15', '2026-06-30', 'YouTube', 'Course enrollments', 'Creators teaching their craft on Skillshare'),
        ('Revolve Festival Style', 12, 'planned', 300000.00, '2026-04-10', '2026-04-20', 'Instagram', 'Brand presence at Coachella', 'Revolve festival fashion with top style influencers'),
        ('AG1 Daily Routine', 13, 'active', 90000.00, '2026-02-01', '2026-05-31', 'TikTok', 'Product subscriptions', 'Morning routine integration with Athletic Greens'),
        ('Squarespace Build It', 14, 'completed', 130000.00, '2025-10-01', '2025-12-31', 'YouTube', 'Website signups', 'Creators building their portfolio sites on Squarespace'),
        ('BetterHelp Awareness', 15, 'active', 160000.00, '2026-01-01', '2026-06-30', 'YouTube', 'Therapy signups', 'Mental health awareness and therapy accessibility campaign')
    `);
    console.log('  -> 15 campaigns seeded');

    // Content Calendar
    console.log('Seeding content_calendar...');
    await client.query(`
      INSERT INTO content_calendar (title, influencer_id, campaign_id, platform, scheduled_date, status, content_type, description) VALUES
        ('Nike Summer Lookbook Reel', 1, 1, 'Instagram', '2026-03-20 10:00:00', 'scheduled', 'Reel', 'Style 3 Nike summer outfits in a transition reel'),
        ('Glossier Skincare Routine', 3, 2, 'TikTok', '2026-03-22 14:00:00', 'scheduled', 'Video', 'Morning skincare routine featuring Glossier products'),
        ('Gymshark Progress Update', 4, 3, 'Instagram', '2026-03-18 08:00:00', 'published', 'Carousel', 'Week 10 transformation progress photos'),
        ('HelloFresh Meal Prep Sunday', 5, 5, 'YouTube', '2026-03-23 12:00:00', 'in_review', 'Long-form Video', 'Full week meal prep using HelloFresh recipes'),
        ('NordVPN Tech Review Integration', 2, 7, 'YouTube', '2026-03-25 16:00:00', 'scheduled', 'Sponsored Segment', 'VPN security tips integrated into tech review'),
        ('Calm Meditation Morning', 11, 9, 'Instagram', '2026-03-19 06:00:00', 'published', 'Story', 'Morning meditation routine with Calm app'),
        ('Skillshare Photography Class', 14, 11, 'YouTube', '2026-03-28 10:00:00', 'draft', 'Tutorial', 'Landscape photography masterclass on Skillshare'),
        ('AG1 Morning Routine TikTok', 16, 13, 'TikTok', '2026-03-21 07:00:00', 'scheduled', 'Video', 'Athletic Greens as part of morning sports routine'),
        ('BetterHelp Story Time', 9, 15, 'YouTube', '2026-03-26 15:00:00', 'in_review', 'Long-form Video', 'Honest conversation about therapy and mental health'),
        ('Fenty Beauty Teaser', 3, 8, 'TikTok', '2026-04-10 18:00:00', 'draft', 'Video', 'Sneak peek of upcoming Fenty Beauty collection'),
        ('DW Watch Unboxing', 1, 4, 'Instagram', '2026-04-05 11:00:00', 'draft', 'Reel', 'Unboxing the new Daniel Wellington spring collection'),
        ('Revolve Festival Prep', 1, 12, 'Instagram', '2026-04-08 14:00:00', 'draft', 'Carousel', 'Festival outfit planning with Revolve pieces'),
        ('Science of Sleep', 10, 9, 'TikTok', '2026-03-24 20:00:00', 'scheduled', 'Video', 'The science behind good sleep habits with Calm'),
        ('Finance Tips x Squarespace', 12, 14, 'YouTube', '2026-03-30 09:00:00', 'scheduled', 'Sponsored Segment', 'Building a financial blog on Squarespace'),
        ('Dance Challenge x Nike', 13, 1, 'TikTok', '2026-03-27 17:00:00', 'scheduled', 'Video', 'Nike sneaker dance challenge trend'),
        ('DIY Home Decor Collab', 15, 11, 'YouTube', '2026-04-02 13:00:00', 'draft', 'Tutorial', 'Learn DIY home decor on Skillshare')
    `);
    console.log('  -> 16 content_calendar items seeded');

    // Contracts
    console.log('Seeding contracts...');
    await client.query(`
      INSERT INTO contracts (influencer_id, campaign_id, value, status, start_date, end_date, terms) VALUES
        (1, 1, 25000.00, 'active', '2026-03-01', '2026-05-31', '3 Instagram Reels, 5 Stories, 1 carousel post. Exclusivity clause for sportswear brands.'),
        (3, 2, 18000.00, 'active', '2026-03-15', '2026-04-30', '4 TikTok videos, minimum 60 seconds each. Product must be shown within first 10 seconds.'),
        (4, 3, 30000.00, 'active', '2026-01-01', '2026-03-07', '10 Instagram posts, daily stories during challenge. Must use official hashtag.'),
        (2, 7, 22000.00, 'active', '2026-03-01', '2026-03-31', '2 YouTube videos with 60-second integrated sponsorship. Include tracking link in description.'),
        (5, 5, 15000.00, 'active', '2026-02-15', '2026-04-15', '4 YouTube videos featuring HelloFresh recipes. Include promo code.'),
        (11, 9, 12000.00, 'active', '2026-02-01', '2026-04-30', '8 Instagram Stories, 2 Reels featuring Calm app. Must show app interface.'),
        (14, 11, 14000.00, 'pending', '2026-03-15', '2026-06-30', '3 YouTube tutorials teaching on Skillshare. Cross-promote on Instagram.'),
        (9, 15, 20000.00, 'active', '2026-01-01', '2026-06-30', '6 YouTube videos discussing therapy journey. Authentic storytelling required.'),
        (10, 9, 10000.00, 'active', '2026-02-01', '2026-04-30', '5 TikTok videos about sleep science. Must reference Calm app features.'),
        (13, 1, 16000.00, 'active', '2026-03-01', '2026-05-31', '3 TikTok dance videos wearing Nike. Original choreography required.'),
        (1, 4, 8000.00, 'draft', '2026-04-01', '2026-06-30', '2 Instagram Reels, 3 Stories unboxing DW watches.'),
        (12, 14, 18000.00, 'completed', '2025-10-01', '2025-12-31', '4 YouTube videos building a website on Squarespace. Include affiliate link.'),
        (6, 2, 14000.00, 'pending', '2026-03-20', '2026-04-30', '3 TikTok comedy skits featuring Glossier products in a humorous way.'),
        (16, 13, 11000.00, 'active', '2026-02-01', '2026-05-31', '4 TikTok videos integrating AG1 into workout routines.'),
        (15, 11, 9000.00, 'draft', '2026-04-01', '2026-06-30', '2 YouTube tutorials on DIY crafts. Promote Skillshare classes.')
    `);
    console.log('  -> 15 contracts seeded');

    // Payments
    console.log('Seeding payments...');
    await client.query(`
      INSERT INTO payments (influencer_id, campaign_id, contract_id, amount, status, payment_date, method, description) VALUES
        (1, 1, 1, 12500.00, 'paid', '2026-03-01', 'Bank Transfer', 'First installment - Nike Summer Style Drop'),
        (3, 2, 2, 9000.00, 'paid', '2026-03-15', 'PayPal', 'First installment - Glossier Glow Up'),
        (4, 3, 3, 15000.00, 'paid', '2026-01-01', 'Bank Transfer', 'First installment - Gymshark 66 Challenge'),
        (4, 3, 3, 15000.00, 'paid', '2026-02-15', 'Bank Transfer', 'Final installment - Gymshark 66 Challenge'),
        (2, 7, 4, 11000.00, 'paid', '2026-03-01', 'Wire Transfer', 'First installment - NordVPN Security Month'),
        (5, 5, 5, 7500.00, 'paid', '2026-02-15', 'PayPal', 'First installment - HelloFresh Meal Prep'),
        (11, 9, 6, 6000.00, 'paid', '2026-02-01', 'Bank Transfer', 'First installment - Calm Sleep Series'),
        (9, 15, 8, 10000.00, 'paid', '2026-01-01', 'Wire Transfer', 'First installment - BetterHelp Awareness'),
        (10, 9, 9, 5000.00, 'paid', '2026-02-01', 'PayPal', 'First installment - Calm Sleep Science'),
        (13, 1, 10, 8000.00, 'paid', '2026-03-01', 'Bank Transfer', 'First installment - Nike Dance Challenge'),
        (12, 14, 12, 18000.00, 'paid', '2025-12-31', 'Wire Transfer', 'Full payment - Squarespace Build It'),
        (16, 13, 14, 5500.00, 'paid', '2026-02-01', 'PayPal', 'First installment - AG1 Daily Routine'),
        (1, 1, 1, 12500.00, 'pending', '2026-05-31', 'Bank Transfer', 'Final installment - Nike Summer Style Drop'),
        (2, 7, 4, 11000.00, 'pending', '2026-03-31', 'Wire Transfer', 'Final installment - NordVPN Security Month'),
        (5, 5, 5, 7500.00, 'pending', '2026-04-15', 'PayPal', 'Final installment - HelloFresh Meal Prep'),
        (3, 2, 2, 9000.00, 'pending', '2026-04-30', 'PayPal', 'Final installment - Glossier Glow Up')
    `);
    console.log('  -> 16 payments seeded');

    // Outreach Messages
    console.log('Seeding outreach_messages...');
    await client.query(`
      INSERT INTO outreach_messages (influencer_id, campaign_id, subject, message, status, sent_date, response) VALUES
        (7, 4, 'Collaboration Opportunity - Daniel Wellington', 'Hi Zoe! We love your travel content and think our spring collection would be a perfect fit. Interested in a collab?', 'replied', '2026-03-10 09:00:00', 'Thanks for reaching out! I''d love to learn more about the campaign details.'),
        (8, 7, 'NordVPN x Gaming Partnership', 'Hey Noah, we''re looking for gaming creators to showcase VPN benefits for online gaming. Would you be interested?', 'replied', '2026-03-08 11:00:00', 'Sounds great! I already use NordVPN so this would be authentic. Let''s chat.'),
        (6, 1, 'Nike Comedy Collaboration', 'Hi Liam! Nike is looking for comedic creators to put a fun spin on our summer collection. Your style is perfect.', 'sent', '2026-03-12 14:00:00', NULL),
        (15, 5, 'HelloFresh x DIY Cooking', 'Hey Chloe! Your DIY approach would be amazing for a HelloFresh recipe series. Interested?', 'replied', '2026-03-05 10:00:00', 'I love HelloFresh! I''d definitely be interested in creating some recipe content.'),
        (7, 12, 'Revolve Festival Fashion', 'Hi Zoe! Revolve is putting together an influencer trip for Coachella. Your travel + fashion content is ideal.', 'sent', '2026-03-14 16:00:00', NULL),
        (8, 11, 'Teach Gaming on Skillshare', 'Hey Noah, Skillshare is looking for gaming creators to teach courses. Would you be interested in creating one?', 'declined', '2026-03-01 13:00:00', 'Appreciate the offer but I''m fully booked for the next few months. Maybe next quarter?'),
        (6, 13, 'AG1 x Comedy', 'Hi Liam! Athletic Greens is looking for creators who can make health supplements fun and relatable.', 'replied', '2026-03-09 08:00:00', 'Interesting! I could definitely put a comedic twist on a morning routine video.'),
        (7, 9, 'Calm App Travel Partnership', 'Hi Zoe! We think meditation + travel content could be a beautiful combination. Would you like to collaborate with Calm?', 'replied', '2026-03-11 15:00:00', 'This is such a natural fit! I meditate during my travels. Let''s discuss.'),
        (15, 13, 'AG1 x Crafting Energy', 'Hey Chloe! Athletic Greens would love to sponsor your crafting sessions. Fuel your creativity with AG1!', 'sent', '2026-03-13 09:00:00', NULL),
        (8, 1, 'Nike Gaming Crossover', 'Hey Noah! Nike is exploring gaming x sports crossover content. Your audience would be perfect.', 'sent', '2026-03-15 10:00:00', NULL),
        (6, 15, 'BetterHelp Comedy Partnership', 'Hi Liam! BetterHelp wants to destigmatize therapy through humor. Your comedic talent could help reach new audiences.', 'replied', '2026-03-07 11:00:00', 'Mental health is important to me. I''d love to help normalize therapy through humor.'),
        (7, 13, 'AG1 Travel Routine', 'Hi Zoe! Athletic Greens on-the-go packets are perfect for travelers. Want to feature them in your content?', 'draft', NULL, NULL),
        (15, 15, 'BetterHelp x DIY Self-Care', 'Hey Chloe! BetterHelp is looking for creators who can connect self-care activities with mental wellness.', 'draft', NULL, NULL),
        (8, 13, 'AG1 Gaming Fuel', 'Hey Noah! Athletic Greens wants to position AG1 as the gamer''s fuel. Interested in a sponsored series?', 'sent', '2026-03-16 12:00:00', NULL),
        (6, 8, 'Fenty Beauty x Comedy', 'Hi Liam! Fenty Beauty is launching a new line and wants comedic content. Your viral videos would be amazing.', 'draft', NULL, NULL)
    `);
    console.log('  -> 15 outreach_messages seeded');

    // Audience Insights
    console.log('Seeding audience_insights...');
    await client.query(`
      INSERT INTO audience_insights (influencer_id, age_group, gender_split, top_locations, interests, avg_engagement, growth_rate) VALUES
        (1, '18-24: 35%, 25-34: 45%, 35-44: 15%, 45+: 5%', 'Female: 72%, Male: 25%, Other: 3%', 'Los Angeles, New York, London, Paris, Miami', 'Fashion, Beauty, Lifestyle, Travel, Shopping', 4.80, 2.30),
        (2, '18-24: 40%, 25-34: 35%, 35-44: 18%, 45+: 7%', 'Male: 68%, Female: 29%, Other: 3%', 'San Francisco, New York, Austin, Seattle, Tokyo', 'Technology, Gadgets, Programming, Gaming, Science', 3.20, 3.10),
        (3, '13-17: 25%, 18-24: 45%, 25-34: 22%, 35+: 8%', 'Female: 82%, Male: 15%, Other: 3%', 'New York, Los Angeles, London, Toronto, Sydney', 'Beauty, Skincare, Makeup, Fashion, Self-care', 7.50, 5.80),
        (4, '18-24: 30%, 25-34: 40%, 35-44: 22%, 45+: 8%', 'Male: 58%, Female: 40%, Other: 2%', 'Miami, Houston, Atlanta, Chicago, Dallas', 'Fitness, Nutrition, Bodybuilding, Health, Sports', 5.10, 1.90),
        (5, '25-34: 38%, 35-44: 30%, 18-24: 20%, 45+: 12%', 'Female: 65%, Male: 33%, Other: 2%', 'Chicago, New York, Houston, Phoenix, Philadelphia', 'Cooking, Food, Recipes, Family, Home', 4.20, 2.50),
        (6, '13-17: 30%, 18-24: 42%, 25-34: 20%, 35+: 8%', 'Male: 52%, Female: 45%, Other: 3%', 'Austin, Los Angeles, New York, Chicago, Nashville', 'Comedy, Entertainment, Memes, Music, Pop Culture', 8.30, 6.20),
        (7, '18-24: 28%, 25-34: 42%, 35-44: 20%, 45+: 10%', 'Female: 60%, Male: 37%, Other: 3%', 'Seattle, Portland, Vancouver, Tokyo, Bali', 'Travel, Photography, Adventure, Culture, Food', 6.70, 3.40),
        (8, '13-17: 35%, 18-24: 40%, 25-34: 18%, 35+: 7%', 'Male: 75%, Female: 22%, Other: 3%', 'Portland, Los Angeles, New York, London, Seoul', 'Gaming, Esports, Technology, Anime, Streaming', 3.80, 4.10),
        (9, '25-34: 40%, 35-44: 32%, 18-24: 15%, 45+: 13%', 'Female: 78%, Male: 20%, Other: 2%', 'Dallas, Houston, Nashville, Atlanta, Phoenix', 'Parenting, Lifestyle, Family, Home Decor, Fashion', 5.40, 1.80),
        (10, '13-17: 20%, 18-24: 45%, 25-34: 25%, 35+: 10%', 'Male: 48%, Female: 49%, Other: 3%', 'Boston, New York, London, San Francisco, Berlin', 'Science, Education, Physics, Space, Technology', 9.20, 7.50),
        (11, '25-34: 42%, 35-44: 28%, 18-24: 20%, 45+: 10%', 'Female: 70%, Male: 27%, Other: 3%', 'Denver, Los Angeles, Austin, Portland, Boulder', 'Yoga, Meditation, Wellness, Fitness, Mindfulness', 4.50, 2.10),
        (12, '25-34: 45%, 35-44: 25%, 18-24: 18%, 45+: 12%', 'Male: 62%, Female: 35%, Other: 3%', 'New York, San Francisco, Chicago, London, Singapore', 'Finance, Investing, Crypto, Stocks, Economics', 3.60, 4.50),
        (13, '13-17: 32%, 18-24: 43%, 25-34: 18%, 35+: 7%', 'Female: 68%, Male: 29%, Other: 3%', 'Atlanta, Los Angeles, New York, Houston, Chicago', 'Dance, Music, Choreography, Fashion, Fitness', 8.80, 5.90),
        (14, '18-24: 30%, 25-34: 40%, 35-44: 20%, 45+: 10%', 'Male: 55%, Female: 42%, Other: 3%', 'San Diego, Los Angeles, Portland, Denver, Reykjavik', 'Photography, Travel, Nature, Art, Cameras', 5.90, 2.80),
        (15, '25-34: 35%, 35-44: 30%, 18-24: 22%, 45+: 13%', 'Female: 75%, Male: 23%, Other: 2%', 'Nashville, Austin, Portland, Atlanta, Denver', 'DIY, Crafts, Home Decor, Upcycling, Interior Design', 4.10, 1.60)
    `);
    console.log('  -> 15 audience_insights seeded');

    // Competitors
    console.log('Seeding competitors...');
    await client.query(`
      INSERT INTO competitors (name, platform, followers, engagement_rate, niche, strengths, weaknesses) VALUES
        ('CreatorIQ', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Enterprise-level analytics, strong brand partnerships, data-driven insights', 'Expensive pricing, complex onboarding, less focus on small creators'),
        ('Grin', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'E-commerce integration, relationship management, ROI tracking', 'Limited free tier, primarily DTC focused, smaller influencer database'),
        ('AspireIQ', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Community-driven approach, content management, good UX', 'Fewer enterprise features, limited analytics depth, smaller team'),
        ('Traackr', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Global influencer database, compliance tools, spend management', 'High learning curve, premium pricing, limited small business support'),
        ('Upfluence', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Chrome extension, e-commerce plugins, affiliate management', 'Interface can be clunky, limited customer support, data accuracy issues'),
        ('HypeAuditor', 'Multi-platform', 0, 0.00, 'Influencer Analytics', 'Fraud detection, audience quality analysis, competitive benchmarking', 'Limited campaign management, no outreach tools, analytics-only focus'),
        ('Influencity', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'AI-powered search, affordable pricing, good filtering', 'Smaller database, fewer integrations, limited reporting'),
        ('Klear', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Meltwater integration, monitoring tools, demographic insights', 'Bundled pricing with Meltwater, limited standalone value, complex setup'),
        ('Mavrck', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Loyalty programs, ambassador management, micro-influencer focus', 'Less focus on macro influencers, limited video analytics, niche positioning'),
        ('Julius', 'Multi-platform', 0, 0.00, 'Influencer Discovery', 'White-glove service, curated database, account management', 'Very expensive, limited self-service, smaller tech team'),
        ('Brandwatch Influence', 'Multi-platform', 0, 0.00, 'Social Intelligence', 'Social listening integration, trend analysis, sentiment tracking', 'Primarily analytics, limited campaign execution, enterprise pricing'),
        ('Modash', 'Multi-platform', 0, 0.00, 'Influencer Discovery', 'Large database (250M+), audience analytics, affordable plans', 'No campaign management, discovery-only focus, limited CRM features'),
        ('Captiv8', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'AI-powered matching, branded content marketplace, TikTok focus', 'Premium pricing, limited mid-market features, newer platform'),
        ('Heepsy', 'Multi-platform', 0, 0.00, 'Influencer Discovery', 'Budget-friendly, easy-to-use interface, quick search', 'Basic features, limited analytics, no campaign management tools'),
        ('Tagger Media', 'Multi-platform', 0, 0.00, 'Influencer Marketing SaaS', 'Sprout Social integration, content planning, competitive analysis', 'Recently acquired, platform changes, integration-dependent value')
    `);
    console.log('  -> 15 competitors seeded');

    // Benchmarks
    console.log('Seeding benchmarks...');
    await client.query(`
      INSERT INTO benchmarks (category, metric_name, value, industry_avg, top_performer, period) VALUES
        ('Instagram', 'Engagement Rate', 3.50, 2.80, 7.50, 'Q1 2026'),
        ('TikTok', 'Engagement Rate', 6.20, 5.10, 12.00, 'Q1 2026'),
        ('YouTube', 'View Rate', 4.80, 3.50, 9.20, 'Q1 2026'),
        ('Instagram', 'Story Completion Rate', 72.00, 65.00, 88.00, 'Q1 2026'),
        ('TikTok', 'Average Watch Time (sec)', 18.50, 12.00, 35.00, 'Q1 2026'),
        ('YouTube', 'Click-Through Rate', 5.20, 3.80, 11.00, 'Q1 2026'),
        ('Instagram', 'Follower Growth Rate', 2.10, 1.50, 5.80, 'Q1 2026'),
        ('TikTok', 'Follower Growth Rate', 4.30, 3.00, 10.50, 'Q1 2026'),
        ('YouTube', 'Subscriber Growth Rate', 1.80, 1.20, 4.50, 'Q1 2026'),
        ('Instagram', 'Cost Per Engagement', 0.15, 0.22, 0.05, 'Q1 2026'),
        ('TikTok', 'Cost Per Engagement', 0.08, 0.12, 0.02, 'Q1 2026'),
        ('YouTube', 'Cost Per View', 0.03, 0.05, 0.01, 'Q1 2026'),
        ('All Platforms', 'Average ROI', 5.20, 4.10, 11.00, 'Q1 2026'),
        ('All Platforms', 'Conversion Rate', 2.80, 1.90, 6.50, 'Q1 2026'),
        ('All Platforms', 'Brand Recall Lift', 14.50, 10.00, 28.00, 'Q1 2026')
    `);
    console.log('  -> 15 benchmarks seeded');

    // Analytics
    console.log('Seeding analytics...');
    await client.query(`
      INSERT INTO analytics (influencer_id, campaign_id, impressions, clicks, conversions, engagement_rate, roi, period) VALUES
        (1, 1, 850000, 42500, 3200, 5.20, 320.00, 'March 2026'),
        (3, 2, 1200000, 96000, 7800, 8.10, 450.00, 'March 2026'),
        (4, 3, 620000, 31000, 2100, 5.50, 280.00, 'Jan-Mar 2026'),
        (2, 7, 980000, 58800, 4900, 6.10, 520.00, 'March 2026'),
        (5, 5, 450000, 27000, 2300, 6.20, 380.00, 'Feb-Mar 2026'),
        (11, 9, 320000, 19200, 1500, 6.00, 290.00, 'Feb-Mar 2026'),
        (9, 15, 780000, 39000, 3100, 5.10, 340.00, 'Jan-Mar 2026'),
        (10, 9, 560000, 44800, 3600, 8.20, 410.00, 'Feb-Mar 2026'),
        (13, 1, 1100000, 77000, 5500, 7.20, 480.00, 'March 2026'),
        (16, 13, 480000, 28800, 1900, 6.30, 310.00, 'Feb-Mar 2026'),
        (12, 14, 720000, 43200, 3800, 6.10, 550.00, 'Oct-Dec 2025'),
        (6, 2, 890000, 71200, 4200, 8.50, 390.00, 'March 2026'),
        (14, 11, 380000, 22800, 1700, 6.10, 270.00, 'March 2026'),
        (15, 11, 290000, 17400, 1300, 6.00, 250.00, 'March 2026'),
        (8, 7, 750000, 45000, 3200, 6.10, 440.00, 'March 2026')
    `);
    console.log('  -> 15 analytics seeded');

    // ROI Calculations
    console.log('Seeding roi_calculations...');
    await client.query(`
      INSERT INTO roi_calculations (campaign_id, investment, revenue, roi_percentage, cpe, cpc, notes) VALUES
        (1, 150000.00, 630000.00, 320.00, 0.12, 0.85, 'Nike Summer Style Drop performing above expectations. Instagram Reels driving strong conversions.'),
        (2, 85000.00, 467500.00, 450.00, 0.06, 0.42, 'Glossier TikTok campaign viral success. UGC content amplifying reach beyond paid creators.'),
        (3, 200000.00, 760000.00, 280.00, 0.18, 1.20, 'Gymshark 66 Challenge strong community engagement but lower direct sales conversion.'),
        (5, 120000.00, 576000.00, 380.00, 0.10, 0.65, 'HelloFresh meal prep content driving steady subscription signups.'),
        (6, 95000.00, 380000.00, 300.00, 0.14, 0.90, 'Audible Book Club campaign completed. Consistent app downloads throughout Q4.'),
        (7, 180000.00, 1116000.00, 520.00, 0.08, 0.48, 'NordVPN campaign exceeding targets. Tech audience highly responsive to security content.'),
        (9, 75000.00, 292500.00, 290.00, 0.11, 0.72, 'Calm Sleep Series steady performance. Wellness niche showing reliable engagement.'),
        (10, 45000.00, 180000.00, 300.00, 0.15, 0.95, 'MVMT Holiday campaign completed. Strong Q4 sales during gift season.'),
        (11, 110000.00, 396000.00, 260.00, 0.13, 0.88, 'Skillshare Creator Fund moderate performance. Long-tail enrollment expected.'),
        (13, 90000.00, 369000.00, 310.00, 0.09, 0.58, 'AG1 TikTok content resonating well with fitness audience. Strong morning routine trend.'),
        (14, 130000.00, 845000.00, 550.00, 0.07, 0.38, 'Squarespace campaign completed. Portfolio content drove sustained signups post-campaign.'),
        (15, 160000.00, 704000.00, 340.00, 0.11, 0.68, 'BetterHelp campaign strong sentiment. Authentic creator stories driving signups.'),
        (4, 60000.00, 0.00, 0.00, 0.00, 0.00, 'DW Spring Campaign not yet started. Projected ROI: 280% based on historical data.'),
        (8, 250000.00, 0.00, 0.00, 0.00, 0.00, 'Fenty Beauty Launch planned. Projected ROI: 400% based on brand performance history.'),
        (12, 300000.00, 0.00, 0.00, 0.00, 0.00, 'Revolve Festival Style planned. Projected ROI: 350% based on previous festival campaigns.')
    `);
    console.log('  -> 15 roi_calculations seeded');

    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================');
    console.log('Demo users created; password was supplied through DEMO_ADMIN_PASSWORD.');
    console.log('========================================\n');

  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
