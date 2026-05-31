from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.dependencies.deps import get_db, get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.gms import GMS
from app.models.assignment import GMSAssignment
from app.models.workday import Workday
from app.models.visit import Visit
from app.models.event import Event
from typing import Dict, Any, Literal
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/public")
def get_public_stats(db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    gms_count = db.query(GMS).count()
    total_reports = db.query(Report).count()
    
    # Estimate data points (hypothetically 10x reports)
    data_points = total_reports * 12
    
    return {
        "teams": f"{user_count}+",
        "stores": f"{gms_count}+",
        "reports": f"{total_reports}+",
        "data_points": f"{round(data_points / 1000, 1)}K" if data_points > 1000 else str(data_points)
    }

@router.get("/admin")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user_count = db.query(User).count()
    gms_count = db.query(GMS).count()
    total_reports = db.query(Report).count()
    pending_reports = db.query(Report).filter(Report.status == "pending").count()
    
    return {
        "users": user_count,
        "stores": gms_count,
        "total_reports": total_reports,
        "pending_reports": pending_reports
    }

@router.get("/supervisor")
def get_supervisor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Supervisor stats: stores assigned to them, reports from their merchandisers
    # For now, let's just get general stats or filter by some logic if available
    # Assuming supervisor sees all stores and reports they supervise
    
    from datetime import timezone
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total assigned stores (total potential visits)
    assigned_stores = db.query(GMSAssignment).join(User).filter(User.supervisor_id == current_user.id).count()
    
    # Active teams (currently clocked in)
    active_agents = db.query(Workday).join(User).filter(
        User.supervisor_id == current_user.id,
        Workday.start_time >= today_start,
        Workday.status == "active"
    ).count()
    
    # Visited stores today
    visited_today = db.query(Visit).join(Workday).join(User).filter(
        User.supervisor_id == current_user.id,
        Visit.status == "completed",
        Visit.end_time >= today_start
    ).count()
    
    pending_reports = db.query(Report).join(User).filter(
        Report.status == "pending", 
        User.supervisor_id == current_user.id
    ).count()
    
    return {
        "assigned_stores": assigned_stores,
        "active_teams": active_agents,
        "visited_today": visited_today,
        "pending_reports": pending_reports
    }

@router.get("/merchandiser")
def get_merchandiser_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    assigned_stores = db.query(GMSAssignment).filter(GMSAssignment.user_id == current_user.id).count()
    if assigned_stores == 0:
        assigned_stores = 1

    # Visits Stats
    visits_today = db.query(Visit).join(Workday).filter(
        Workday.user_id == current_user.id, Visit.status == 'completed', Visit.start_time >= today_start
    ).count()
    
    visits_week = db.query(Visit).join(Workday).filter(
        Workday.user_id == current_user.id, Visit.status == 'completed', Visit.start_time >= week_start
    ).count()

    visits_month = db.query(Visit).join(Workday).filter(
        Workday.user_id == current_user.id, Visit.status == 'completed', Visit.start_time >= month_start
    ).count()

    completed_pct = min(100, int((visits_today / assigned_stores) * 100))

    # Avg duration
    completed_visits_month = db.query(Visit).join(Workday).filter(
        Workday.user_id == current_user.id, Visit.status == 'completed', Visit.start_time >= month_start
    ).all()
    
    total_seconds = 0
    valid_visits = 0
    for v in completed_visits_month:
        if v.start_time and v.end_time:
            dur = (v.end_time - v.start_time).total_seconds()
            if dur > 0:
                total_seconds += dur
                valid_visits += 1
                
    avg_duration_mins = int((total_seconds / valid_visits) / 60) if valid_visits > 0 else 0

    # Reports Stats
    all_reports = db.query(Report).filter(Report.user_id == current_user.id).all()
    total_reports = len(all_reports)
    approved = sum(1 for r in all_reports if r.status == 'approved')
    pending = sum(1 for r in all_reports if r.status == 'pending')
    rejected = sum(1 for r in all_reports if r.status == 'rejected')
    
    before_after = sum(1 for r in all_reports if r.type == 'Before/After')
    anomalies = sum(1 for r in all_reports if r.type == 'anomaly')
    ruptures = sum(1 for r in all_reports if r.type == 'stock-issue')
    product_facing = sum(1 for r in all_reports if r.type == 'facing')

    ai_detections = db.query(Event).join(Visit).join(Workday).filter(
        Workday.user_id == current_user.id, Event.type == 'AI Detection'
    ).count()

    # Productivity
    score = min(100, int(((approved / total_reports) if total_reports > 0 else 1) * 100))
    
    # Working hours
    workdays_month = db.query(Workday).filter(
        Workday.user_id == current_user.id, Workday.start_time >= month_start
    ).all()
    
    work_seconds = 0
    for w in workdays_month:
        end = w.end_time or now
        if w.start_time:
            work_seconds += (end - w.start_time).total_seconds()
            
    working_hours_month = int(work_seconds / 3600)

    # Chart Data (Weekly Activity)
    weekly_activity = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(7):
        day_start = week_start + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_visits = db.query(Visit).join(Workday).filter(
            Workday.user_id == current_user.id, Visit.status == 'completed',
            Visit.start_time >= day_start, Visit.start_time < day_end
        ).count()
        weekly_activity.append({"day": days[i], "visits": day_visits})

    # Report Distribution
    report_distribution = [
        {"type": "Before/After", "count": before_after},
        {"type": "Anomaly", "count": anomalies},
        {"type": "Stock Issue", "count": ruptures},
        {"type": "Facing", "count": product_facing}
    ]

    return {
        "visits": {
            "today": visits_today,
            "this_week": visits_week,
            "this_month": visits_month,
            "completed_pct": completed_pct,
            "avg_duration_mins": avg_duration_mins,
            "delayed": 0,  # Placeholder, needs more logic for missed/delayed
            "missed": 0
        },
        "reports": {
            "total": total_reports,
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
            "before_after": before_after,
            "anomalies": anomalies,
            "ruptures": ruptures,
            "product_facing": product_facing,
            "ai_detections": ai_detections
        },
        "productivity": {
            "score": score,
            "attendance_rate": 100,  # To implement
            "store_coverage_pct": min(100, int((len(set([v.gms_id for v in completed_visits_month])) / assigned_stores) * 100)),
            "working_hours_month": working_hours_month
        },
        "charts": {
            "weekly_activity": weekly_activity,
            "report_distribution": [r for r in report_distribution if r["count"] > 0]
        }
    }

@router.get("/kpi")
def get_kpi_stats(
    time_range: Literal["today", "week", "month"] = "today",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    now = datetime.utcnow()
    if time_range == "today":
        cutoff_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        expected_multiplier = 1
    elif time_range == "week":
        cutoff_date = now - timedelta(days=7)
        expected_multiplier = 7
    elif time_range == "month":
        cutoff_date = now - timedelta(days=30)
        expected_multiplier = 30
    else:
        cutoff_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        expected_multiplier = 1
        
    # 1. Visit Completion Pct
    expected_base = db.query(GMSAssignment).count() 
    expected_visits_count = expected_base * expected_multiplier
    
    completed_visits_query = db.query(Visit).filter(Visit.status == "completed", Visit.start_time >= cutoff_date)
    completed_visits_count = completed_visits_query.count()
    
    visit_completion_pct = round((completed_visits_count / expected_visits_count * 100), 1) if expected_visits_count > 0 else 0.0
    
    # 2. Avg Time Spent (fetching to python for dialect-safe timedeltas)
    avg_str = "0 mins"
    completed_visits = completed_visits_query.all()
    if completed_visits:
        total_seconds = 0
        valid_visits = 0
        for v in completed_visits:
            if v.end_time and v.start_time:
                duration = (v.end_time - v.start_time).total_seconds()
                if duration > 0:
                    total_seconds += duration
                    valid_visits += 1
        
        if valid_visits > 0:
            avg_seconds = total_seconds / valid_visits
            avg_str = f"{int(avg_seconds // 60)} mins"
            
    # 3. Events Occurred
    events_count = db.query(Event).filter(Event.created_at >= cutoff_date).count()
    
    # 4. Performance Ranking
    merchandisers = db.query(User).filter(User.role == "merchandiser").all()
    active_merchandisers = db.query(Workday.user_id).filter(
        Workday.start_time >= cutoff_date.replace(hour=0, minute=0, second=0, microsecond=0),
        Workday.status == "active"
    ).distinct().count()
    
    ranking = []
    
    for m in merchandisers:
        m_visits = db.query(Visit).join(Workday).filter(
            Workday.user_id == m.id, 
            Visit.status == 'completed',
            Visit.start_time >= cutoff_date
        ).count()
        
        m_reports = db.query(Report).filter(
            Report.user_id == m.id, 
            Report.status == "approved",
            Report.created_at >= cutoff_date
        ).count()
        
        score = m_visits + (m_reports * 2) # Weights: completed visits = 1, approved report = 2

        # Calculate productivity
        assigned = db.query(GMSAssignment).filter(GMSAssignment.user_id == m.id).count()
        expected_visits_for_user = (assigned if assigned > 0 else 1) * expected_multiplier
        productivity = min(100, int((m_visits / expected_visits_for_user) * 100))
        
        # Calculate streak: number of unique days worked in the period
        streak = db.query(func.date(Workday.start_time)).filter(
            Workday.user_id == m.id,
            Workday.start_time >= cutoff_date
        ).group_by(func.date(Workday.start_time)).count()
        
        # Trend
        if time_range == "today":
            previous_cutoff = cutoff_date - timedelta(days=1)
        else:
            previous_cutoff = cutoff_date - (now - cutoff_date)

        prev_visits = db.query(Visit).join(Workday).filter(
            Workday.user_id == m.id, 
            Visit.status == 'completed',
            Visit.start_time >= previous_cutoff,
            Visit.start_time < cutoff_date
        ).count()
        trendUp = m_visits >= prev_visits
        
        ranking.append({
            "user_id": m.id,
            "name": f"{m.first_name} {m.last_name}",
            "score": score,
            "visits": m_visits,
            "reports": m_reports,
            "profile_image": m.profile_image,
            "productivity": productivity,
            "streak": streak,
            "trendUp": trendUp
        })
        
    ranking.sort(key=lambda x: x["score"], reverse=True)
    top_performers = ranking[:5]
    
    # 5. Anomalies & Stock Alerts Count
    anomalies_count = db.query(Report).filter(Report.type == "anomaly", Report.created_at >= cutoff_date).count()
    stock_alerts_count = db.query(Report).filter(Report.type == "stock-issue", Report.created_at >= cutoff_date).count()

    # 6. Trends Calculation
    if time_range == "today":
        previous_cutoff = cutoff_date - timedelta(days=1)
        previous_end = now - timedelta(days=1)
    else:
        previous_cutoff = cutoff_date - (now - cutoff_date)
        previous_end = cutoff_date

    prev_completed_visits_count = db.query(Visit).filter(
        Visit.status == "completed", 
        Visit.start_time >= previous_cutoff,
        Visit.start_time < previous_end
    ).count()
    prev_visit_completion_pct = round((prev_completed_visits_count / expected_visits_count * 100), 1) if expected_visits_count > 0 else 0.0
    visit_completion_trend = visit_completion_pct - prev_visit_completion_pct

    prev_anomalies_count = db.query(Report).filter(
        Report.type == "anomaly", 
        Report.created_at >= previous_cutoff,
        Report.created_at < previous_end
    ).count()
    anomalies_trend = anomalies_count - prev_anomalies_count

    prev_stock_alerts_count = db.query(Report).filter(
        Report.type == "stock-issue", 
        Report.created_at >= previous_cutoff,
        Report.created_at < previous_end
    ).count()
    stock_alerts_trend = stock_alerts_count - prev_stock_alerts_count
    
    total_merchandisers = db.query(User).filter(User.role == "merchandiser").count()
    active_merchandisers_trend = active_merchandisers - total_merchandisers

    return {
        "time_range": time_range,
        "visit_completion_pct": visit_completion_pct,
        "avg_time_spent": avg_str,
        "events_count": events_count,
        "active_merchandisers": active_merchandisers,
        "active_supervisors": db.query(User).filter(User.role == "supervisor").count(),
        "stores_visited": completed_visits_count,
        "anomalies_count": anomalies_count,
        "stock_alerts_count": stock_alerts_count,
        "performance_ranking": top_performers,
        "trends": {
            "visit_completion": round(visit_completion_trend, 1),
            "anomalies": anomalies_trend,
            "stock_alerts": stock_alerts_trend,
            "active_merchandisers": active_merchandisers_trend
        }
    }

@router.get("/team-status")
def get_team_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from datetime import timezone
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get all merchandisers supervised by this user in a single pass
    merchandisers = db.query(User).filter(
        User.role == "merchandiser", 
        User.supervisor_id == current_user.id
    ).all()
    
    if not merchandisers:
        return []

    merch_ids = [m.id for m in merchandisers]
    
    # 1. Fetch all active workdays today in one query
    workdays = db.query(Workday).filter(
        Workday.user_id.in_(merch_ids),
        Workday.start_time >= today_start,
        Workday.status == "active"
    ).all()
    workday_map = {wd.user_id: wd for wd in workdays}
    active_workday_ids = [wd.id for wd in workdays]
    
    # 2. Fetch all active visits for these workdays in one query
    active_visits = {}
    if active_workday_ids:
        visits = db.query(Visit).filter(
            Visit.workday_id.in_(active_workday_ids),
            Visit.status == "in_progress"
        ).all()
        active_visits = {v.workday_id: v for v in visits}
        
    # 3. Fetch completed visit counts per user in one query
    completed_counts = db.query(
        Workday.user_id, func.count(Visit.id)
    ).join(Visit).filter(
        Workday.user_id.in_(merch_ids),
        Visit.status == "completed",
        Visit.end_time >= today_start
    ).group_by(Workday.user_id).all()
    completed_map = {user_id: count for user_id, count in completed_counts}
    
    # 4. Fetch assignment counts per user in one query
    assignment_counts = db.query(
        GMSAssignment.user_id, func.count(GMSAssignment.id)
    ).filter(GMSAssignment.user_id.in_(merch_ids)).group_by(GMSAssignment.user_id).all()
    assignment_map = {user_id: count for user_id, count in assignment_counts}

    # 5. Check for active leave today in one query
    from app.models.leave_request import LeaveRequest
    today = now.date()
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.user_id.in_(merch_ids),
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).all()
    leave_map = {l.user_id: l for l in leaves}
    
    results = []
    for m in merchandisers:
        workday = workday_map.get(m.id)
        status = "offline"
        store_name = "Clock in pending"
        duration_str = "---"
        
        if workday:
            active_visit = active_visits.get(workday.id)
            if active_visit:
                status = "visiting"
                store_name = active_visit.gms.name if active_visit.gms else "Unknown Store"
                diff = now - active_visit.start_time
                duration_str = f"{int(diff.total_seconds() // 60)}m"
            else:
                status = "travelling"
                # For store name, we might still want the last visit, but to avoid 1 query per user
                # we'll use a placeholder or we could have fetched these in batch too.
                # Since 'last visit' is only for travelling, let's just say "On Route"
                store_name = "On Route / Between Stores"
                diff = now - workday.start_time
                duration_str = f"{int(diff.total_seconds() // 60)}m"
        else:
            active_leave = leave_map.get(m.id)
            if active_leave:
                status = "on_leave"
                store_name = f"{active_leave.leave_type.capitalize()} Leave"
            else:
                store_name = "Off duty"
        
        completed_visits = completed_map.get(m.id, 0)
        assigned_stores = assignment_map.get(m.id, 0)
        if assigned_stores == 0: assigned_stores = 1
        completion_pct = int((completed_visits / assigned_stores) * 100)
        
        results.append({
            "id": m.id,
            "name": f"{m.first_name} {m.last_name[0]}.",
            "status": status,
            "store": store_name,
            "time": duration_str,
            "completed_visits": completed_visits,
            "assigned_stores": assigned_stores,
            "completion_pct": completion_pct,
            "avatar": m.profile_image
        })
        
    return results
