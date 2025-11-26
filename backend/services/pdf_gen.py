from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
import io

def create_pdf_buffer(resume_data: dict) -> io.BytesIO:
    """
    Generates a PDF resume from the JSON data.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, resume_data.get("full_name", "Resume"))
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, resume_data.get("contact_info", ""))
    
    y = height - 100
    
    # Summary
    if "summary" in resume_data:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Professional Summary")
        y -= 20
        c.setFont("Helvetica", 10)
        text = resume_data["summary"]
        # Simple text wrapping
        lines = simpleSplit(text, "Helvetica", 10, width - 100)
        for line in lines:
            c.drawString(50, y, line)
            y -= 15
        y -= 10

    # Skills
    if "skills" in resume_data:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Skills")
        y -= 20
        c.setFont("Helvetica", 10)
        skills_text = ", ".join(resume_data["skills"])
        lines = simpleSplit(skills_text, "Helvetica", 10, width - 100)
        for line in lines:
            c.drawString(50, y, line)
            y -= 15
        y -= 10

    # Experience
    if "experience" in resume_data:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Experience")
        y -= 20
        
        for exp in resume_data["experience"]:
            if y < 100: # New page if running out of space
                c.showPage()
                y = height - 50
            
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, f"{exp.get('role', '')} at {exp.get('company', '')}")
            c.drawRightString(width - 50, y, exp.get('duration', ''))
            y -= 15
            
            c.setFont("Helvetica", 10)
            for point in exp.get("points", []):
                c.drawString(60, y, f"• {point}")
                y -= 15
            y -= 10

    c.save()
    buffer.seek(0)
    return buffer
