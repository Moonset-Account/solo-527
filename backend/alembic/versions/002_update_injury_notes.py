"""update injury_notes fields

Revision ID: 002
Revises: 001
Create Date: 2024-06-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('injury_notes') as batch_op:
        batch_op.add_column(sa.Column('injury_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('injury_date', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('treatment_notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('expected_recovery_date', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('1')))
        batch_op.drop_column('title')
        batch_op.drop_column('description')
        batch_op.drop_column('body_part')
        batch_op.drop_column('rest_days')


def downgrade() -> None:
    with op.batch_alter_table('injury_notes') as batch_op:
        batch_op.add_column(sa.Column('rest_days', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('body_part', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('title', sa.String(length=200), nullable=False, server_default=''))
        batch_op.drop_column('is_active')
        batch_op.drop_column('expected_recovery_date')
        batch_op.drop_column('treatment_notes')
        batch_op.drop_column('notes')
        batch_op.drop_column('injury_date')
        batch_op.drop_column('injury_type')
