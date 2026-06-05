from app import create_app, db
from app.models import *

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Student': Student, 'Mentor': Mentor,
            'IndustryTag': IndustryTag, 'Appointment': Appointment,
            'Feedback': Feedback, 'Notification': Notification,
            'AuditLog': AuditLog}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9001, debug=True)
