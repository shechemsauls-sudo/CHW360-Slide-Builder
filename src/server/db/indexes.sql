-- Database indexes for CHW360 tables
-- Run manually against Supabase: copy into SQL Editor or use `psql`

CREATE INDEX IF NOT EXISTS idx_contact_submissions_crm_contact_id ON chw360_contact_submissions(crm_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON chw360_contact_submissions(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON chw360_contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_notes_contact_id ON chw360_crm_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_page_views_event ON chw360_page_views(event);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON chw360_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page ON chw360_page_views(page);
CREATE INDEX IF NOT EXISTS idx_decks_profile_id ON chw360_decks(profile_id);
