"""
Design Patterns Documentation PDF Generator
Contains all design patterns used in the project with explanations in Albanian
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT


def create_pdf():
    doc = SimpleDocTemplate(
        "design_patterns.pdf",
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1565C0')
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#1976D2')
    )

    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=11,
        spaceBefore=10,
        spaceAfter=5,
        textColor=colors.HexColor('#424242')
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontSize=7,
        fontName='Courier',
        leading=9,
        spaceAfter=6,
    )

    content = []

    # Title
    content.append(Paragraph("Design Patterns - Modelet e Dizajnit", title_style))
    content.append(Paragraph("Patterns te perdorura ne projekt", styles['Italic']))
    content.append(Spacer(1, 15))

    # Introduction
    content.append(Paragraph("Hyrje", heading_style))
    content.append(Paragraph(
        """<b>Design Patterns (Modelet e Dizajnit)</b> jane zgjidhje te provuara per probleme te zakonshme
        ne dizajnimin e softuerit. Ato ndihmojne ne krijimin e kodit te mirembajteshem, te riperdorshem,
        dhe te shkallezueshem. Ne projektin tone kemi implementuar disa patterns kryesore qe pershkruhen
        me poshte.""",
        body_style
    ))

    # ============================================
    # PATTERN 1: SINGLETON
    # ============================================
    content.append(Paragraph("1. Singleton Pattern", heading_style))
    content.append(Paragraph("Lokacioni: src/services/*.ts, src/lib/prisma.ts", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Singleton Pattern siguron qe nje klase te kete vetem nje instance
        ne te gjithe aplikacionin dhe ofron nje pike globale aksesi per te.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    singleton_reasons = [
        ["1.", "Siguron qe te gjithe komponentet perdorin te njejten instance te sherbimit"],
        ["2.", "Parandalon krijimin e shume lidhjeve me databazen (Prisma)"],
        ["3.", "Kursen memorien duke shmangur duplikimin e objekteve"],
        ["4.", "Lejon testimin duke eksportuar edhe klasen"],
    ]
    reasons_table = Table(singleton_reasons, colWidths=[0.8*cm, 15*cm])
    reasons_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(reasons_table)

    content.append(Paragraph("Shembull nga AuthService.ts:", subheading_style))
    singleton_code = '''class AuthService {
  async login(email: string, password: string) { /* ... */ }
  async logout(sessionId: string) { /* ... */ }
  hashPassword(password: string): string { /* ... */ }
  verifyPassword(password: string, storedHash: string): boolean { /* ... */ }
}

// Eksportojme nje instance singleton
export const authService = new AuthService()

// Eksportojme edhe klasen per testim
export { AuthService }'''

    code_table = Table([[Preformatted(singleton_code, code_style)]], colWidths=[17*cm])
    code_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table)

    content.append(Paragraph("Shembull nga prisma.ts (Database Singleton):", subheading_style))
    prisma_code = '''const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Perdor instance ekzistuese ose krijo te re
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Ruaj ne global per te shmangur shume instanca ne development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}'''

    code_table2 = Table([[Preformatted(prisma_code, code_style)]], colWidths=[17*cm])
    code_table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table2)

    # ============================================
    # PATTERN 2: SERVICE LAYER
    # ============================================
    content.append(Paragraph("2. Service Layer Pattern", heading_style))
    content.append(Paragraph("Lokacioni: src/services/*.ts", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Service Layer Pattern krijon nje shtrese abstraksioni qe enkapsulon
        te gjithe logjiken e biznesit, duke e ndaree ate nga API routes dhe komponentet e UI.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    service_reasons = [
        ["1.", "Ndan logjiken e biznesit nga prezantimi (UI) dhe aksesi i te dhenave"],
        ["2.", "Ben kodin me te lehte per tu testuar (unit testing)"],
        ["3.", "Lejon riperdorimin e logjikes ne shume vende"],
        ["4.", "Thjeshton API routes - ato thjesht delegojne tek services"],
    ]
    service_table = Table(service_reasons, colWidths=[0.8*cm, 15*cm])
    service_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(service_table)

    content.append(Paragraph("Shembull nga ProjectService.ts:", subheading_style))
    service_code = '''class ProjectService {
  // Krijon projekt me transaction per konsistence
  async createProject(input: CreateProjectInput): Promise<Project> {
    const project = await prisma.$transaction(async (tx) => {
      // Krijo projektin
      const newProject = await tx.project.create({
        data: { title, description, teamLeaderId: createdById }
      })

      // Shto team leader si anetar automatikisht
      await tx.projectUser.create({
        data: {
          projectId: newProject.id,
          userId: createdById,
          role: 'team_leader',
          inviteStatus: 'accepted'
        }
      })
      return newProject
    })

    // Regjistro aktivitetin
    await this.logActivity(createdById, 'create_project', 'project', project.id)
    return project
  }
}'''

    code_table3 = Table([[Preformatted(service_code, code_style)]], colWidths=[17*cm])
    code_table3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table3)

    content.append(PageBreak())

    # ============================================
    # PATTERN 3: PROVIDER PATTERN
    # ============================================
    content.append(Paragraph("3. Provider Pattern (React Context)", heading_style))
    content.append(Paragraph("Lokacioni: src/contexts/*.tsx", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Provider Pattern perdor React Context API per te shperndare state
        dhe funksione ne te gjithe pemen e komponenteve pa pasur nevoje per prop drilling.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    provider_reasons = [
        ["1.", "Shmang 'prop drilling' - kalimin e props nepermjet shume niveleve"],
        ["2.", "Centralizon menaxhimin e state per notifications dhe invites"],
        ["3.", "Ben state globalisht te aksesueshem ne cdo komponent"],
        ["4.", "Lejon polling automatik per te dhena te reja (cdo 30 sekonda)"],
    ]
    provider_table = Table(provider_reasons, colWidths=[0.8*cm, 15*cm])
    provider_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(provider_table)

    content.append(Paragraph("Shembull nga NotificationContext.tsx:", subheading_style))
    provider_code = '''export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    const response = await fetch('/api/notifications?limit=50')
    if (response.ok) {
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }
  }, [])

  // Polling cdo 30 sekonda per notifications te reja
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, fetchNotifications, markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook per perdorim te lehte
export function useNotifications() {
  return useContext(NotificationContext)
}'''

    code_table4 = Table([[Preformatted(provider_code, code_style)]], colWidths=[17*cm])
    code_table4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table4)

    # ============================================
    # PATTERN 4: OBSERVER PATTERN
    # ============================================
    content.append(Paragraph("4. Observer Pattern (Event-Driven Notifications)", heading_style))
    content.append(Paragraph("Lokacioni: src/services/NotificationService.ts", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Observer Pattern lejon objektet te njoftojne objekte te tjera
        kur ndodhin ndryshime ne gjendjen e tyre. Ne rastin tone, services njoftojne
        NotificationService kur ndodhin evente te rendesishme.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    observer_reasons = [
        ["1.", "Njofton perdoruesit automatikisht kur ndryshon statusi i taskeve"],
        ["2.", "Dergon njoftime kur afrohen deadline-t e projekteve"],
        ["3.", "Informon anetaret kur dikush pranon ose refuzon ftesen"],
        ["4.", "Krijon sistem komunikimi te decentralizuar"],
    ]
    observer_table = Table(observer_reasons, colWidths=[0.8*cm, 15*cm])
    observer_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(observer_table)

    content.append(Paragraph("Shembull - Kur ndryshon statusi i task:", subheading_style))
    observer_code = '''// Ne TaskService kur ndryshon statusi
async changeTaskStatus(taskId: string, newStatus: TaskStatus, changedById: string) {
  // Ndrysho statusin ne database
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus }
  })

  // OBSERVER: Njofto te gjithe anetaret e projektit
  if (newStatus === 'done') {
    await notificationService.notifyTaskCompleted(
      recipientIds,    // Observers - anetaret qe do njoftohen
      changer,         // Kush e perfundoi
      taskInfo,        // Informacion per task
      project          // Projekti perkates
    )
  } else {
    await notificationService.notifyTaskStatusChanged(
      recipientIds, changer, taskInfo, project, newStatus
    )
  }
}'''

    code_table5 = Table([[Preformatted(observer_code, code_style)]], colWidths=[17*cm])
    code_table5.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table5)

    content.append(PageBreak())

    # ============================================
    # PATTERN 5: REPOSITORY PATTERN
    # ============================================
    content.append(Paragraph("5. Repository Pattern", heading_style))
    content.append(Paragraph("Lokacioni: src/services/*.ts (implicit)", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Repository Pattern ofron nje abstraksion mbi aksesimin e te dhenave,
        duke fshehur detajet e queries nga pjesa tjeter e aplikacionit.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    repo_reasons = [
        ["1.", "Izolon logjiken e aksesit te te dhenave nga logjika e biznesit"],
        ["2.", "Ben me te lehte ndryshimin e database (p.sh. nga PostgreSQL ne MongoDB)"],
        ["3.", "Centralizon queries - me e lehte per tu optimizuar"],
        ["4.", "Lejon mocking te lehte per unit testing"],
    ]
    repo_table = Table(repo_reasons, colWidths=[0.8*cm, 15*cm])
    repo_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(repo_table)

    content.append(Paragraph("Shembull nga CourseService.ts:", subheading_style))
    repo_code = '''class CourseService {
  // Abstraksion per aksesimin e te dhenave
  async getCourseById(courseId: string): Promise<Course | null> {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        professor: { select: { id: true, fullName: true, email: true } },
        _count: { select: { enrollments: true, projects: true } }
      }
    })
  }

  async getEnrolledCourses(studentId: string) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      include: { course: { include: { professor: true } } }
    })
    // Kthen domain objects, fsheh detajet e query
    return enrollments.map(e => ({ ...e.course, enrolledAt: e.enrolledAt }))
  }
}'''

    code_table6 = Table([[Preformatted(repo_code, code_style)]], colWidths=[17*cm])
    code_table6.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table6)

    # ============================================
    # PATTERN 6: FACTORY PATTERN
    # ============================================
    content.append(Paragraph("6. Factory Pattern", heading_style))
    content.append(Paragraph("Lokacioni: src/services/*.ts (mapToType methods)", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Factory Pattern enkapsulon logjiken e krijimit te objekteve,
        duke e centralizuar transformimin e te dhenave nga databaza ne domain objects.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    factory_reasons = [
        ["1.", "Centralizon transformimin e te dhenave nga Prisma ne tipet tona"],
        ["2.", "Siguron konsistence ne strukturen e objekteve te kthyera"],
        ["3.", "Thjeshton menaxhimin e null values (konverton ne undefined)"],
        ["4.", "Lejon ndryshime te lehta ne strukture pa prekur shume kod"],
    ]
    factory_table = Table(factory_reasons, colWidths=[0.8*cm, 15*cm])
    factory_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(factory_table)

    content.append(Paragraph("Shembull nga TaskService.ts:", subheading_style))
    factory_code = '''// Factory method per transformim te objekteve
private mapToTaskType(task: PrismaTask): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description ?? undefined,  // null -> undefined
    priority: task.priority as TaskPriority,     // Type casting
    status: task.status as TaskStatus,
    assigneeId: task.assigneeId ?? undefined,
    ordinal: task.ordinal,
    createdById: task.createdById,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    dueDate: task.dueDate ?? undefined
  }
}'''

    code_table7 = Table([[Preformatted(factory_code, code_style)]], colWidths=[17*cm])
    code_table7.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table7)

    content.append(PageBreak())

    # ============================================
    # PATTERN 7: MVC/CONTROLLER PATTERN
    # ============================================
    content.append(Paragraph("7. Controller Pattern (API Routes)", heading_style))
    content.append(Paragraph("Lokacioni: src/app/api/**/*.ts", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Controller Pattern trajton kerkesat HTTP dhe delegon logjiken
        tek Service Layer. Ne Next.js, Route Handlers veprojne si controllers.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    controller_reasons = [
        ["1.", "Ndan trajtimin e HTTP nga logjika e biznesit"],
        ["2.", "Centralizon autentifikimin dhe validimin e kerkesave"],
        ["3.", "Standardizon formatin e pergjigjeve (JSON)"],
        ["4.", "Menaxhon error handling ne nje vend"],
    ]
    controller_table = Table(controller_reasons, colWidths=[0.8*cm, 15*cm])
    controller_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(controller_table)

    content.append(Paragraph("Shembull nga /api/projects/route.ts:", subheading_style))
    controller_code = '''export async function GET(request: Request) {
  try {
    // 1. Autentifikimi
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // 2. Merr parametrat
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // 3. Delego tek Service Layer
    const projects = await projectService.getProjectsByUser(user.id, status)

    // 4. Kthe pergjigjen
    return NextResponse.json({ projects })
  } catch (error) {
    // 5. Error handling
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}'''

    code_table8 = Table([[Preformatted(controller_code, code_style)]], colWidths=[17*cm])
    code_table8.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table8)

    # ============================================
    # PATTERN 8: MODULE PATTERN
    # ============================================
    content.append(Paragraph("8. Module Pattern", heading_style))
    content.append(Paragraph("Lokacioni: src/services/index.ts, src/components/index.ts", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Module Pattern organizon kodin ne module te pavarura dhe
        ofron nje pike te vetme eksporti per secilin modul.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    module_reasons = [
        ["1.", "Thjeshton importet - nje import per te gjitha services"],
        ["2.", "Fsheh implementimin e brendshem te modulit"],
        ["3.", "Lejon riorganizimin e brendshem pa ndryshuar importet"],
        ["4.", "Krijon API te qarte per cdo modul"],
    ]
    module_table = Table(module_reasons, colWidths=[0.8*cm, 15*cm])
    module_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(module_table)

    content.append(Paragraph("Shembull nga services/index.ts:", subheading_style))
    module_code = '''// Barrel export - eksporton te gjitha services nga nje skedar
export { authService, AuthService } from './AuthService'
export { projectService, ProjectService } from './ProjectService'
export { taskService, TaskService } from './TaskService'
export { notificationService } from './NotificationService'
export { courseService } from './CourseService'
export { teamService } from './TeamService'
export { fileService } from './FileService'
export { dashboardService } from './DashboardService'

// Perdorimi:
import { authService, projectService, taskService } from '@/services'
'''

    code_table9 = Table([[Preformatted(module_code, code_style)]], colWidths=[17*cm])
    code_table9.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table9)

    content.append(PageBreak())

    # ============================================
    # PATTERN 9: FACADE PATTERN
    # ============================================
    content.append(Paragraph("9. Facade Pattern", heading_style))
    content.append(Paragraph("Lokacioni: src/services/DashboardService.ts", subheading_style))

    content.append(Paragraph(
        """<b>Cfare eshte?</b> Facade Pattern ofron nje nderface te thjeshte per nje sistem
        kompleks, duke fshehur kompleksitetin e nenshtresave.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse e perdorim?</b>""",
        body_style
    ))
    facade_reasons = [
        ["1.", "Thjeshton API per dashboard - nje thirrje merr te gjitha te dhenat"],
        ["2.", "Fsheh kompleksitetin e queries te shumefishta"],
        ["3.", "Optimizon performancen me Promise.all (paralel)"],
        ["4.", "Ofron nderfaqe te qarte per frontend"],
    ]
    facade_table = Table(facade_reasons, colWidths=[0.8*cm, 15*cm])
    facade_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    content.append(facade_table)

    content.append(Paragraph("Shembull nga DashboardService.ts:", subheading_style))
    facade_code = '''class DashboardService {
  // FACADE: Nje metode qe mbledh te dhena nga shume burime
  async getDashboardData(userId: string): Promise<DashboardData> {
    // Ekzekuton queries ne paralel per performance
    const [stats, recentProjects] = await Promise.all([
      this.getDashboardStats(userId),      // Statistika
      this.getRecentProjects(userId),      // Projektet e fundit
    ])

    return { stats, recentProjects }
  }

  // Facade per profesor dashboard
  async getProfessorDashboardData(professorId: string) {
    const [stats, courses, recentActivity] = await Promise.all([
      this.getProfessorDashboardStats(professorId),
      this.getProfessorCourses(professorId),
      this.getProfessorRecentActivity(professorId),
    ])

    return { stats, courses, recentActivity }
  }
}'''

    code_table10 = Table([[Preformatted(facade_code, code_style)]], colWidths=[17*cm])
    code_table10.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table10)

    content.append(Spacer(1, 15))

    # ============================================
    # SUMMARY TABLE
    # ============================================
    content.append(Paragraph("Permbledhje e Design Patterns", heading_style))

    summary_data = [
        ["Pattern", "Lokacioni", "Qellimi Kryesor"],
        ["Singleton", "Services, Prisma", "Nje instance ne gjithe app"],
        ["Service Layer", "src/services/", "Ndan logjiken e biznesit"],
        ["Provider", "src/contexts/", "State global pa prop drilling"],
        ["Observer", "NotificationService", "Njoftimet event-driven"],
        ["Repository", "Services", "Abstraksion i aksesit te dhenave"],
        ["Factory", "mapToType methods", "Krijim i standardizuar objektesh"],
        ["Controller", "src/app/api/", "Trajtim i kerkesave HTTP"],
        ["Module", "index.ts files", "Organizim dhe barrel exports"],
        ["Facade", "DashboardService", "Interface e thjeshte per sisteme komplekse"],
    ]

    summary_table = Table(summary_data, colWidths=[2.5*cm, 3.5*cm, 8*cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#E3F2FD')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#90CAF9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(summary_table)

    # Build PDF
    doc.build(content)
    print("PDF generated successfully: design_patterns.pdf")


if __name__ == '__main__':
    create_pdf()
