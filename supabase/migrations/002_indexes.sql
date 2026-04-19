-- Full-text search
create index idx_business_name_trgm on businesses using gin (name gin_trgm_ops);
create index idx_business_city on businesses (city);

-- Geo search
create index idx_location on businesses using gist (location);

-- Lead lookups
create index idx_leads_business on leads (business_id);
create index idx_leads_status on leads (status);
