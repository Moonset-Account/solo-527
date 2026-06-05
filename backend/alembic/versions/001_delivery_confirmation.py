"""add delivery order_id and confirmation delivery_id/order_amount

Revision ID: 001_delivery_confirmation
Revises:
Create Date: 2026-06-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_delivery_confirmation'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('deliveries', sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('meal_orders.id', ondelete='SET NULL'), nullable=True))

    op.alter_column('subsidy_exceed_confirmations', 'subsidy_record_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    existing_nullable=False,
                    nullable=True)

    op.add_column('subsidy_exceed_confirmations', sa.Column('delivery_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deliveries.id', ondelete='CASCADE'), nullable=True))
    op.add_column('subsidy_exceed_confirmations', sa.Column('order_amount', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('subsidy_exceed_confirmations', 'order_amount')
    op.drop_column('subsidy_exceed_confirmations', 'delivery_id')

    op.alter_column('subsidy_exceed_confirmations', 'subsidy_record_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    existing_nullable=True,
                    nullable=False)

    op.drop_column('deliveries', 'order_id')
