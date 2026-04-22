-- Add cover_image_url to businesses (computed from first business_image)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Update existing businesses
UPDATE businesses b
SET cover_image_url = (
  SELECT image_url FROM business_images bi
  WHERE bi.business_id = b.id
  ORDER BY created_at LIMIT 1
)
WHERE cover_image_url IS NULL;

-- Create function to auto-update cover on image insert
CREATE OR REPLACE FUNCTION update_business_cover()
RETURNS trigger AS $$
BEGIN
  UPDATE businesses 
  SET cover_image_url = NEW.image_url
  WHERE id = NEW.business_id AND cover_image_url IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_business_image_insert ON business_images;
CREATE TRIGGER on_business_image_insert
  AFTER INSERT ON business_images
  FOR EACH ROW EXECUTE FUNCTION update_business_cover();
