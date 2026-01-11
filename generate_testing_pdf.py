"""
Unit Testing & Code Coverage PDF Generator (Albanian)
Generates a PDF document explaining testing strategy, test results, and code coverage
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT


def create_pdf():
    """Generate the complete PDF document"""

    doc = SimpleDocTemplate(
        "unit_testing_coverage.pdf",
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

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

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontSize=9,
        fontName='Courier',
        backColor=colors.HexColor('#F5F5F5'),
        borderColor=colors.HexColor('#E0E0E0'),
        borderWidth=1,
        borderPadding=8,
        spaceAfter=10,
        leading=12
    )

    content = []

    # Title
    content.append(Paragraph("Unit Testing & Code Coverage", title_style))
    content.append(Paragraph("Testimi Unitar dhe Mbulimi i Kodit", styles['Italic']))
    content.append(Spacer(1, 20))

    # Section 1: What is Unit Testing
    content.append(Paragraph("1. Cfare eshte Unit Testing?", heading_style))
    content.append(Paragraph(
        """<b>Unit Testing (Testimi Unitar)</b> eshte nje praktike e zhvillimit te softuerit ku
        testohen njesi te vogla te kodit (zakonisht funksione ose metoda individuale) ne menyre
        te izoluar per te verifikuar qe funksionojne sic pritet.""",
        body_style
    ))

    content.append(Paragraph(
        """Qellimet kryesore te Unit Testing jane:""",
        body_style
    ))

    goals = [
        ["1.", "Verifikimi i logjikes se kodit - Sigurohemi qe funksionet bejne ate qe duhet"],
        ["2.", "Zbulimi i hershëm i gabimeve - Gjejme bugs para se kodi te shkoje ne produkcjon"],
        ["3.", "Dokumentimi i sjelljes - Testet tregojne se si duhet te perdoret kodi"],
        ["4.", "Refaktorimi i sigurt - Mund te ndryshojme kodin duke ditur qe testet do na paralajmerojne per probleme"],
    ]

    goals_table = Table(goals, colWidths=[0.5*inch, 5.5*inch])
    goals_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(goals_table)
    content.append(Spacer(1, 15))

    # Section 2: What is Code Coverage
    content.append(Paragraph("2. Cfare eshte Code Coverage?", heading_style))
    content.append(Paragraph(
        """<b>Code Coverage (Mbulimi i Kodit)</b> eshte nje metrike qe mat sa perqind e kodit burimor
        ekzekutohet gjate ekzekutimit te testeve. Eshte nje tregues i rendesishem per te vleresuar
        cilesine e testeve.""",
        body_style
    ))

    content.append(Paragraph("Tipet e Code Coverage:", subheading_style))

    coverage_types = [
        ["Tipi", "Pershkrimi", "Shembull"],
        ["Statement Coverage\n(Mbulimi i Deklaratave)", "Perqindja e linjave te kodit\nqe jane ekzekutuar", "Sa linja kodi u ekzekutuan\nnga testet"],
        ["Branch Coverage\n(Mbulimi i Degeve)", "Perqindja e degeve te logjikes\n(if/else) qe jane testuar", "A u testuan te dyja degt e\nnje if/else?"],
        ["Function Coverage\n(Mbulimi i Funksioneve)", "Perqindja e funksioneve\nqe jane thirrur", "Sa funksione u thirrën\ngjate testeve"],
        ["Line Coverage\n(Mbulimi i Linjave)", "Ngjashem me Statement,\nmat linjat e ekzekutuara", "Perqindja e linjave te\nekzekutuara"],
    ]

    coverage_table = Table(coverage_types, colWidths=[2*inch, 2.2*inch, 2*inch])
    coverage_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(coverage_table)
    content.append(Spacer(1, 15))

    content.append(Paragraph(
        """<b>E rendesishme:</b> Nje code coverage i larte nuk do te thote qe kodi eshte i sakte.
        Thjesht tregon qe testet ekzekutojne shume kod. Cilesja e testeve eshte po aq e rendesishme.""",
        body_style
    ))

    # Section 3: Testing Strategy
    content.append(Paragraph("3. Strategjia e Testimit", heading_style))
    content.append(Paragraph(
        """Per projektin tone, kemi implementuar nje strategji testimi qe fokusohet ne testimin e
        funksioneve te pastra (pure functions) qe nuk varen nga databaza. Kjo na lejon te testojme
        logjiken e biznesit ne menyre te izoluar.""",
        body_style
    ))

    content.append(Paragraph("Struktura e Testeve:", subheading_style))

    test_structure = [
        ["Dosja/Skedari", "Pershkrimi"],
        ["src/__tests__/", "Dosja kryesore per te gjitha testet"],
        ["AuthService.test.ts", "Teste per hashimin dhe verifikimin e fjalekalimeve"],
        ["stringHelpers.test.ts", "Teste per funksionet utilitare"],
        ["jest.config.js", "Konfigurimi i Jest framework"],
        ["jest.setup.js", "Setup skedari per mock te Prisma"],
    ]

    structure_table = Table(test_structure, colWidths=[2.5*inch, 3.5*inch])
    structure_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Courier'),
        ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#E3F2FD')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#90CAF9')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(structure_table)
    content.append(Spacer(1, 15))

    content.append(Paragraph("Framework i Perdorur: Jest", subheading_style))
    content.append(Paragraph(
        """<b>Jest</b> eshte nje framework testimi JavaScript i zhvilluar nga Meta (Facebook).
        Eshte i perdorur gjeresisht per testimin e aplikacioneve React dhe Node.js. Karakteristikat
        kryesore perfshijne: zero konfigurimi, mocking te integruar, dhe raportim te code coverage.""",
        body_style
    ))

    # Page break
    content.append(PageBreak())

    # Section 4: Test Results
    content.append(Paragraph("4. Rezultatet e Testeve (Test Results)", heading_style))
    content.append(Paragraph(
        """Me poshte jane rezultatet e ekzekutimit te 7 testeve qe kemi shkruar per projektin tone:""",
        body_style
    ))

    content.append(Paragraph("Permbledhje e Testeve:", subheading_style))

    test_summary = [
        ["Metrika", "Vlera"],
        ["Test Suites", "2 passed, 2 total"],
        ["Tests", "7 passed, 7 total"],
        ["Snapshots", "0 total"],
        ["Time", "~5 sekonda"],
    ]

    summary_table = Table(test_summary, colWidths=[2*inch, 4*inch])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#E8F5E9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A5D6A7')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(summary_table)
    content.append(Spacer(1, 15))

    content.append(Paragraph("Lista e Testeve:", subheading_style))

    tests_list = [
        ["#", "Emri i Testit", "Skedari", "Statusi"],
        ["1", "should create hash in correct format", "AuthService.test.ts", "PASS"],
        ["2", "should produce different hashes", "AuthService.test.ts", "PASS"],
        ["3", "should return true for correct password", "AuthService.test.ts", "PASS"],
        ["4", "should return false for incorrect password", "AuthService.test.ts", "PASS"],
        ["5", "should return false for invalid hash", "AuthService.test.ts", "PASS"],
        ["6", "should capitalize first letter", "stringHelpers.test.ts", "PASS"],
        ["7", "should handle edge cases", "stringHelpers.test.ts", "PASS"],
    ]

    tests_table = Table(tests_list, colWidths=[0.4*inch, 2.5*inch, 1.8*inch, 0.8*inch])
    tests_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
        ('BACKGROUND', (-1, 1), (-1, -1), colors.HexColor('#C8E6C9')),
        ('TEXTCOLOR', (-1, 1), (-1, -1), colors.HexColor('#2E7D32')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (-1, 0), (-1, -1), 'CENTER'),
    ]))
    content.append(tests_table)
    content.append(Spacer(1, 20))

    # Section 5: Code Coverage Results
    content.append(Paragraph("5. Rezultatet e Code Coverage", heading_style))
    content.append(Paragraph(
        """Me poshte eshte raporti i code coverage per skedaret e testuar:""",
        body_style
    ))

    coverage_results = [
        ["Skedari", "Statements", "Branches", "Functions", "Lines"],
        ["stringHelpers.ts", "100%", "100%", "100%", "100%"],
        ["AuthService.ts", "22.03%", "13.33%", "20%", "20.68%"],
        ["Te tjerat (pa teste)", "0%", "0%", "0%", "0%"],
    ]

    coverage_results_table = Table(coverage_results, colWidths=[2*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch])
    coverage_results_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (0, 1), colors.HexColor('#E3F2FD')),
        ('BACKGROUND', (1, 1), (-1, 1), colors.HexColor('#C8E6C9')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF9C4')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FFCDD2')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(coverage_results_table)
    content.append(Spacer(1, 15))

    content.append(Paragraph("Interpretimi i Rezultateve:", subheading_style))
    content.append(Paragraph(
        """<b>stringHelpers.ts</b> ka 100% coverage sepse te gjitha funksionet jane testuar plotesisht.
        <b>AuthService.ts</b> ka coverage me te ulet sepse kemi testuar vetem funksionet e hashimit
        dhe verifikimit te fjalekalimeve, ndersa funksionet qe komunikojne me databazen nuk jane testuar
        ne keto unit teste.""",
        body_style
    ))

    # Page break
    content.append(PageBreak())

    # Section 6: How to Run Tests
    content.append(Paragraph("6. Si te Ekzekutoni Testet", heading_style))
    content.append(Paragraph(
        """Per te ekzekutuar testet ne projektin tuaj, perdorni komandat e meposhtme ne terminal:""",
        body_style
    ))

    commands = [
        ["Komanda", "Pershkrimi"],
        ["npm test", "Ekzekuton te gjitha testet nje here"],
        ["npm run test:watch", "Ekzekuton testet ne watch mode (ri-ekzekuton kur ndryshon kodi)"],
        ["npm run test:coverage", "Ekzekuton testet dhe gjeneron raportin e coverage"],
    ]

    commands_table = Table(commands, colWidths=[2.2*inch, 4*inch])
    commands_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Courier'),
        ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(commands_table)
    content.append(Spacer(1, 15))

    content.append(Paragraph("Lokacioni i Raportit te Coverage:", subheading_style))
    content.append(Paragraph(
        """Pas ekzekutimit te <b>npm run test:coverage</b>, raporti HTML i coverage gjenerohet ne:""",
        body_style
    ))
    content.append(Paragraph(
        """<font face="Courier" color="#1565C0">coverage/lcov-report/index.html</font>""",
        body_style
    ))
    content.append(Paragraph(
        """Hapeni kete skedar ne nje browser per te pare nje raport interaktiv te coverage.""",
        body_style
    ))

    content.append(Spacer(1, 20))

    # Section 7: File Locations
    content.append(Paragraph("7. Lokacionet e Skedareve", heading_style))
    content.append(Paragraph(
        """Ketu jane lokacionet e te gjithe skedareve te testimit ne projekt:""",
        body_style
    ))

    files_list = [
        ["Skedari", "Lokacioni"],
        ["Jest Config", "jest.config.js (root)"],
        ["Jest Setup", "jest.setup.js (root)"],
        ["AuthService Tests", "src/__tests__/AuthService.test.ts"],
        ["StringHelpers Tests", "src/__tests__/stringHelpers.test.ts"],
        ["Coverage Report", "coverage/ (pas npm run test:coverage)"],
    ]

    files_table = Table(files_list, colWidths=[2*inch, 4*inch])
    files_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTNAME', (1, 1), (1, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#673AB7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#EDE7F6')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#B39DDB')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(files_table)
    content.append(Spacer(1, 20))

    # Section 8: Best Practices
    content.append(Paragraph("8. Praktikat e Mira te Testimit", heading_style))

    practices = [
        ["1.", "Shkruani teste te vogla dhe te fokusuara - nje test per nje funksionalitet"],
        ["2.", "Perdorni emra pershkrues - emri i testit duhet te tregoje cfare testohet"],
        ["3.", "Ndiqni patternin AAA - Arrange (pergatit), Act (vepro), Assert (verifiko)"],
        ["4.", "Testoni edge cases - testoni rastet kufitare dhe gabimet"],
        ["5.", "Mbani testet te pavarura - nje test nuk duhet te varret nga rezultati i nje testi tjeter"],
        ["6.", "Ekzekutoni testet shpesh - idealisht pas cdo ndryshimi te kodit"],
    ]

    practices_table = Table(practices, colWidths=[0.5*inch, 5.5*inch])
    practices_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(practices_table)

    # Build PDF
    doc.build(content)
    print("PDF generated successfully: unit_testing_coverage.pdf")


if __name__ == '__main__':
    create_pdf()
