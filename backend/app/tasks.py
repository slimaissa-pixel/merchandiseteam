import io
import logging
from datetime import datetime
from sqlalchemy.orm import joinedload
from app.db.session import SessionLocal
from app.models.report import Report
from app.core.supabase import get_supabase

# Handle reportlab missing
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

logger = logging.getLogger(__name__)

def generate_report_pdf_task(report_id: int):
    """
    Background worker task to generate PDF and upload to Supabase matching original logic.
    """
    if not HAS_REPORTLAB:
        logger.error("Reportlab not installed. Cannot generate PDF.")
        return

    db = SessionLocal()
    try:
        report = db.query(Report).options(
            joinedload(Report.user),
            joinedload(Report.gms)
        ).filter(Report.id == report_id).first()
        
        if not report:
            logger.error(f"Report {report_id} not found.")
            return
            
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1 # Center
        
        story.append(Paragraph(f"Report: {report.name}", title_style))
        story.append(Paragraph(f"Date: {report.created_at.strftime('%B %d, %Y %H:%M')}", styles['Normal']))
        story.append(Paragraph(f"Merchandiser: {report.user.first_name} {report.user.last_name}" if report.user else "Merchandiser: N/A", styles['Normal']))
        story.append(Paragraph(f"Status: {report.status.capitalize()}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("Details", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        detail_data = [
            ["Field", "Value"],
            ["Type", str(report.type)],
            ["Visits Planned", str(report.visits_planned)],
            ["Visits Completed", str(report.visits_completed)],
            ["Notes", str(report.notes or 'None')],
        ]
        
        detail_table = Table(detail_data, colWidths=[150, 250])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(detail_table)
        
        if report.status == 'rejected' and report.rejection_reason:
            story.append(Spacer(1, 20))
            story.append(Paragraph("Rejection Reason", styles['Heading3']))
            story.append(Paragraph(str(report.rejection_reason), styles['Normal']))

        doc.build(story)
        
        pdf_bytes = buffer.getvalue()
        filename = f"report_{report_id}_{report.created_at.strftime('%Y%m%d%H%M%S')}.pdf"
        
        supabase = get_supabase()
        if supabase:
            try:
                # Upload the file to "reports" bucket
                res = supabase.storage.from_("reports").upload(
                    path=filename,
                    file=pdf_bytes,
                    file_options={"content-type": "application/pdf"}
                )
                logger.info(f"Successfully uploaded PDF {filename} to Supabase")
                # Return the public URL
                public_url = supabase.storage.from_("reports").get_public_url(filename)
                if isinstance(public_url, dict) and "public_url" in public_url:
                    return public_url["public_url"]
                elif hasattr(public_url, "public_url"):
                    return public_url.public_url
                else:
                    return f"{supabase.supabase_url}/storage/v1/object/public/reports/{filename}"
            except Exception as e:
                logger.error(f"Failed to upload report PDF to Supabase: {e}")
                return None
    finally:
        db.close()
