"""
System Architecture PDF Generator (Albanian)
Generates a PDF document with architecture diagram and explanations
"""

import os
import subprocess
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

# Add Graphviz to PATH on Windows
graphviz_path = r"C:\Program Files\Graphviz\bin"
if os.path.exists(graphviz_path):
    os.environ["PATH"] = graphviz_path + os.pathsep + os.environ.get("PATH", "")

from graphviz import Digraph


def create_architecture_diagram():
    """Create the layered architecture diagram"""
    dot = Digraph('Architecture', format='png')
    dot.attr(rankdir='TB', splines='polyline', nodesep='0.5', ranksep='0.8')
    dot.attr('node', shape='box', style='filled,rounded', fontname='Arial', fontsize='11')
    dot.attr('edge', fontname='Arial', fontsize='9')
    dot.attr(dpi='150')

    # Define subgraphs for each layer
    with dot.subgraph(name='cluster_presentation') as c:
        c.attr(label='Shtresa e Prezantimit\n(Presentation Layer)', style='filled', color='#E3F2FD', fontname='Arial Bold')
        c.node('pages', 'Faqet (Pages)\nDashboard, Projects,\nTasks, Courses', fillcolor='#BBDEFB')
        c.node('components', 'Komponentet (Components)\nButton, Card, Modal,\nSidebar, Forms', fillcolor='#BBDEFB')
        c.node('context', 'State Management\nReact Context API', fillcolor='#BBDEFB')

    with dot.subgraph(name='cluster_api') as c:
        c.attr(label='Shtresa API\n(API Layer)', style='filled', color='#E8F5E9', fontname='Arial Bold')
        c.node('routes', 'Route Handlers\n/api/auth, /api/projects\n/api/tasks, /api/courses', fillcolor='#C8E6C9')
        c.node('auth', 'Autentifikimi\nJWT + Cookies', fillcolor='#C8E6C9')

    with dot.subgraph(name='cluster_business') as c:
        c.attr(label='Shtresa e Logjikes se Biznesit\n(Business Logic Layer)', style='filled', color='#FFF3E0', fontname='Arial Bold')
        c.node('services', 'Services\nAuthService, ProjectService\nTaskService, CourseService\nNotificationService', fillcolor='#FFE0B2')

    with dot.subgraph(name='cluster_data') as c:
        c.attr(label='Shtresa e Aksesit te te Dhenave\n(Data Access Layer)', style='filled', color='#FCE4EC', fontname='Arial Bold')
        c.node('prisma', 'Prisma ORM\nDatabase Client', fillcolor='#F8BBD9')
        c.node('db', 'PostgreSQL\nDatabase', fillcolor='#F8BBD9', shape='cylinder')

    # Define edges (data flow)
    dot.edge('pages', 'routes', label='HTTP Requests')
    dot.edge('components', 'pages', label='', style='dashed')
    dot.edge('context', 'components', label='', style='dashed')
    dot.edge('routes', 'auth', label='Verify Token')
    dot.edge('routes', 'services', label='Call Services')
    dot.edge('services', 'prisma', label='Database Queries')
    dot.edge('prisma', 'db', label='SQL')

    # Render diagram
    output_path = dot.render('architecture_diagram', cleanup=True)
    return 'architecture_diagram.png'


def create_git_diagram():
    """Create Git workflow diagram"""
    dot = Digraph('Git', format='png')
    dot.attr(rankdir='LR', splines='line', nodesep='0.4')
    dot.attr('node', shape='box', style='filled,rounded', fontname='Arial', fontsize='10')
    dot.attr('edge', fontname='Arial', fontsize='8')
    dot.attr(dpi='150')

    # Git workflow nodes
    dot.node('working', 'Working Directory\n(Dosja e Punes)', fillcolor='#FFCDD2')
    dot.node('staging', 'Staging Area\n(Zona e Pergatitjes)', fillcolor='#FFF9C4')
    dot.node('local', 'Local Repository\n(Repo Lokal)', fillcolor='#C8E6C9')
    dot.node('remote', 'Remote Repository\n(GitHub)', fillcolor='#BBDEFB')

    # Edges
    dot.edge('working', 'staging', label='git add')
    dot.edge('staging', 'local', label='git commit')
    dot.edge('local', 'remote', label='git push')
    dot.edge('remote', 'local', label='git pull', style='dashed')

    output_path = dot.render('git_diagram', cleanup=True)
    return 'git_diagram.png'


