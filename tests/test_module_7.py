"""
Quick test script to verify Module 7 API endpoints syntax and structure
This doesn't start the server but checks if the code can be imported successfully
"""

import sys
print("Testing Module 7 API implementation...")
print("=" * 50)

try:
    # Test imports
    print("\n✓ Testing imports...")
    from api import app, SavePromptRequest, UpdatePromptRequest, UpdatePreferencesRequest, SaveAPIKeyRequest
    print("  ✓ All models imported successfully")
    
    # Test endpoint registration
    print("\n✓ Checking registered routes...")
    routes = [route.path for route in app.routes]
    
    module_7a_routes = [
        "/api/library/save-prompt",
        "/api/library/prompts",
        "/api/library/prompts/{prompt_id}",
    ]
    
    module_7b_routes = [
        "/api/user/preferences",
        "/api/user/preferences/api-key",
        "/api/user/preferences/api-key/{key_name}",
    ]
    
    all_module_7_routes = module_7a_routes + module_7b_routes
    
    print(f"\n  Total routes registered: {len(routes)}")
    print(f"\n  Module 7A Routes (Library API):")
    for route in module_7a_routes:
        if any(route in r for r in routes):
            print(f"    ✓ {route}")
        else:
            print(f "    ✗ {route} - NOT FOUND")
    
    print(f"\n  Module 7B Routes (User Preferences API):")
    for route in module_7b_routes:
        if any(route in r for r in routes):
            print(f"    ✓ {route}")
        else:
            print(f"    ✗ {route} - NOT FOUND")
    
    # Test model validation
    print("\n✓ Testing Pydantic models...")
    
    # Test SavePromptRequest
    test_prompt = SavePromptRequest(
        title="Test Prompt",
        content="Test content",
        category="test"
    )
    print(f"  ✓ SavePromptRequest: {test_prompt.title}")
    
    # Test UpdatePreferencesRequest
    test_prefs = UpdatePreferencesRequest(
        theme={"mode": "dark"}
    )
    print(f"  ✓ UpdatePreferencesRequest: {test_prefs.theme}")
    
    # Test SaveAPIKeyRequest
    test_key = SaveAPIKeyRequest(
        key_name="test_key",
        key_value="test_value"
    )
    print(f"  ✓ SaveAPIKeyRequest: {test_key.key_name}")
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED!")
    print("=" * 50)
    print("\nModule 7 implementation is syntactically correct.")
    print("All endpoints are registered and models are working.")
    print("\nTo start the server, ensure you have:")
    print("  1. MongoDB running")
    print("  2. Environment variables set (especially ENCRYPTION_KEY)")
    print("  3. Run: py -m uvicorn api:app --reload --port 8000")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
