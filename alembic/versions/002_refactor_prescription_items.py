"""002 - 重构 prescription_items 表为仅保留 medicine_id + quantity

Revision ID: 002
Revises: 001
Create Date: 2026-06-07

"""
from alembic import op
import sqlalchemy as sa


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('prescription_items')]
    
    if 'medicine_name' in columns:
        op.drop_constraint('prescription_items_service_record_id_fkey', 'prescription_items', type_='foreignkey')
        op.drop_table('prescription_items')
        
        op.create_table(
            'prescription_items',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('service_record_id', sa.Integer(), sa.ForeignKey('service_records.id'), nullable=False),
            sa.Column('medicine_id', sa.Integer(), sa.ForeignKey('medicines.id'), nullable=False),
            sa.Column('quantity', sa.Integer(), nullable=False)
        )


def downgrade() -> None:
    op.drop_table('prescription_items')
    op.create_table(
        'prescription_items',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('service_record_id', sa.Integer(), sa.ForeignKey('service_records.id'), nullable=False),
        sa.Column('medicine_name', sa.String(200), nullable=False),
        sa.Column('specification', sa.String(200), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('dosage', sa.String(200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True)
    )
