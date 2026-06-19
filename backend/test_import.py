import sys
sys.path.insert(0, '.')

print('1. Testing database connection...')
try:
    from app.database import engine, Base, get_db
    from sqlalchemy import text
    db = next(get_db())
    result = db.execute(text('SELECT 1'))
    print(f'   ✓ Database connection OK: {result.scalar()}')
    db.close()
except Exception as e:
    print(f'   ✗ Database error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('2. Testing model import...')
try:
    from app.models import User, Counselor, TimeSlot, Schedule, Appointment
    print('   ✓ Models imported OK')
except Exception as e:
    print(f'   ✗ Model error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('3. Testing schema import...')
try:
    from app import schemas
    print('   ✓ Schemas imported OK')
except Exception as e:
    print(f'   ✗ Schema error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('4. Creating tables...')
try:
    Base.metadata.create_all(bind=engine)
    print('   ✓ Tables created OK')
except Exception as e:
    print(f'   ✗ Table creation error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('5. Testing router imports...')
try:
    from app.routers import auth, counselors, schedules, appointments, config, reports
    print('   ✓ Routers imported OK')
except Exception as e:
    print(f'   ✗ Router error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('6. Testing main app import...')
try:
    from app.main import app
    print('   ✓ Main app imported OK')
except Exception as e:
    print(f'   ✗ Main app error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print('✓ All tests passed!')
