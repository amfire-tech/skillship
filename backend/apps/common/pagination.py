"""
File:    backend/apps/common/pagination.py
Purpose: Standard pagination class used by every list endpoint.
Why:     Consistent page size + response shape across the whole API.
Owner:   Navanish
TODO:    class StandardPagination(PageNumberPagination): page_size=20, max_page_size=100,
         page_size_query_param="page_size".
"""
