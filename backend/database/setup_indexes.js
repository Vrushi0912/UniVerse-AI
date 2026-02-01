// ====================================================================
// MongoDB Index Setup Script for UniVerse AI
// Run this script to create all performance indexes
// Usage: mongosh universe_ai --file setup_indexes.js
// ====================================================================

print("🚀 Starting index creation for UniVerse AI database...\n");

// Switch to database
use universe_ai;

// ====================================================================
// 1. USERS COLLECTION INDEXES
// ====================================================================
print("📊 Creating indexes for 'users' collection...");

db.users.createIndex({ "email": 1 }, {
    unique: true,
    name: "idx_email_unique"
});

db.users.createIndex({ "created_at": -1 }, {
    name: "idx_created_at"
});

db.users.createIndex({ "last_login": -1 }, {
    name: "idx_last_login"
});

db.users.createIndex({
    "subscription_tier": 1,
    "is_active": 1
}, {
    name: "idx_subscription_active"
});

db.users.createIndex({ "oauth_provider": 1 }, {
    sparse: true,
    name: "idx_oauth_provider"
});

print("✅ Users indexes created\n");

// ====================================================================
// 2. USER_SESSIONS COLLECTION INDEXES
// ====================================================================
print("📊 Creating indexes for 'user_sessions' collection...");

db.user_sessions.createIndex({ "session_token": 1 }, {
    unique: true,
    name: "idx_session_token_unique"
});

db.user_sessions.createIndex({
    "user_id": 1,
    "is_active": 1
}, {
    name: "idx_user_active"
});

db.user_sessions.createIndex({ "created_at": -1 }, {
    name: "idx_created_at"
});

// TTL Index - Auto-delete expired sessions after 7 days
db.user_sessions.createIndex({ "expires_at": 1 }, {
    expireAfterSeconds: 604800,  // 7 days in seconds
    name: "idx_expires_at_ttl"
});

print("✅ User sessions indexes created (including TTL)\n");

// ====================================================================
// 3. CHAT_HISTORY COLLECTION INDEXES
// ====================================================================
print("📊 Creating indexes for 'chat_history' collection...");

db.chat_history.createIndex({
    "user_id": 1,
    "updated_at": -1
}, {
    name: "idx_user_updated"
});

db.chat_history.createIndex({ "session_id": 1 }, {
    unique: true,
    name: "idx_session_id_unique"
});

db.chat_history.createIndex({
    "user_id": 1,
    "is_archived": 1
}, {
    name: "idx_user_archived"
});

db.chat_history.createIndex({
    "user_id": 1,
    "is_favorite": 1
}, {
    name: "idx_user_favorite"
});

db.chat_history.createIndex({
    "user_id": 1,
    "tags": 1
}, {
    name: "idx_user_tags"
});

db.chat_history.createIndex({ "created_at": -1 }, {
    name: "idx_created_at"
});

// Text search index for chat content
db.chat_history.createIndex(
    {
        "title": "text",
        "messages.content": "text"
    },
    {
        name: "idx_chat_content_search",
        weights: {
            title: 2,
            "messages.content": 1
        }
    }
);

print("✅ Chat history indexes created (including text search)\n");

// ====================================================================
// 4. SAVED_PROMPTS COLLECTION INDEXES
// ====================================================================
print("📊 Creating indexes for 'saved_prompts' collection...");

db.saved_prompts.createIndex({
    "user_id": 1,
    "created_at": -1
}, {
    name: "idx_user_created"
});

db.saved_prompts.createIndex({
    "user_id": 1,
    "is_favorite": 1
}, {
    name: "idx_user_favorite"
});

db.saved_prompts.createIndex({
    "user_id": 1,
    "category": 1
}, {
    name: "idx_user_category"
});

db.saved_prompts.createIndex({
    "user_id": 1,
    "tags": 1
}, {
    name: "idx_user_tags"
});

db.saved_prompts.createIndex({ "prompt_id": 1 }, {
    unique: true,
    name: "idx_prompt_id_unique"
});

// Text search index with weighted fields
db.saved_prompts.createIndex(
    {
        "prompt": "text",
        "response": "text",
        "title": "text"
    },
    {
        name: "idx_prompt_search",
        weights: {
            title: 3,
            prompt: 2,
            response: 1
        }
    }
);

// Public sharing indexes (for future feature)
db.saved_prompts.createIndex({
    "is_public": 1,
    "created_at": -1
}, {
    name: "idx_public_created",
    sparse: true
});

db.saved_prompts.createIndex({ "share_link": 1 }, {
    sparse: true,
    unique: true,
    name: "idx_share_link_unique"
});

print("✅ Saved prompts indexes created (including text search)\n");

// ====================================================================
// 5. USER_PREFERENCES COLLECTION INDEXES
// ====================================================================
print("📊 Creating indexes for 'user_preferences' collection...");

db.user_preferences.createIndex({ "user_id": 1 }, {
    unique: true,
    name: "idx_user_id_unique"
});

db.user_preferences.createIndex({ "updated_at": -1 }, {
    name: "idx_updated_at"
});

print("✅ User preferences indexes created\n");

// ====================================================================
// 6. ANALYTICS COLLECTION INDEXES
// ====================================================================
print("📊 Creating indexes for 'analytics' collection...");

// Time-series indexes
db.analytics.createIndex({ "timestamp": -1 }, {
    name: "idx_timestamp"
});

db.analytics.createIndex({
    "user_id": 1,
    "timestamp": -1
}, {
    name: "idx_user_timestamp"
});

db.analytics.createIndex({
    "event_type": 1,
    "timestamp": -1
}, {
    name: "idx_event_type_timestamp"
});

// User engagement indexes
db.analytics.createIndex({
    "user_id": 1,
    "daily_active": 1
}, {
    name: "idx_user_daily_active"
});

db.analytics.createIndex({
    "feature_used": 1,
    "timestamp": -1
}, {
    name: "idx_feature_timestamp"
});

// Performance analysis
db.analytics.createIndex({
    "event_type": 1,
    "error_occurred": 1
}, {
    name: "idx_event_errors"
});

db.analytics.createIndex({ "session_id": 1 }, {
    name: "idx_session_id"
});

// Compound index for complex queries
db.analytics.createIndex({
    "event_type": 1,
    "timestamp": -1,
    "user_id": 1
}, {
    name: "idx_event_timestamp_user"
});

// TTL Index - Auto-delete analytics data older than 90 days
db.analytics.createIndex({ "timestamp": 1 }, {
    expireAfterSeconds: 7776000,  // 90 days in seconds
    name: "idx_timestamp_ttl"
});

print("✅ Analytics indexes created (including TTL)\n");

// ====================================================================
// VERIFICATION
// ====================================================================
print("\n🔍 Verifying indexes...\n");

const collections = [
    'users',
    'user_sessions',
    'chat_history',
    'saved_prompts',
    'user_preferences',
    'analytics'
];

collections.forEach(collName => {
    const indexes = db.getCollection(collName).getIndexes();
    print(`${collName}: ${indexes.length} indexes`);
});

print("\n✅ All indexes created successfully!");
print("📊 Total collections indexed: " + collections.length);
print("\n🎉 Setup complete! Your database is optimized for performance.");
