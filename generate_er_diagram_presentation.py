"""
ER Diagram Generator - Presentation Friendly Version
Generates a clean, vertical ER diagram suitable for presentations
"""

import os

# Add Graphviz to PATH on Windows
graphviz_path = r"C:\Program Files\Graphviz\bin"
if os.path.exists(graphviz_path):
    os.environ["PATH"] = graphviz_path + os.pathsep + os.environ.get("PATH", "")

from graphviz import Digraph
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER


def create_er_diagram():
    """Create a presentation-friendly ER diagram"""
    dot = Digraph('ER_Diagram', format='png')

    # Vertical layout, better spacing
    dot.attr(rankdir='TB', splines='spline', nodesep='0.6', ranksep='1.0',
             bgcolor='white', pad='0.5')
    dot.attr('node', fontname='Arial', fontsize='11')
    dot.attr('edge', fontname='Arial', fontsize='9', color='#666666')
    dot.attr(dpi='200')

    # Color scheme for different domains
    colors_core = {'fill': '#E3F2FD', 'border': '#1976D2', 'header': '#1976D2'}
    colors_task = {'fill': '#F3E5F5', 'border': '#7B1FA2', 'header': '#7B1FA2'}
    colors_course = {'fill': '#FFEBEE', 'border': '#C62828', 'header': '#C62828'}
    colors_system = {'fill': '#E8F5E9', 'border': '#388E3C', 'header': '#388E3C'}

    def create_entity(name, attributes, color_scheme):
        """Create an entity with clean presentation style"""
        attrs_html = ''
        for attr in attributes:
            if attr.startswith('*'):  # Primary key
                attrs_html += f'<TR><TD ALIGN="LEFT"><B><U>{attr[1:]}</U></B></TD></TR>'
            elif attr.startswith('+'):  # Foreign key
                attrs_html += f'<TR><TD ALIGN="LEFT"><I>{attr[1:]}</I></TD></TR>'
            else:
                attrs_html += f'<TR><TD ALIGN="LEFT">{attr}</TD></TR>'

        return f'''<
            <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
                <TR><TD BGCOLOR="{color_scheme['header']}" ALIGN="CENTER"><FONT COLOR="white"><B>{name}</B></FONT></TD></TR>
                {attrs_html}
            </TABLE>>'''

    # ============================================
    # CORE ENTITIES (Blue)
    # ============================================
    with dot.subgraph(name='cluster_core') as c:
        c.attr(label='Entitetet Kryesore', style='rounded,filled', color='#BBDEFB',
               fillcolor='#E3F2FD', fontname='Arial Bold', fontsize='14', fontcolor='#1565C0')

        c.node('User', create_entity('User', [
            '*id (UUID)', 'email', 'fullName', 'role', 'avatarUrl', 'isActive'
        ], colors_core))

        c.node('Project', create_entity('Project', [
            '*id (UUID)', 'title', 'description', '+teamLeaderId', '+courseId', 'status', 'deadlineDate'
        ], colors_core))

        c.node('ProjectUser', create_entity('ProjectUser', [
            '*id (UUID)', '+projectId', '+userId', 'role', 'inviteStatus', 'joinedAt'
        ], colors_core))

    # ============================================
    # TASK ENTITIES (Purple)
    # ============================================
    with dot.subgraph(name='cluster_tasks') as c:
        c.attr(label='Menaxhimi i Detyrave', style='rounded,filled', color='#CE93D8',
               fillcolor='#F3E5F5', fontname='Arial Bold', fontsize='14', fontcolor='#6A1B9A')

        c.node('Task', create_entity('Task', [
            '*id (UUID)', '+projectId', 'title', 'status', 'priority', '+assigneeId', 'dueDate'
        ], colors_task))

        c.node('TaskHistory', create_entity('TaskHistory', [
            '*id (UUID)', '+taskId', '+changedById', 'previousStatus', 'newStatus'
        ], colors_task))

        c.node('Comment', create_entity('Comment', [
            '*id (UUID)', '+taskId', '+authorId', 'content', 'createdAt'
        ], colors_task))

        c.node('File', create_entity('File', [
            '*id (UUID)', '+taskId', '+uploadedBy', 'filename', 'sizeBytes'
        ], colors_task))

    # ============================================
    # COURSE ENTITIES (Red)
    # ============================================
    with dot.subgraph(name='cluster_course') as c:
        c.attr(label='Menaxhimi i Kurseve (Profesor)', style='rounded,filled', color='#EF9A9A',
               fillcolor='#FFEBEE', fontname='Arial Bold', fontsize='14', fontcolor='#B71C1C')

        c.node('Course', create_entity('Course', [
            '*id (UUID)', 'title', 'code', 'semester', 'year', '+professorId'
        ], colors_course))

        c.node('CourseEnrollment', create_entity('CourseEnrollment', [
            '*id (UUID)', '+courseId', '+studentId', 'enrolledAt'
        ], colors_course))

        c.node('ProjectGrade', create_entity('ProjectGrade', [
            '*id (UUID)', '+projectId', '+professorId', 'gradeType', 'numericGrade'
        ], colors_course))

        c.node('FinalSubmission', create_entity('FinalSubmission', [
            '*id (UUID)', '+projectId', 'status', '+submittedById', '+reviewedById'
        ], colors_course))

        c.node('Announcement', create_entity('Announcement', [
            '*id (UUID)', '+courseId', '+professorId', 'title', 'content'
        ], colors_course))

    # ============================================
    # SYSTEM ENTITIES (Green)
    # ============================================
    with dot.subgraph(name='cluster_system') as c:
        c.attr(label='Sistemi', style='rounded,filled', color='#A5D6A7',
               fillcolor='#E8F5E9', fontname='Arial Bold', fontsize='14', fontcolor='#1B5E20')

        c.node('Session', create_entity('Session', [
            '*id (UUID)', '+userId', 'expiresAt', 'revoked'
        ], colors_system))

        c.node('Notification', create_entity('Notification', [
            '*id (UUID)', '+userId', 'type', 'title', 'isRead'
        ], colors_system))

        c.node('ActivityLog', create_entity('ActivityLog', [
            '*id (UUID)', '+userId', 'action', 'resourceType'
        ], colors_system))

    # ============================================
    # RELATIONSHIPS
    # ============================================
    # User relationships
    dot.edge('User', 'Session', label='1:N', arrowhead='crow')
    dot.edge('User', 'Project', label='leads\n1:N', arrowhead='crow')
    dot.edge('User', 'ProjectUser', label='member\n1:N', arrowhead='crow')
    dot.edge('User', 'Task', label='assigned\n1:N', arrowhead='crow')
    dot.edge('User', 'Course', label='teaches\n1:N', arrowhead='crow')
    dot.edge('User', 'Notification', label='1:N', arrowhead='crow')
    dot.edge('User', 'ActivityLog', label='1:N', arrowhead='crow')

    # Project relationships
    dot.edge('Project', 'ProjectUser', label='1:N', arrowhead='crow')
    dot.edge('Project', 'Task', label='1:N', arrowhead='crow')
    dot.edge('Project', 'ProjectGrade', label='1:1', arrowhead='none')
    dot.edge('Project', 'FinalSubmission', label='1:1', arrowhead='none')

    # Course relationships
    dot.edge('Course', 'Project', label='1:N', arrowhead='crow')
    dot.edge('Course', 'CourseEnrollment', label='1:N', arrowhead='crow')
    dot.edge('Course', 'Announcement', label='1:N', arrowhead='crow')
    dot.edge('User', 'CourseEnrollment', label='enrolls\n1:N', arrowhead='crow')

    # Task relationships
    dot.edge('Task', 'TaskHistory', label='1:N', arrowhead='crow')
    dot.edge('Task', 'Comment', label='1:N', arrowhead='crow')
    dot.edge('Task', 'File', label='1:N', arrowhead='crow')

    # Render
    output_path = dot.render('er_diagram_vertical', cleanup=True)
    return 'er_diagram_vertical.png'


