import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_daily_report_pdf(supervisor_name: str, date: str, visits: list) -> str:
    """
    Generates a daily activity PDF report for a supervisor's team.
    Returns the file path of the generated PDF.
    """
    os.makedirs("uploads/reports", exist_ok=True)
    filepath = f"uploads/reports/daily_report_{supervisor_name.replace(' ', '_')}_{date}.pdf"
    
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=14
    )
    story.append(Paragraph(f"Daily Merchandising Report - {date}", title_style))
    story.append(Paragraph(f"Supervisor: {supervisor_name}", styles["Normal"]))
    story.append(Spacer(1, 20))

    # Summary Text
    story.append(Paragraph(f"Total Visits Today: {len(visits)}", styles["Heading3"]))
    story.append(Spacer(1, 10))

    # Table Data
    data = [["Merchandiser", "Store", "Start Time", "End Time", "Status"]]
    for v in visits:
        merch_name = v.get("merchandiser", "N/A")
        store = v.get("store", "N/A")
        start = v.get("start", "N/A")
        end = v.get("end", "N/A")
        status = v.get("status", "N/A")
        data.append([merch_name, store, start, end, status])

    table = Table(data, colWidths=[120, 120, 100, 100, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)
    doc.build(story)
    
    return filepath
