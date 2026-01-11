"""
Unit Tests Documentation PDF Generator
Contains all test code with explanations in Albanian
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT


def create_pdf():
    doc = SimpleDocTemplate(
        "tests_documentation.pdf",
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
        spaceAfter=10,
        textColor=colors.HexColor('#1976D2')
    )

    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=12,
        spaceBefore=12,
        spaceAfter=6,
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
        spaceAfter=8,
    )

    content = []

    # Title
    content.append(Paragraph("Unit Testing - Dokumentacioni i Testeve", title_style))
    content.append(Spacer(1, 10))

    # Introduction
    content.append(Paragraph("Hyrje", heading_style))
    content.append(Paragraph(
        """Ky dokument permban te gjitha testet e shkruara per projektin tone, se bashku me
        shpjegime te hollesishme per secilin test. Testet jane shkruar duke perdorur <b>Jest</b>,
        nje framework testimi per JavaScript/TypeScript.""",
        body_style
    ))

    content.append(Paragraph(
        """<b>Pse nevojiten testet?</b> Testet na ndihmojne te verifikojme qe kodi funksionon
        sic pritet, te zbulojme gabime para se te shkojne ne produkcjon, dhe te dokumentojme
        sjelljen e pritur te kodit.""",
        body_style
    ))

    # ============================================
    # AUTH SERVICE TESTS
    # ============================================
    content.append(Paragraph("Skedari 1: AuthService.test.ts", heading_style))
    content.append(Paragraph("Lokacioni: src/__tests__/AuthService.test.ts", subheading_style))
    content.append(Paragraph(
        """Ky skedar permban 5 teste per sherbimin e autentifikimit. Testet fokusohen ne
        funksionet e hashimit dhe verifikimit te fjalekalimeve.""",
        body_style
    ))

    # Test 1
    content.append(Paragraph("Test 1: Formati i Hash", subheading_style))
    test1_code = '''test('should create a hash in the correct format (salt:hash)', () => {
  const password = 'TestPassword123!'
  const hash = authService.hashPassword(password)

  expect(hash).toContain(':')
  const parts = hash.split(':')
  expect(parts).toHaveLength(2)
  expect(parts[0]).toHaveLength(32)  // Salt: 32 hex chars
  expect(parts[1]).toHaveLength(128) // Hash: 128 hex chars
})'''
    code_table1 = Table([[Preformatted(test1_code, code_style)]], colWidths=[17*cm])
    code_table1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table1)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon qe funksioni hashPassword krijon nje hash ne formatin e sakte
        'salt:hash' ku salt ka 32 karaktere hex dhe hash ka 128 karaktere hex.""",
        body_style
    ))

    # Test 2
    content.append(Paragraph("Test 2: Hash te Ndryshem", subheading_style))
    test2_code = '''test('should produce different hashes for the same password', () => {
  const password = 'SamePassword123!'

  const hash1 = authService.hashPassword(password)
  const hash2 = authService.hashPassword(password)

  expect(hash1).not.toBe(hash2)
})'''
    code_table2 = Table([[Preformatted(test2_code, code_style)]], colWidths=[17*cm])
    code_table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table2)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon qe e njejta fjalekalim prodhon hash te ndryshem cdo here
        (per shkak te salt-it random). Kjo siguron qe nese dy perdorues kane te njejten fjalekalim,
        hash-et e tyre ne databaze jane te ndryshme.""",
        body_style
    ))

    # Test 3
    content.append(Paragraph("Test 3: Fjalekalim i Sakte", subheading_style))
    test3_code = '''test('should return true for correct password', () => {
  const password = 'CorrectPassword123!'
  const hash = authService.hashPassword(password)

  const result = authService.verifyPassword(password, hash)

  expect(result).toBe(true)
})'''
    code_table3 = Table([[Preformatted(test3_code, code_style)]], colWidths=[17*cm])
    code_table3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table3)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon qe kur perdoruesi fut fjaleklaimin e sakte, funksioni
        verifyPassword kthen true. Ky eshte funksionaliteti baze i login.""",
        body_style
    ))

    content.append(PageBreak())

    # Test 4
    content.append(Paragraph("Test 4: Fjalekalim i Gabuar", subheading_style))
    test4_code = '''test('should return false for incorrect password', () => {
  const password = 'CorrectPassword123!'
  const wrongPassword = 'WrongPassword456!'
  const hash = authService.hashPassword(password)

  const result = authService.verifyPassword(wrongPassword, hash)

  expect(result).toBe(false)
})'''
    code_table4 = Table([[Preformatted(test4_code, code_style)]], colWidths=[17*cm])
    code_table4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table4)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon qe kur perdoruesi fut fjaleklaimin e gabuar, funksioni
        kthen false. Kjo eshte kritike per sigurine - perdoruesit me fjalekalim te gabuar
        nuk duhet te lejohen te hyjne ne sistem.""",
        body_style
    ))

    # Test 5
    content.append(Paragraph("Test 5: Format i Gabuar Hash", subheading_style))
    test5_code = '''test('should return false for invalid hash format', () => {
  const password = 'TestPassword123!'

  // Test: hash pa ':' separator
  const invalidHash1 = 'invalidhashwithoutcolon'
  expect(authService.verifyPassword(password, invalidHash1)).toBe(false)

  // Test: string bosh
  const invalidHash2 = ''
  expect(authService.verifyPassword(password, invalidHash2)).toBe(false)

  // Test: vetem salt, pa hash
  const invalidHash3 = 'onlysalt:'
  expect(authService.verifyPassword(password, invalidHash3)).toBe(false)
})'''
    code_table5 = Table([[Preformatted(test5_code, code_style)]], colWidths=[17*cm])
    code_table5.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table5)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon qe funksioni trajton formatet e gabuara te hash pa shkaktuar
        error. Nese databaza ka te dhena te korruptuara, aplikacioni nuk duhet te crashoje -
        thjesht duhet te ktheje false.""",
        body_style
    ))

    content.append(Spacer(1, 15))

    # ============================================
    # STRING HELPERS TESTS
    # ============================================
    content.append(Paragraph("Skedari 2: stringHelpers.test.ts", heading_style))
    content.append(Paragraph("Lokacioni: src/__tests__/stringHelpers.test.ts", subheading_style))
    content.append(Paragraph(
        """Ky skedar permban 2 teste per funksionin utilitar capitalize qe konverton
        shkronjen e pare te nje fjale ne te madhe.""",
        body_style
    ))

    # Test 6
    content.append(Paragraph("Test 6: Capitalize Baze", subheading_style))
    test6_code = '''test('should capitalize the first letter of a word', () => {
  expect(capitalize('hello')).toBe('Hello')
  expect(capitalize('world')).toBe('World')
  expect(capitalize('test')).toBe('Test')
})'''
    code_table6 = Table([[Preformatted(test6_code, code_style)]], colWidths=[17*cm])
    code_table6.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table6)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon funksionalitetin baze - fjalet e thjeshta si 'hello'
        duhet te konvertohen ne 'Hello'.""",
        body_style
    ))

    # Test 7
    content.append(Paragraph("Test 7: Edge Cases", subheading_style))
    test7_code = '''test('should handle edge cases correctly', () => {
  expect(capitalize('')).toBe('')           // String bosh
  expect(capitalize('Hello')).toBe('Hello') // Tashme e madhe
  expect(capitalize('a')).toBe('A')         // Nje karakter
  expect(capitalize('HELLO')).toBe('HELLO') // Te gjitha te medha
  expect(capitalize('123test')).toBe('123test') // Fillon me numer
})'''
    code_table7 = Table([[Preformatted(test7_code, code_style)]], colWidths=[17*cm])
    code_table7.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(code_table7)
    content.append(Paragraph(
        """<b>Qellimi:</b> Verifikon qe funksioni trajton rastet speciale (edge cases) pa
        shkaktuar error: string bosh, fjale qe fillon me numer, etj.""",
        body_style
    ))

    content.append(PageBreak())

    # ============================================
    # SUMMARY TABLE
    # ============================================
    content.append(Paragraph("Permbledhje e Testeve", heading_style))

    summary_table_data = [
        ["#", "Emri i Testit", "Skedari", "Cfare Teston"],
        ["1", "Hash format", "AuthService.test.ts", "Formati salt:hash eshte i sakte"],
        ["2", "Different hashes", "AuthService.test.ts", "Salt random prodhon hash te ndryshem"],
        ["3", "Correct password", "AuthService.test.ts", "Fjalekalimi i sakte verifikohet"],
        ["4", "Incorrect password", "AuthService.test.ts", "Fjalekalimi i gabuar refuzohet"],
        ["5", "Invalid hash", "AuthService.test.ts", "Formatet e gabuara trajtohen"],
        ["6", "Capitalize basic", "stringHelpers.test.ts", "Shkronja e pare behet e madhe"],
        ["7", "Edge cases", "stringHelpers.test.ts", "Rastet speciale trajtohen"],
    ]

    summary_table = Table(summary_table_data, colWidths=[0.8*cm, 3*cm, 4*cm, 6*cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 5), colors.HexColor('#E3F2FD')),
        ('BACKGROUND', (0, 6), (-1, 7), colors.HexColor('#E8F5E9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(summary_table)
    content.append(Spacer(1, 20))

    # ============================================
    # CODE COVERAGE
    # ============================================
    content.append(Paragraph("Code Coverage - Mbulimi i Kodit", heading_style))
    content.append(Paragraph(
        """<b>Code Coverage</b> mat sa perqind e kodit ekzekutohet gjate testeve:""",
        body_style
    ))

    coverage_data = [
        ["Skedari", "Statements", "Branches", "Functions", "Lines"],
        ["stringHelpers.ts", "100%", "100%", "100%", "100%"],
        ["AuthService.ts", "22.03%", "13.33%", "20%", "20.68%"],
    ]

    coverage_table = Table(coverage_data, colWidths=[4*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    coverage_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#C8E6C9')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF9C4')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(coverage_table)
    content.append(Spacer(1, 15))

    # Commands
    content.append(Paragraph("Komandat per Ekzekutim", heading_style))
    commands = [
        ["Komanda", "Pershkrimi"],
        ["npm test", "Ekzekuton te gjitha testet"],
        ["npm run test:coverage", "Gjeneron coverage report"],
    ]

    cmd_table = Table(commands, colWidths=[5*cm, 9*cm])
    cmd_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#673AB7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#EDE7F6')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#B39DDB')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(cmd_table)

    # Build PDF
    doc.build(content)
    print("PDF generated successfully: tests_documentation.pdf")


if __name__ == '__main__':
    create_pdf()
