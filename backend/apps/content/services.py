"""
File:    backend/apps/content/services.py
Purpose: Upload handling + AI tagging trigger + marketplace purchase flow.
Why:     Uploads must go to object storage (S3/Spaces), then trigger a background AI-tagging job.
         Marketplace purchase needs a safe record of the transaction.
Owner:   Vishal
TODO:    - upload_content(file, metadata, user) -> ContentItem  (saves file, queues ai_tag job)
         - tag_content_with_ai(content_item) -> ai_tags (calls ai_bridge.tag_content)
         - purchase_listing(listing, buyer_school) -> creates ContentItem copy in buyer's tenant
"""
