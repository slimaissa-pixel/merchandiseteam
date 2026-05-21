from sqlalchemy import Index
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.location_log import LocationLog
from app.models.report import Report

Index('idx_workday_user_status', Workday.user_id, Workday.status)
Index('idx_visit_workday_status', Visit.workday_id, Visit.status)
Index('idx_location_log_workday', LocationLog.workday_id)
Index('idx_report_user_status', Report.user_id, Report.status)
