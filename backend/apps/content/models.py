"""
File:    backend/apps/content/models.py
Purpose: ContentItem (school-private learning materials) + MarketplaceListing (public catalog).
Why:     Teachers upload material privately per school; marketplace is a cross-school public store.
Owner:   Vishal
TODO:    class ContentItem(TenantModel):
           - course FK, klass FK(null=True), title, description,
           - kind = CharField(choices=[VIDEO, PDF, ARTICLE, INTERACTIVE, COURSE]),
           - file_url = URLField, duration_seconds,
           - ai_tags = JSONField(default=list),   # populated by content_agent
           - uploaded_by FK(User)

         class MarketplaceListing(TimeStampedModel):
           # Not tenant-scoped — public.
           - title, description, author_school FK(School),
           - kind, price_inr, file_url, cover_image_url,
           - is_active, featured
"""
