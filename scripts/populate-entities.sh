#!/bin/bash
# Populate story_main_entity table from news_item_tag data

docker exec sentinel-database psql -U taranis -d taranis << 'EOF'
-- Clear existing data
TRUNCATE story_main_entity;

-- Populate story_main_entity from news_item_tag
INSERT INTO story_main_entity (story_id, entity_name, entity_type, location_subtype, confidence, created_at)
SELECT
    nit.story_id,
    nit.name as entity_name,
    CASE
        WHEN nit.tag_type = 'Location' THEN 'Location'
        WHEN nit.tag_type = 'Person' THEN 'Person'
        WHEN nit.tag_type = 'Organization' THEN 'Organization'
        ELSE nit.tag_type
    END as entity_type,
    CASE WHEN nit.tag_type = 'Location' THEN 'Country' ELSE NULL END as location_subtype,
    0.8 as confidence,
    NOW() as created_at
FROM news_item_tag nit
WHERE nit.story_id IS NOT NULL;

-- Show counts
SELECT entity_type, COUNT(*) as count
FROM story_main_entity
GROUP BY entity_type
ORDER BY count DESC;
EOF
