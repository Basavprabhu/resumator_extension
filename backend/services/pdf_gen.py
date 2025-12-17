
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem

def create_pdf_buffer(resume_data: dict) -> io.BytesIO:
    """
    Generates a professional 2-column PDF resume using ReportLab Platypus.
    """
    buffer = io.BytesIO()
    
    # margins: top, bottom, left, right
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )

    styles = getSampleStyleSheet()
    story = []

    # --- Custom Styles ---
    # Header Name
    styles.add(ParagraphStyle(
        name='NameQuery',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        alignment=1, # Center
        spaceAfter=4,
        textColor=colors.black,
        fontName='Helvetica'
    ))

    # Header Role (if we want to extract it, or just use generic)
    styles.add(ParagraphStyle(
        name='HeaderRole',
        parent=styles['Normal'],
        fontSize=12,
        leading=14,
        alignment=1, # Center
        spaceAfter=20,
        textColor=colors.gray,
        fontName='Helvetica',
        textTransform='uppercase' # ReportLab doesn't support CSS text-transform directly, handle in string
    ))

    # Section Headers
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading3'],
        fontSize=10,
        leading=12,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.black,
        fontName='Helvetica-Bold',
        textTransform='uppercase',
        borderPadding=2,
        borderWidth=0,
        # We can simulate the line with Table styles or a drawing, 
        # but for simplicity in Platypus, we often use a Table for the header or just text.
        # The reference has lines above/below. We'll simulate with character spacing or a Table.
    ))

    # Left Column Text (Right Aligned in reference? Actually reference is Left Aligned)
    # The reference image has:
    # Left Col: Contact (Right aligned?), Education, Skills, Interests
    # Right Col: Summary, Experience
    # Actually, looking at the image:
    # "CONTACT" is centered in the column? Or right aligned?
    # Let's assume standard Left alignment for text, maybe headers centered.

    styles.add(ParagraphStyle(
        name='LeftColHeader',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        alignment=1, # Center
        fontName='Helvetica-Bold',
        textColor=colors.black,
        spaceBefore=12,
        spaceAfter=4,
        textTransform='uppercase'
    ))

    styles.add(ParagraphStyle(
        name='LeftColText',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        alignment=1, # Center for contact, or left? Reference looks centered or right aligned.
        # Let's go with Center for Left Column to match the "Design" feel
        textColor=colors.black,
        fontName='Helvetica'
    ))

    # Right Column Styles
    styles.add(ParagraphStyle(
        name='RightColHeader',
        parent=styles['Heading3'],
        fontSize=11,
        leading=14,
        spaceBefore=10,
        spaceAfter=6,
        fontName='Helvetica-Bold',
        textColor=colors.black,
        textTransform='uppercase'
        # We will add a line using Table style
    ))

    styles.add(ParagraphStyle(
        name='JobTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        fontName='Helvetica-Bold',
        spaceAfter=1,
        textTransform='uppercase'
    ))

    styles.add(ParagraphStyle(
        name='CompanyInfo',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        fontName='Helvetica',
        textColor=colors.black,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name='ResumeBodyText',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        fontName='Helvetica',
        alignment=4 # Justify
    ))

    # --- Content Construction ---

    # 1. Main Header (Name & Role)
    full_name = resume_data.get("full_name", "YOUR NAME")
    # We might want a "Target Role" if available, or just blank
    # For now, just Name
    story.append(Paragraph(full_name.upper(), styles['NameQuery']))
    
    # Access role from logic if we had it, otherwise maybe "PROFESSIONAL"
    # story.append(Paragraph("SALES EXECUTIVE", styles['HeaderRole'])) 
    story.append(Spacer(1, 20))


    # 2. Columns Setup
    # Left Column Content
    left_content = []
    
    # CONTACT
    left_content.append(Paragraph("CONTACT", styles['LeftColHeader']))
    # Split contact info by | or newlines
    contact_raw = resume_data.get("contact_info", "")
    contacts = [c.strip() for c in contact_raw.split('|')]
    for c in contacts:
        left_content.append(Paragraph(c, styles['LeftColText']))
    left_content.append(Spacer(1, 15))

    # EDUCATION
    # Assuming education is a string, we parse lines
    education_raw = resume_data.get("education", "")
    if education_raw:
        left_content.append(Paragraph("EDUCATION", styles['LeftColHeader']))
        # Split by newline
        for line in education_raw.split('\n'):
             left_content.append(Paragraph(line, styles['LeftColText']))
        left_content.append(Spacer(1, 15))
    
    # SKILLS
    skills_raw = resume_data.get("skills", [])
    if skills_raw:
        left_content.append(Paragraph("SKILLS", styles['LeftColHeader']))
        # If string, split it
        if isinstance(skills_raw, str):
            skills_raw = [s.strip() for s in skills_raw.split(',')]
        
        for skill in skills_raw:
             left_content.append(Paragraph(skill, styles['LeftColText']))
        left_content.append(Spacer(1, 15))


    # Right Column Content
    right_content = []

    # SUMMARY
    summary = resume_data.get("summary", "")
    if summary:
        right_content.append(Paragraph("EXECUTIVE SUMMARY", styles['RightColHeader']))
        # Add a horizontal line separator?
        # In Platypus, we can use a Drawing or just rely on the Header Style. 
        # Let's keep it simple for now. 
        right_content.append(Paragraph(summary, styles['ResumeBodyText']))
        right_content.append(Spacer(1, 15))

    # EXPERIENCE
    experience = resume_data.get("experience", [])
    if experience:
        right_content.append(Paragraph("PROFESSIONAL EXPERIENCE", styles['RightColHeader']))
        
        for role in experience:
            # Title
            role_title = role.get('role', 'Role')
            right_content.append(Paragraph(role_title, styles['JobTitle']))
            
            # Company | Date
            company = role.get('company', 'Company')
            duration = role.get('duration', 'Date')
            right_content.append(Paragraph(f"{company} | {duration}", styles['CompanyInfo']))
            
            # Bullets
            points = role.get("points", [])
            # If points is a string, split it?
            if isinstance(points, str):
                points = [p.strip() for p in points.split('\n') if p.strip()]
                
            # Create list items
            list_items = []
            for point in points:
                # remove existing bullet if present
                clean_point = point.lstrip('•').lstrip('-').strip()
                list_items.append(ListItem(
                    Paragraph(clean_point, styles['ResumeBodyText']),
                    bulletColor=colors.black,
                    value='-'
                ))
            
            if list_items:
                right_content.append(ListFlowable(
                    list_items,
                    bulletType='bullet',
                    start='square',
                    leftIndent=10
                ))
            
            right_content.append(Spacer(1, 12))


    # Create the Table for Columns
    # Widths: Left (30%), Right(70%) - Gutter in between
    # Letter width ~ 8.5 inch. Margins 0.5 each -> 7.5 workings
    # 30% of 7.5 = 2.25, 70% = 5.25. Let's do 2.2 inch and 5.1 inch with 0.2 gap
    
    # We need to wrap content in a list to be a "Cell" content
    
    # Note: If content is too long, Table might split? 
    # ReportLab Tables can split over pages if 'splitByRow' is 1 (default).
    # But a single massive cell won't split well internally if it's just a list of flowables unless we are careful.
    # Standard practice: The Table itself is the structure. 
    
    table_data = [[left_content, right_content]]
    
    main_table = Table(
        table_data,
        colWidths=[2.3*inch, 5.2*inch],
        style=[
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (0,0), 0),
            ('RIGHTPADDING', (0,0), (0,0), 10),
            ('LEFTPADDING', (1,0), (1,0), 10),
            ('RIGHTPADDING', (1,0), (1,0), 0),
            # Optional: Line between columns?
            # ('LINEAFTER', (0,0), (0,-1), 0.5, colors.lightgrey),
        ]
    )

    story.append(main_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