def create_pdf():
    """Generate the complete PDF document"""

    # First, create the diagrams
    arch_diagram = create_architecture_diagram()
    git_diagram = create_git_diagram()

    # Create PDF
    doc = SimpleDocTemplate(
        "system_architecture.pdf",
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    # Styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1565C0')
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=20,
        spaceAfter=12,
        textColor=colors.HexColor('#1976D2')
    )

    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=13,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#424242')
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=10,
        alignment=TA_JUSTIFY,
        leading=16
    )

    # Build content
    content = []

    # Title
    content.append(Paragraph("9. Arkitektura e Sistemit", title_style))
    content.append(Paragraph("System Architecture", styles['Italic']))
    content.append(Spacer(1, 20))

    # Section 1: Architecture Pattern
    content.append(Paragraph("9.1 Arkitektura e Zgjedhur", heading_style))
    content.append(Paragraph(
        """Projekti yne perdor <b>Arkitekturen e Shtresuar (Layered Architecture)</b> te kombinuar me
        <b>MVC (Model-View-Controller)</b> pattern. Kjo arkitekture eshte implementuar duke perdorur
        <b>Next.js 14</b> si framework full-stack, i cili mundeson zhvillimin e frontend dhe backend
        ne nje monorepo te vetem.""",
        body_style
    ))

    content.append(Paragraph(
        """Arkitektura e shtresuar eshte zgjedhur per keto arsye:""",
        body_style
    ))

    # Reasons list
    reasons = [
        ["1.", "Ndarje e qarte e pergjegjsive - cdo shtrese ka nje rol te percaktuar"],
        ["2.", "Mirembajtje e lehte - ndryshimet ne nje shtrese nuk ndikojne ne te tjerat"],
        ["3.", "Testueshmeri - cdo shtrese mund te testohet ne menyre te pavarur"],
        ["4.", "Shkallezueshmeri - mund te shtohen funksionalitete pa ndryshuar strukturen"],
    ]

    reasons_table = Table(reasons, colWidths=[0.5*inch, 5.5*inch])
    reasons_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(reasons_table)
    content.append(Spacer(1, 15))

    # Section 2: Layers
    content.append(Paragraph("9.2 Shpjegim i Shtresave dhe Pergjegjsive", heading_style))

    # Architecture Diagram
    content.append(Paragraph("Diagrami i Arkitektures:", subheading_style))
    if os.path.exists(arch_diagram):
        img = Image(arch_diagram, width=15*cm, height=12*cm)
        content.append(img)
    content.append(Spacer(1, 15))

    # Layer 1: Presentation
    content.append(Paragraph("Shtresa 1: Shtresa e Prezantimit (Presentation Layer)", subheading_style))
    content.append(Paragraph(
        """Kjo shtrese perfshin te gjithe nderfaqen e perdoruesit (UI). Eshte ndertuar me
        <b>React 18</b> dhe <b>Next.js 14 App Router</b>, duke perdorur <b>Tailwind CSS</b> per stilizim.""",
        body_style
    ))

    layer1_data = [
        ["Lokacioni:", "src/app/dashboard/*, src/components/"],
        ["Teknologjite:", "React 18, Next.js 14, Tailwind CSS"],
        ["Pergjegjesit:", "Faqet, Komponentet UI, Menaxhimi i State"],
        ["Faqet Kryesore:", "Dashboard, Projects, Tasks, Courses, Analytics, Settings"],
    ]

    layer1_table = Table(layer1_data, colWidths=[2*inch, 4*inch])
    layer1_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#E3F2FD')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#90CAF9')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(layer1_table)
    content.append(Spacer(1, 10))

    # Layer 2: API
    content.append(Paragraph("Shtresa 2: Shtresa API (API Layer)", subheading_style))
    content.append(Paragraph(
        """Kjo shtrese trajton te gjitha kerkesat HTTP dhe vepron si ndermjetes midis frontend dhe
        backend. Perdor <b>Next.js Route Handlers</b> per te krijuar API RESTful.""",
        body_style
    ))

    layer2_data = [
        ["Lokacioni:", "src/app/api/**/route.ts"],
        ["Teknologjite:", "Next.js Route Handlers, JWT"],
        ["Pergjegjesit:", "Routing, Autentifikimi, Validimi i Kerkesave"],
        ["Endpoints:", "/api/auth, /api/projects, /api/tasks, /api/courses"],
    ]

    layer2_table = Table(layer2_data, colWidths=[2*inch, 4*inch])
    layer2_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#E8F5E9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A5D6A7')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(layer2_table)
    content.append(Spacer(1, 10))

    # Layer 3: Business Logic
    content.append(Paragraph("Shtresa 3: Shtresa e Logjikes se Biznesit (Business Logic Layer)", subheading_style))
    content.append(Paragraph(
        """Kjo shtrese permban te gjithe logjiken e biznesit te aplikacionit. Cdo funksionalitet
        eshte i organizuar ne <b>Services</b> te vecanta qe operojne si singleton.""",
        body_style
    ))

    layer3_data = [
        ["Lokacioni:", "src/services/*.ts"],
        ["Services:", "AuthService, ProjectService, TaskService"],
        ["", "CourseService, NotificationService, DashboardService"],
        ["Pergjegjesit:", "Rregullat e biznesit, Validimi, Operacionet"],
    ]

    layer3_table = Table(layer3_data, colWidths=[2*inch, 4*inch])
    layer3_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF3E0')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#FFCC80')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(layer3_table)
    content.append(Spacer(1, 10))

    # Layer 4: Data Access
    content.append(Paragraph("Shtresa 4: Shtresa e Aksesit te te Dhenave (Data Access Layer)", subheading_style))
    content.append(Paragraph(
        """Kjo shtrese menaxhon te gjitha operacionet me databazen. Perdor <b>Prisma ORM</b>
        per te komunikuar me databazen <b>PostgreSQL</b>.""",
        body_style
    ))

    layer4_data = [
        ["Lokacioni:", "prisma/schema.prisma, src/lib/prisma.ts"],
        ["Teknologjite:", "Prisma ORM, PostgreSQL"],
        ["Modelet:", "User, Project, Task, Course, Notification"],
        ["Pergjegjesit:", "CRUD operacionet, Migracionet, Seeding"],
    ]

    layer4_table = Table(layer4_data, colWidths=[2*inch, 4*inch])
    layer4_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FCE4EC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F48FB1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(layer4_table)
    content.append(Spacer(1, 20))

    # Data Flow
    content.append(Paragraph("Rrjedha e te Dhenave (Data Flow)", subheading_style))
    content.append(Paragraph(
        """Kur nje perdorues ndervepron me aplikacionin, te dhenat rrjedhin nepermjet shtresave ne kete menyre:""",
        body_style
    ))

    flow_steps = [
        ["1.", "Perdoruesi klikon ne nje buton ose form ne UI (Presentation Layer)"],
        ["2.", "React dergon nje kerkese HTTP tek API endpoint (API Layer)"],
        ["3.", "Route Handler verifikon JWT token dhe therret Service perkates"],
        ["4.", "Service ekzekuton logjiken e biznesit (Business Logic Layer)"],
        ["5.", "Prisma ORM ekzekuton query ne PostgreSQL (Data Access Layer)"],
        ["6.", "Pergjigja kthehet mbrapsht nepermjet te njejtes rruge"],
    ]

    flow_table = Table(flow_steps, colWidths=[0.5*inch, 5.5*inch])
    flow_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(flow_table)

    # Page break
    content.append(PageBreak())

    # Section 3: Git Versioning
    content.append(Paragraph("9.3 Versionimi i Kodit nepermjet Git", heading_style))
    content.append(Paragraph(
        """Per menaxhimin e versioneve te kodit, projekti perdor <b>Git</b> si sistem kontrolli
        te versioneve dhe <b>GitHub</b> si platforme per ruajtjen e repository-t ne distance.""",
        body_style
    ))

    # Git Diagram
    content.append(Paragraph("Diagrami i Git Workflow:", subheading_style))
    if os.path.exists(git_diagram):
        img = Image(git_diagram, width=14*cm, height=5*cm)
        content.append(img)
    content.append(Spacer(1, 15))

    # Git Commands
    content.append(Paragraph("Komandat Kryesore te Git:", subheading_style))

    git_commands = [
        ["Komanda", "Pershkrimi"],
        ["git init", "Inicializon nje repository te ri Git"],
        ["git clone <url>", "Klonon nje repository nga GitHub"],
        ["git add .", "Shton te gjitha ndryshimet ne staging area"],
        ["git commit -m 'msg'", "Krijon nje commit me mesazh"],
        ["git push", "Dergon commits ne repository remote"],
        ["git pull", "Merr ndryshimet nga repository remote"],
        ["git branch <name>", "Krijon nje dege te re"],
        ["git checkout <branch>", "Kalon ne nje dege tjeter"],
        ["git merge <branch>", "Bashkon nje dege me degen aktuale"],
        ["git status", "Shfaq statusin e ndryshimeve"],
        ["git log", "Shfaq historine e commits"],
    ]

    git_table = Table(git_commands, colWidths=[2.2*inch, 3.8*inch])
    git_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 1), (0, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(git_table)
    content.append(Spacer(1, 15))

    # Git Best Practices
    content.append(Paragraph("Praktikat e Mira me Git:", subheading_style))

    practices = [
        ["1.", "Commit shpesh - commits te vogla dhe te shpeshta jane me te mira se commits te medha"],
        ["2.", "Shkruaj mesazhe te qarta - pershkruaj se cfare ndryshon commit-i"],
        ["3.", "Perdor branches - nje dege per cdo feature ose bug fix"],
        ["4.", "Review kod - perdor Pull Requests per te bere code review"],
        ["5.", "Mos commit secrets - perdor .gitignore per te perjashtuar .env dhe kredencialet"],
    ]

    practices_table = Table(practices, colWidths=[0.5*inch, 5.5*inch])
    practices_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(practices_table)
    content.append(Spacer(1, 15))

    # Project Git Info
    content.append(Paragraph("Informacion mbi Repository-n e Projektit:", subheading_style))
    content.append(Paragraph(
        """Repository i projektit ruhet ne GitHub dhe perdor degen <b>main</b> si dege kryesore.
        Te gjitha zhvillimet e reja behem me ane te Pull Requests dhe code review.""",
        body_style
    ))

    # Technologies Summary
    content.append(Spacer(1, 20))
    content.append(Paragraph("Permbledhje e Teknologjive", heading_style))

    tech_summary = [
        ["Kategoria", "Teknologjia"],
        ["Frontend Framework", "React 18 + Next.js 14"],
        ["Styling", "Tailwind CSS"],
        ["Backend", "Next.js Route Handlers"],
        ["Database", "PostgreSQL"],
        ["ORM", "Prisma"],
        ["Authentication", "JWT + HttpOnly Cookies"],
        ["State Management", "React Context API"],
        ["Version Control", "Git + GitHub"],
        ["Language", "TypeScript"],
    ]

    tech_table = Table(tech_summary, colWidths=[2.5*inch, 3.5*inch])
    tech_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1565C0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#E3F2FD')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#90CAF9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(tech_table)

    # Build PDF
    doc.build(content)
    print("PDF generated successfully: system_architecture.pdf")

    # Cleanup diagram files
    for f in ['architecture_diagram.png', 'git_diagram.png']:
        if os.path.exists(f):
            os.remove(f)


if __name__ == '__main__':
    create_pdf()
