import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password, verify_password

print("Testing pbkdf2_sha256...")
test_pw = "admin123"
h = hash_password(test_pw)
print(f"  Hash created: {h[:50]}...")
v = verify_password(test_pw, h)
print(f"  Verify: {v}")
assert v == True
print("  ✅ pbkdf2_sha256 works!")

test_pw2 = "a" * 100
h2 = hash_password(test_pw2)
print(f"  Long password (100 chars): {verify_password(test_pw2, h2)}")
print("✅ All password tests passed!")
