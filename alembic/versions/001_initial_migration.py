"""initial migration

Revision ID: 001
Revises: 
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_code'), 'categories', ['code'], unique=True)
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)

    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)

    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    op.create_table(
        'vendors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('contact_person', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED', name='vendorstatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendors_id'), 'vendors', ['id'], unique=False)
    op.create_index(op.f('ix_vendors_name'), 'vendors', ['name'], unique=False)
    op.create_index(op.f('ix_vendors_status'), 'vendors', ['status'], unique=False)

    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    op.create_table(
        'booths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booth_number', sa.String(length=50), nullable=False),
        sa.Column('zone', sa.String(length=50), nullable=True),
        sa.Column('position_order', sa.Integer(), nullable=False),
        sa.Column('size', sa.String(length=50), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('status', sa.Enum('AVAILABLE', 'ASSIGNED', 'OCCUPIED', 'MAINTENANCE', name='boothstatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booths_booth_number'), 'booths', ['booth_number'], unique=True)
    op.create_index(op.f('ix_booths_id'), 'booths', ['id'], unique=False)
    op.create_index(op.f('ix_booths_status'), 'booths', ['status'], unique=False)
    op.create_index(op.f('ix_booths_zone'), 'booths', ['zone'], unique=False)

    op.create_table(
        'vendor_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('product_description', sa.Text(), nullable=True),
        sa.Column('booth_preference', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('NEW', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CONFIRMED', name='applicationstatus'), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendor_applications_category_id'), 'vendor_applications', ['category_id'], unique=False)
    op.create_index(op.f('ix_vendor_applications_event_date'), 'vendor_applications', ['event_date'], unique=False)
    op.create_index(op.f('ix_vendor_applications_id'), 'vendor_applications', ['id'], unique=False)
    op.create_index(op.f('ix_vendor_applications_status'), 'vendor_applications', ['status'], unique=False)
    op.create_index(op.f('ix_vendor_applications_vendor_id'), 'vendor_applications', ['vendor_id'], unique=False)

    op.create_table(
        'violation_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.DateTime(), nullable=True),
        sa.Column('reported_by', sa.Integer(), nullable=True),
        sa.Column('severity', sa.Enum('MINOR', 'MODERATE', 'SEVERE', name='violationseverity'), nullable=True),
        sa.Column('status', sa.Enum('REPORTED', 'REVIEWING', 'RESOLVED', 'APPEALED', name='violationstatus'), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('action_taken', sa.Text(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_violation_notes_event_date'), 'violation_notes', ['event_date'], unique=False)
    op.create_index(op.f('ix_violation_notes_id'), 'violation_notes', ['id'], unique=False)
    op.create_index(op.f('ix_violation_notes_status'), 'violation_notes', ['status'], unique=False)
    op.create_index(op.f('ix_violation_notes_vendor_id'), 'violation_notes', ['vendor_id'], unique=False)

    op.create_table(
        'deposits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('deposit_type', sa.Enum('STANDARD', 'ADDITIONAL', name='deposittype'), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'PAID', 'REFUNDING', 'REFUNDED', 'FORFEITED', 'UNDER_REVIEW', name='depositstatus'), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('transaction_id', sa.String(length=200), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('refund_method', sa.String(length=50), nullable=True),
        sa.Column('refund_transaction_id', sa.String(length=200), nullable=True),
        sa.Column('refunded_at', sa.DateTime(), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['application_id'], ['vendor_applications.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_deposits_application_id'), 'deposits', ['application_id'], unique=False)
    op.create_index(op.f('ix_deposits_id'), 'deposits', ['id'], unique=False)
    op.create_index(op.f('ix_deposits_status'), 'deposits', ['status'], unique=False)
    op.create_index(op.f('ix_deposits_vendor_id'), 'deposits', ['vendor_id'], unique=False)

    op.create_table(
        'booth_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booth_id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('DRAWN', 'CONFIRMED', 'CANCELLED', name='assignmentstatus'), nullable=True),
        sa.Column('lottery_round', sa.Integer(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['application_id'], ['vendor_applications.id'], ),
        sa.ForeignKeyConstraint(['booth_id'], ['booths.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booth_id', 'event_date', name='unique_booth_per_event')
    )
    op.create_index(op.f('ix_booth_assignments_application_id'), 'booth_assignments', ['application_id'], unique=False)
    op.create_index(op.f('ix_booth_assignments_booth_id'), 'booth_assignments', ['booth_id'], unique=False)
    op.create_index(op.f('ix_booth_assignments_event_date'), 'booth_assignments', ['event_date'], unique=False)
    op.create_index(op.f('ix_booth_assignments_id'), 'booth_assignments', ['id'], unique=False)
    op.create_index(op.f('ix_booth_assignments_status'), 'booth_assignments', ['status'], unique=False)
    op.create_index(op.f('ix_booth_assignments_vendor_id'), 'booth_assignments', ['vendor_id'], unique=False)

    op.create_table(
        'checkin_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'CHECKED_IN', 'NO_SHOW', 'LATE', name='checkinstatus'), nullable=True),
        sa.Column('checkin_time', sa.DateTime(), nullable=True),
        sa.Column('checked_in_by', sa.Integer(), nullable=True),
        sa.Column('sales_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('sales_notes', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('deposit_review_triggered', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['booth_assignments.id'], ),
        sa.ForeignKeyConstraint(['checked_in_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_checkin_records_assignment_id'), 'checkin_records', ['assignment_id'], unique=False)
    op.create_index(op.f('ix_checkin_records_event_date'), 'checkin_records', ['event_date'], unique=False)
    op.create_index(op.f('ix_checkin_records_id'), 'checkin_records', ['id'], unique=False)
    op.create_index(op.f('ix_checkin_records_status'), 'checkin_records', ['status'], unique=False)
    op.create_index(op.f('ix_checkin_records_vendor_id'), 'checkin_records', ['vendor_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_checkin_records_vendor_id'), table_name='checkin_records')
    op.drop_index(op.f('ix_checkin_records_status'), table_name='checkin_records')
    op.drop_index(op.f('ix_checkin_records_id'), table_name='checkin_records')
    op.drop_index(op.f('ix_checkin_records_event_date'), table_name='checkin_records')
    op.drop_index(op.f('ix_checkin_records_assignment_id'), table_name='checkin_records')
    op.drop_table('checkin_records')

    op.drop_index(op.f('ix_booth_assignments_vendor_id'), table_name='booth_assignments')
    op.drop_index(op.f('ix_booth_assignments_status'), table_name='booth_assignments')
    op.drop_index(op.f('ix_booth_assignments_id'), table_name='booth_assignments')
    op.drop_index(op.f('ix_booth_assignments_event_date'), table_name='booth_assignments')
    op.drop_index(op.f('ix_booth_assignments_booth_id'), table_name='booth_assignments')
    op.drop_index(op.f('ix_booth_assignments_application_id'), table_name='booth_assignments')
    op.drop_table('booth_assignments')

    op.drop_index(op.f('ix_deposits_vendor_id'), table_name='deposits')
    op.drop_index(op.f('ix_deposits_status'), table_name='deposits')
    op.drop_index(op.f('ix_deposits_id'), table_name='deposits')
    op.drop_index(op.f('ix_deposits_application_id'), table_name='deposits')
    op.drop_table('deposits')

    op.drop_index(op.f('ix_violation_notes_vendor_id'), table_name='violation_notes')
    op.drop_index(op.f('ix_violation_notes_status'), table_name='violation_notes')
    op.drop_index(op.f('ix_violation_notes_id'), table_name='violation_notes')
    op.drop_index(op.f('ix_violation_notes_event_date'), table_name='violation_notes')
    op.drop_table('violation_notes')

    op.drop_index(op.f('ix_vendor_applications_vendor_id'), table_name='vendor_applications')
    op.drop_index(op.f('ix_vendor_applications_status'), table_name='vendor_applications')
    op.drop_index(op.f('ix_vendor_applications_id'), table_name='vendor_applications')
    op.drop_index(op.f('ix_vendor_applications_event_date'), table_name='vendor_applications')
    op.drop_index(op.f('ix_vendor_applications_category_id'), table_name='vendor_applications')
    op.drop_table('vendor_applications')

    op.drop_index(op.f('ix_booths_zone'), table_name='booths')
    op.drop_index(op.f('ix_booths_status'), table_name='booths')
    op.drop_index(op.f('ix_booths_id'), table_name='booths')
    op.drop_index(op.f('ix_booths_booth_number'), table_name='booths')
    op.drop_table('booths')

    op.drop_table('user_roles')
    op.drop_table('role_permissions')

    op.drop_index(op.f('ix_vendors_status'), table_name='vendors')
    op.drop_index(op.f('ix_vendors_name'), table_name='vendors')
    op.drop_index(op.f('ix_vendors_id'), table_name='vendors')
    op.drop_table('vendors')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')

    op.drop_index(op.f('ix_permissions_name'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
    op.drop_table('permissions')

    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_index(op.f('ix_categories_code'), table_name='categories')
    op.drop_table('categories')

    op.execute('DROP TYPE IF EXISTS vendorstatus')
    op.execute('DROP TYPE IF EXISTS applicationstatus')
    op.execute('DROP TYPE IF EXISTS boothstatus')
    op.execute('DROP TYPE IF EXISTS assignmentstatus')
    op.execute('DROP TYPE IF EXISTS depositstatus')
    op.execute('DROP TYPE IF EXISTS deposittype')
    op.execute('DROP TYPE IF EXISTS checkinstatus')
    op.execute('DROP TYPE IF EXISTS violationseverity')
    op.execute('DROP TYPE IF EXISTS violationstatus')