def create_pdf():
    """Generate PDF with the ER diagram"""

    # First create the diagram
    diagram_path = create_er_diagram()

    # Create PDF in landscape for better viewing
    doc = SimpleDocTemplate(
        "er_diagram_presentation.pdf",
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1.5*cm,
        bottomMargin=1*cm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1565C0')
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666')
    )

    content = []

    # Title
    content.append(Paragraph("Diagrami Entity-Relationship (ER)", title_style))
    content.append(Paragraph("Sistemi i Menaxhimit te Projekteve", subtitle_style))

    # Add diagram image
    if os.path.exists(diagram_path):
        img = Image(diagram_path, width=26*cm, height=15*cm)
        content.append(img)

    content.append(Spacer(1, 15))

    # Legend
    legend_data = [
        ['Legjenda:', '', '', ''],
        ['*atribut', 'Primary Key (PK)', '+atribut', 'Foreign Key (FK)'],
        ['1:N', 'One-to-Many', '1:1', 'One-to-One'],
    ]

    legend_table = Table(legend_data, colWidths=[3*cm, 5*cm, 3*cm, 5*cm])
    legend_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (-1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(legend_table)

    # Page 2: Entity details
    content.append(PageBreak())

    content.append(Paragraph("Pershkrimi i Entiteteve", title_style))
    content.append(Spacer(1, 20))

    # Entity descriptions
    entities_data = [
        ['Entiteti', 'Pershkrimi', 'Atributet Kryesore'],
        ['User', 'Perdoruesit e sistemit (student, profesor, admin)', 'email, fullName, role'],
        ['Project', 'Projektet e krijuara nga perdoruesit', 'title, status, deadlineDate'],
        ['Task', 'Detyrat brenda nje projekti', 'title, status, priority, dueDate'],
        ['Course', 'Kurset e menaxhuara nga profesoret', 'title, code, semester, year'],
        ['Session', 'Sesionet e autentifikimit', 'expiresAt, revoked'],
        ['Notification', 'Njoftimet per perdoruesit', 'type, title, isRead'],
        ['ProjectUser', 'Lidhja User-Project (anetaresia)', 'role, inviteStatus'],
        ['CourseEnrollment', 'Regjistrimi i studenteve ne kurse', 'enrolledAt'],
        ['TaskHistory', 'Historia e ndryshimeve te task', 'previousStatus, newStatus'],
        ['Comment', 'Komentet ne task', 'content, createdAt'],
        ['File', 'Skedaret e ngarkuar', 'filename, sizeBytes'],
        ['ProjectGrade', 'Notat per projekte', 'gradeType, numericGrade'],
        ['FinalSubmission', 'Dorezimet finale', 'status, submittedAt'],
        ['Announcement', 'Njoftimet e kursit', 'title, content, isPinned'],
        ['ActivityLog', 'Log i aktiviteteve', 'action, resourceType'],
    ]

    entities_table = Table(entities_data, colWidths=[3.5*cm, 10*cm, 6*cm])
    entities_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F5F5F5')]),
    ]))
    content.append(entities_table)

    content.append(Spacer(1, 20))

    # Relationships summary
    content.append(Paragraph("Marredheniet Kryesore", ParagraphStyle(
        'Heading', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor('#1976D2')
    )))
    content.append(Spacer(1, 10))

    relations_data = [
        ['Lidhja', 'Tipi', 'Pershkrimi'],
        ['User -> Project', '1:N', 'Nje user mund te udheheqe shume projekte'],
        ['User -> Task', '1:N', 'Nje user mund te kete shume task te caktuara'],
        ['Project -> Task', '1:N', 'Nje projekt permban shume task'],
        ['Project -> ProjectUser', '1:N', 'Nje projekt ka shume anetare'],
        ['Course -> Project', '1:N', 'Nje kurs mund te kete shume projekte'],
        ['Task -> Comment', '1:N', 'Nje task mund te kete shume komente'],
        ['Task -> File', '1:N', 'Nje task mund te kete shume skedare'],
        ['Project -> ProjectGrade', '1:1', 'Nje projekt ka vetem nje note'],
    ]

    relations_table = Table(relations_data, colWidths=[5*cm, 2*cm, 12*cm])
    relations_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#388E3C')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#E8F5E9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A5D6A7')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(relations_table)

    # Build PDF
    doc.build(content)

    # Cleanup
    if os.path.exists(diagram_path):
        os.remove(diagram_path)

    print("PDF generated successfully: er_diagram_presentation.pdf")


if __name__ == '__main__':
    create_pdf()
