"""
Architecture & Git Workflow Diagrams - Presentation Friendly
Creates clean, colorful diagrams for presentations
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
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY


def create_architecture_diagram():
    """Create a clean, presentation-friendly architecture diagram"""
    dot = Digraph('Architecture', format='png')

    # Clean settings
    dot.attr(rankdir='TB', splines='ortho', nodesep='0.8', ranksep='1.0',
             bgcolor='white', pad='0.5', compound='true')
    dot.attr('node', fontname='Arial', fontsize='12', style='filled,rounded',
             penwidth='2')
    dot.attr('edge', fontname='Arial', fontsize='10', penwidth='2')
    dot.attr(dpi='200')

    # ============================================
    # LAYER 1: PRESENTATION (Blue)
    # ============================================
    with dot.subgraph(name='cluster_presentation') as c:
        c.attr(label='SHTRESA E PREZANTIMIT\n(Presentation Layer)',
               style='filled,rounded,bold', color='#1565C0', fillcolor='#E3F2FD',
               fontname='Arial Bold', fontsize='14', fontcolor='#0D47A1',
               penwidth='3')

        c.node('pages', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>Faqet (Pages)</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Dashboard</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Projects / Tasks</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Courses / Settings</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#BBDEFB', color='#1976D2')

        c.node('components', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>Komponentet UI</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Button, Card, Modal</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Sidebar, Forms</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#BBDEFB', color='#1976D2')

        c.node('state', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>State Management</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">React Context API</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">NotificationContext</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#BBDEFB', color='#1976D2')

    # ============================================
    # LAYER 2: API (Green)
    # ============================================
    with dot.subgraph(name='cluster_api') as c:
        c.attr(label='SHTRESA API\n(API Layer)',
               style='filled,rounded,bold', color='#2E7D32', fillcolor='#E8F5E9',
               fontname='Arial Bold', fontsize='14', fontcolor='#1B5E20',
               penwidth='3')

        c.node('routes', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>Route Handlers</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">/api/auth/*</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">/api/projects/*</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">/api/tasks/*</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#C8E6C9', color='#388E3C')

        c.node('auth', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>Autentifikimi</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">JWT Token</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">HttpOnly Cookies</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#C8E6C9', color='#388E3C')

    # ============================================
    # LAYER 3: BUSINESS LOGIC (Orange)
    # ============================================
    with dot.subgraph(name='cluster_business') as c:
        c.attr(label='SHTRESA E LOGJIKES SE BIZNESIT\n(Business Logic Layer)',
               style='filled,rounded,bold', color='#E65100', fillcolor='#FFF3E0',
               fontname='Arial Bold', fontsize='14', fontcolor='#BF360C',
               penwidth='3')

        c.node('services', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>Services</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">AuthService</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">ProjectService</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">TaskService</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">NotificationService</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#FFE0B2', color='#F57C00')

    # ============================================
    # LAYER 4: DATA ACCESS (Purple)
    # ============================================
    with dot.subgraph(name='cluster_data') as c:
        c.attr(label='SHTRESA E AKSESIT TE TE DHENAVE\n(Data Access Layer)',
               style='filled,rounded,bold', color='#6A1B9A', fillcolor='#F3E5F5',
               fontname='Arial Bold', fontsize='14', fontcolor='#4A148C',
               penwidth='3')

        c.node('prisma', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>Prisma ORM</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Database Client</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Query Builder</FONT></TD></TR>
        </TABLE>>''', shape='box', fillcolor='#E1BEE7', color='#8E24AA')

        c.node('db', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
            <TR><TD><B>PostgreSQL</B></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Database</FONT></TD></TR>
        </TABLE>>''', shape='cylinder', fillcolor='#CE93D8', color='#7B1FA2')

    # ============================================
    # CONNECTIONS
    # ============================================
    dot.edge('pages', 'routes', label='  HTTP Request  ', color='#1976D2',
             fontcolor='#1976D2', style='bold')
    dot.edge('components', 'pages', style='dashed', color='#64B5F6', arrowhead='none')
    dot.edge('state', 'components', style='dashed', color='#64B5F6', arrowhead='none')

    dot.edge('routes', 'auth', label='  Verify  ', color='#388E3C',
             fontcolor='#388E3C', style='bold')
    dot.edge('routes', 'services', label='  Call Service  ', color='#388E3C',
             fontcolor='#388E3C', style='bold')

    dot.edge('services', 'prisma', label='  Query  ', color='#F57C00',
             fontcolor='#E65100', style='bold')

    dot.edge('prisma', 'db', label='  SQL  ', color='#8E24AA',
             fontcolor='#6A1B9A', style='bold')

    # Response arrow
    dot.edge('db', 'pages', label='  Response  ', color='#9E9E9E',
             fontcolor='#616161', style='dashed', constraint='false')

    output = dot.render('architecture_clean', cleanup=True)
    return 'architecture_clean.png'


def create_git_workflow_diagram():
    """Create a clean Git workflow diagram"""
    dot = Digraph('Git', format='png')

    # Settings for horizontal flow
    dot.attr(rankdir='LR', splines='spline', nodesep='1.2', ranksep='1.5',
             bgcolor='white', pad='0.5')
    dot.attr('node', fontname='Arial', fontsize='13', style='filled,rounded',
             penwidth='3', height='1.2', width='2')
    dot.attr('edge', fontname='Arial Bold', fontsize='12', penwidth='3')
    dot.attr(dpi='200')

    # Git workflow nodes with icons/symbols
    dot.node('working', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
        <TR><TD><FONT POINT-SIZE="24">📁</FONT></TD></TR>
        <TR><TD><B>Working Directory</B></TD></TR>
        <TR><TD><FONT POINT-SIZE="10" COLOR="#666666">Dosja e Punes</FONT></TD></TR>
        <TR><TD><FONT POINT-SIZE="9" COLOR="#888888">Skedaret lokale</FONT></TD></TR>
    </TABLE>>''', shape='box', fillcolor='#FFCDD2', color='#C62828')

    dot.node('staging', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
        <TR><TD><FONT POINT-SIZE="24">📋</FONT></TD></TR>
        <TR><TD><B>Staging Area</B></TD></TR>
        <TR><TD><FONT POINT-SIZE="10" COLOR="#666666">Zona e Pergatitjes</FONT></TD></TR>
        <TR><TD><FONT POINT-SIZE="9" COLOR="#888888">Gati per commit</FONT></TD></TR>
    </TABLE>>''', shape='box', fillcolor='#FFF9C4', color='#F9A825')

    dot.node('local', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
        <TR><TD><FONT POINT-SIZE="24">💾</FONT></TD></TR>
        <TR><TD><B>Local Repository</B></TD></TR>
        <TR><TD><FONT POINT-SIZE="10" COLOR="#666666">Repo Lokal</FONT></TD></TR>
        <TR><TD><FONT POINT-SIZE="9" COLOR="#888888">Historia e commits</FONT></TD></TR>
    </TABLE>>''', shape='box', fillcolor='#C8E6C9', color='#2E7D32')

    dot.node('remote', '''<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="4">
        <TR><TD><FONT POINT-SIZE="24">☁️</FONT></TD></TR>
        <TR><TD><B>Remote Repository</B></TD></TR>
        <TR><TD><FONT POINT-SIZE="10" COLOR="#666666">GitHub / GitLab</FONT></TD></TR>
        <TR><TD><FONT POINT-SIZE="9" COLOR="#888888">Cloud storage</FONT></TD></TR>
    </TABLE>>''', shape='box', fillcolor='#BBDEFB', color='#1565C0')

    # Forward arrows (main flow)
    dot.edge('working', 'staging', label='  git add  ', color='#E65100',
             fontcolor='#E65100', style='bold')
    dot.edge('staging', 'local', label='  git commit  ', color='#2E7D32',
             fontcolor='#2E7D32', style='bold')
    dot.edge('local', 'remote', label='  git push  ', color='#1565C0',
             fontcolor='#1565C0', style='bold')

    # Backward arrows
    dot.edge('remote', 'local', label='  git fetch  ', color='#7B1FA2',
             fontcolor='#7B1FA2', style='dashed')
    dot.edge('remote', 'working', label='  git pull  ', color='#C62828',
             fontcolor='#C62828', style='dashed', constraint='false')

    output = dot.render('git_workflow_clean', cleanup=True)
    return 'git_workflow_clean.png'


def create_pdf():
    """Generate PDF with both diagrams"""

    # Create diagrams
    arch_diagram = create_architecture_diagram()
    git_diagram = create_git_workflow_diagram()

    # Create PDF in landscape
    doc = SimpleDocTemplate(
        "diagrams_presentation.pdf",
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
        spaceAfter=5,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1565C0')
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=15,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666')
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    )

    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#1976D2')
    )

    content = []

    # ============================================
    # PAGE 1: ARCHITECTURE DIAGRAM
    # ============================================
    content.append(Paragraph("Diagrami i Arkitektures", title_style))
    content.append(Paragraph("Arkitektura e Shtresuar (Layered Architecture)", subtitle_style))

    # Add diagram
    if os.path.exists(arch_diagram):
        img = Image(arch_diagram, width=24*cm, height=13*cm)
        content.append(img)

    content.append(Spacer(1, 10))

    # Layer descriptions table
    layers_data = [
        ['Shtresa', 'Teknologjia', 'Pergjegjesia'],
        ['Prezantimi', 'React + Next.js + Tailwind', 'UI, Faqet, Komponentet, State'],
        ['API', 'Next.js Route Handlers', 'HTTP Requests, Auth, Validim'],
        ['Logjika e Biznesit', 'TypeScript Services', 'Rregullat, Operacionet, Notifications'],
        ['Aksesi i te Dhenave', 'Prisma ORM + PostgreSQL', 'Database, Queries, CRUD'],
    ]

    layers_table = Table(layers_data, colWidths=[4*cm, 6*cm, 10*cm])
    layers_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#E3F2FD')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#E8F5E9')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FFF3E0')),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F3E5F5')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDBDBD')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(layers_table)

    # ============================================
    # PAGE 2: GIT WORKFLOW DIAGRAM
    # ============================================
    content.append(PageBreak())

    content.append(Paragraph("Diagrami i Git Workflow", title_style))
    content.append(Paragraph("Rrjedha e punes me Git", subtitle_style))

    # Add diagram
    if os.path.exists(git_diagram):
        img = Image(git_diagram, width=26*cm, height=10*cm)
        content.append(img)

    content.append(Spacer(1, 15))

    # Git commands table
    content.append(Paragraph("Komandat Kryesore te Git", heading_style))

    commands_data = [
        ['Komanda', 'Pershkrimi', 'Shembull'],
        ['git add', 'Shton ndryshimet ne Staging Area', 'git add .  ose  git add file.ts'],
        ['git commit', 'Ruan ndryshimet ne Local Repo', 'git commit -m "Shtova feature X"'],
        ['git push', 'Dergon commits ne Remote (GitHub)', 'git push origin main'],
        ['git pull', 'Merr ndryshimet nga Remote', 'git pull origin main'],
        ['git fetch', 'Shkarkon ndryshimet (pa merge)', 'git fetch origin'],
        ['git status', 'Shfaq gjendjen aktuale', 'git status'],
        ['git log', 'Shfaq historine e commits', 'git log --oneline'],
    ]

    commands_table = Table(commands_data, colWidths=[3*cm, 8*cm, 8*cm])
    commands_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Courier'),
        ('FONTNAME', (2, 1), (2, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
        ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor('#C62828')),
        ('TEXTCOLOR', (2, 1), (2, -1), colors.HexColor('#1565C0')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F5F5F5')]),
    ]))
    content.append(commands_table)

    content.append(Spacer(1, 15))

    # Git workflow explanation
    content.append(Paragraph("Rrjedha Tipike e Punes", heading_style))

    workflow_data = [
        ['Hapi', 'Veprimi', 'Komanda'],
        ['1', 'Krijo ose modifiko skedare', '(editor)'],
        ['2', 'Shiko ndryshimet', 'git status'],
        ['3', 'Shto ne staging', 'git add .'],
        ['4', 'Krijo commit', 'git commit -m "mesazhi"'],
        ['5', 'Dergo ne GitHub', 'git push'],
    ]

    workflow_table = Table(workflow_data, colWidths=[2*cm, 8*cm, 6*cm])
    workflow_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (2, 1), (2, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#E8F5E9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A5D6A7')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(workflow_table)

    # Build PDF
    doc.build(content)

    # Cleanup
    for f in [arch_diagram, git_diagram]:
        if os.path.exists(f):
            os.remove(f)

    print("PDF generated successfully: diagrams_presentation.pdf")


if __name__ == '__main__':
    create_pdf()
