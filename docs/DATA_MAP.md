# UniVerse AI Data Storage Map
 
- Users: stored in `MongoDB` collection `users`; accessed via `api.py` `/api/auth/register` and `/api/auth/login` from `auth.html` and `auth-script.js`.
- Educational Content: stored in collection `educational_content`; accessed via `api.py` `/api/library/save` and `/api/library/list` from `library.html` and `generator.html` (save planned).
- Chat History: stored in collection `chat_history`; available via `database/operations.py`; UI integration planned for `chat.html`.
- Analytics: stored in collection `analytics`; used by backend via `database/operations.py`; UI page `analytics.html` planned.
- User Sessions: stored in collection `user_sessions`; reserved for future secure session management.
 
- Database Health: `api.py` `/api/db/health` and `/api/db/verify`; shown in `library.html` status.
 
- Tokens: JWT saved as `universe_token` in browser `localStorage` or `sessionStorage`; used as `Authorization: Bearer <token>` for API calls.
