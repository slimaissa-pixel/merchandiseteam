"""Add expo_push_token

Revision ID: 58eb96a269cf
Revises: 
Create Date: 2026-05-02 00:42:01.354478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '58eb96a269cf'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop deprecated tables from previous tracking implementation
    op.drop_index('ix_session_reports_id', table_name='session_reports', if_exists=True)
    op.drop_table('session_reports')
    
    op.drop_index('ix_checkpoints_id', table_name='checkpoints', if_exists=True)
    op.drop_table('checkpoints')
    
    op.drop_index('ix_work_sessions_id', table_name='work_sessions', if_exists=True)
    op.drop_table('work_sessions')
    
    # Drop removed columns
    op.drop_column('users', 'address')
    op.drop_column('users', 'tags')

    # Add new column
    op.add_column('users', sa.Column('expo_push_token', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'expo_push_token')
    op.add_column('users', sa.Column('tags', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('address', sa.VARCHAR(), autoincrement=False, nullable=True))
    # Note: downgrading table drops is intentionally omitted here for brevity

