from datetime import date, timedelta
from app import create_app
from extensions import db
from models import Member

app = create_app()

with app.app_context():
    today = date.today()
    members = Member.query.all()
    
    for member in members:
        member.expiry_date = today + timedelta(days=365)
        member.status = 'active'
        print(f'Updated member {member.member_no} ({member.name}): expiry = {member.expiry_date}')
    
    db.session.commit()
    print(f'\nUpdated {len(members)} members successfully!')
