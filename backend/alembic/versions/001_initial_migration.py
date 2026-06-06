"""initial migration

Revision ID: 001
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'manager', 'cleaner', 'maintenance')")
    op.execute("CREATE TYPE propertystatus AS ENUM ('active', 'inactive', 'maintenance')")
    op.execute("CREATE TYPE roomstatustype AS ENUM ('occupied', 'checked_out', 'cleaning', 'cleaning_completed', 'inspecting', 'available', 'maintenance', 'blocked')")
    op.execute("CREATE TYPE cleaningtaskstatus AS ENUM ('pending', 'assigned', 'in_progress', 'submitted', 'inspecting', 'approved', 'rejected', 'cancelled')")
    op.execute("CREATE TYPE cleaningtaskpriority AS ENUM ('low', 'normal', 'high', 'urgent')")
    op.execute("CREATE TYPE maintenanceorderstatus AS ENUM ('pending', 'assigned', 'in_progress', 'submitted', 'inspecting', 'completed', 'rejected', 'cancelled')")
    op.execute("CREATE TYPE maintenancetype AS ENUM ('plumbing', 'electrical', 'appliance', 'furniture', 'painting', 'door_window', 'other')")
    op.execute("CREATE TYPE maintenancepriority AS ENUM ('low', 'normal', 'high', 'urgent')")
    op.execute("CREATE TYPE attachmenttype AS ENUM ('image', 'document', 'video', 'other')")
    op.execute("CREATE TYPE attachmentpurpose AS ENUM ('before_cleaning', 'after_cleaning', 'maintenance_before', 'maintenance_after', 'inspection', 'other')")

    # users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('admin', 'manager', 'cleaner', 'maintenance', name='userrole'), nullable=False, server_default='cleaner'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # properties table
    op.create_table(
        'properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('community', sa.String(length=100), nullable=False),
        sa.Column('building', sa.String(length=50), nullable=True),
        sa.Column('room_number', sa.String(length=50), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('area', sa.Float(), nullable=True, comment='面积(平方米)'),
        sa.Column('bedroom_count', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('bathroom_count', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('status', sa.Enum('active', 'inactive', 'maintenance', name='propertystatus'), nullable=True, server_default='active'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_properties_id'), 'properties', ['id'], unique=False)
    op.create_index(op.f('ix_properties_community'), 'properties', ['community'], unique=False)

    # cleaning_tasks table
    op.create_table(
        'cleaning_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_no', sa.String(length=50), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('cleaner_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'assigned', 'in_progress', 'submitted', 'inspecting', 'approved', 'rejected', 'cancelled', name='cleaningtaskstatus'), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Enum('low', 'normal', 'high', 'urgent', name='cleaningtaskpriority'), nullable=False, server_default='normal'),
        sa.Column('scheduled_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deadline_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('estimated_duration', sa.Float(), nullable=True, server_default='2.0', comment='预计时长(小时)'),
        sa.Column('actual_duration', sa.Float(), nullable=True, comment='实际时长(小时)'),
        sa.Column('cleaning_items', sa.Text(), nullable=True, comment='清洁项目要求，JSON格式'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('inspector_remarks', sa.Text(), nullable=True),
        sa.Column('is_overdue', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cleaner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('task_no')
    )
    op.create_index(op.f('ix_cleaning_tasks_id'), 'cleaning_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_cleaning_tasks_status'), 'cleaning_tasks', ['status'], unique=False)
    op.create_index(op.f('ix_cleaning_tasks_cleaner_id'), 'cleaning_tasks', ['cleaner_id'], unique=False)
    op.create_index(op.f('ix_cleaning_tasks_task_no'), 'cleaning_tasks', ['task_no'], unique=True)

    # room_statuses table
    op.create_table(
        'room_statuses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('occupied', 'checked_out', 'cleaning', 'cleaning_completed', 'inspecting', 'available', 'maintenance', 'blocked', name='roomstatustype'), nullable=False, server_default='available'),
        sa.Column('guest_name', sa.String(length=100), nullable=True),
        sa.Column('check_in_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('check_out_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_cleaning_task_id', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['current_cleaning_task_id'], ['cleaning_tasks.id'], ),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('property_id', 'date', name='uq_property_date')
    )
    op.create_index(op.f('ix_room_statuses_id'), 'room_statuses', ['id'], unique=False)
    op.create_index(op.f('ix_room_statuses_date'), 'room_statuses', ['date'], unique=False)

    # maintenance_orders table
    op.create_table(
        'maintenance_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_no', sa.String(length=50), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('technician_id', sa.Integer(), nullable=True),
        sa.Column('maintenance_type', sa.Enum('plumbing', 'electrical', 'appliance', 'furniture', 'painting', 'door_window', 'other', name='maintenancetype'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'assigned', 'in_progress', 'submitted', 'inspecting', 'completed', 'rejected', 'cancelled', name='maintenanceorderstatus'), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Enum('low', 'normal', 'high', 'urgent', name='maintenancepriority'), nullable=False, server_default='normal'),
        sa.Column('scheduled_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deadline_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('solution', sa.Text(), nullable=True),
        sa.Column('inspector_remarks', sa.Text(), nullable=True),
        sa.Column('is_overdue', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('estimated_cost', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('actual_cost', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['technician_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_no')
    )
    op.create_index(op.f('ix_maintenance_orders_id'), 'maintenance_orders', ['id'], unique=False)
    op.create_index(op.f('ix_maintenance_orders_status'), 'maintenance_orders', ['status'], unique=False)
    op.create_index(op.f('ix_maintenance_orders_order_no'), 'maintenance_orders', ['order_no'], unique=True)

    # materials table
    op.create_table(
        'materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('sku', sa.String(length=50), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('stock_quantity', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku')
    )
    op.create_index(op.f('ix_materials_id'), 'materials', ['id'], unique=False)
    op.create_index(op.f('ix_materials_sku'), 'materials', ['sku'], unique=True)
    op.create_index(op.f('ix_materials_category'), 'materials', ['category'], unique=False)

    # material_usages table
    op.create_table(
        'material_usages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('cleaning_task_id', sa.Integer(), nullable=True),
        sa.Column('maintenance_order_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_cost', sa.Float(), nullable=False),
        sa.Column('remarks', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cleaning_task_id'], ['cleaning_tasks.id'], ),
        sa.ForeignKeyConstraint(['maintenance_order_id'], ['maintenance_orders.id'], ),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_usages_id'), 'material_usages', ['id'], unique=False)

    # attachments table
    op.create_table(
        'attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cleaning_task_id', sa.Integer(), nullable=True),
        sa.Column('maintenance_order_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('object_name', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('attachment_type', sa.Enum('image', 'document', 'video', 'other', name='attachmenttype'), nullable=True, server_default='image'),
        sa.Column('purpose', sa.Enum('before_cleaning', 'after_cleaning', 'maintenance_before', 'maintenance_after', 'inspection', 'other', name='attachmentpurpose'), nullable=True, server_default='other'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cleaning_task_id'], ['cleaning_tasks.id'], ),
        sa.ForeignKeyConstraint(['maintenance_order_id'], ['maintenance_orders.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attachments_id'), 'attachments', ['id'], unique=False)

    # notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.String(length=1000), nullable=True),
        sa.Column('notification_type', sa.String(length=50), nullable=True),
        sa.Column('related_id', sa.Integer(), nullable=True),
        sa.Column('is_read', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_notification_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_attachments_id'), table_name='attachments')
    op.drop_table('attachments')
    op.drop_index(op.f('ix_material_usages_id'), table_name='material_usages')
    op.drop_table('material_usages')
    op.drop_index(op.f('ix_materials_category'), table_name='materials')
    op.drop_index(op.f('ix_materials_sku'), table_name='materials')
    op.drop_index(op.f('ix_materials_id'), table_name='materials')
    op.drop_table('materials')
    op.drop_index(op.f('ix_maintenance_orders_order_no'), table_name='maintenance_orders')
    op.drop_index(op.f('ix_maintenance_orders_status'), table_name='maintenance_orders')
    op.drop_index(op.f('ix_maintenance_orders_id'), table_name='maintenance_orders')
    op.drop_table('maintenance_orders')
    op.drop_index(op.f('ix_room_statuses_date'), table_name='room_statuses')
    op.drop_index(op.f('ix_room_statuses_id'), table_name='room_statuses')
    op.drop_table('room_statuses')
    op.drop_index(op.f('ix_cleaning_tasks_task_no'), table_name='cleaning_tasks')
    op.drop_index(op.f('ix_cleaning_tasks_cleaner_id'), table_name='cleaning_tasks')
    op.drop_index(op.f('ix_cleaning_tasks_status'), table_name='cleaning_tasks')
    op.drop_index(op.f('ix_cleaning_tasks_id'), table_name='cleaning_tasks')
    op.drop_table('cleaning_tasks')
    op.drop_index(op.f('ix_properties_community'), table_name='properties')
    op.drop_index(op.f('ix_properties_id'), table_name='properties')
    op.drop_table('properties')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS attachmentpurpose')
    op.execute('DROP TYPE IF EXISTS attachmenttype')
    op.execute('DROP TYPE IF EXISTS maintenancepriority')
    op.execute('DROP TYPE IF EXISTS maintenancetype')
    op.execute('DROP TYPE IF EXISTS maintenanceorderstatus')
    op.execute('DROP TYPE IF EXISTS cleaningtaskpriority')
    op.execute('DROP TYPE IF EXISTS cleaningtaskstatus')
    op.execute('DROP TYPE IF EXISTS roomstatustype')
    op.execute('DROP TYPE IF EXISTS propertystatus')
    op.execute('DROP TYPE IF EXISTS userrole')
