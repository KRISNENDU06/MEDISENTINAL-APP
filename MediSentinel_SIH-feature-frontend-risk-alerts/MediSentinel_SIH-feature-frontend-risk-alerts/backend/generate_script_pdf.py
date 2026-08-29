import os

pdf_path = r'c:\Users\lenovo\OneDrive\Desktop\MEDISENTINAL APP\MEDISENTINEL_3Min_Demo_Script.pdf'
pdf_path_project = r'c:\Users\lenovo\OneDrive\Desktop\MEDISENTINAL APP\sih project\MEDISENTINEL_3Min_Demo_Script.pdf'

# Build a well-formatted PDF file using raw PDF 1.4 format
def create_pdf(filename):
    pages = []
    
    # Page 1: Title, Overview, Timestamps, Scene 1 & Scene 2
    p1_text = [
        # Header
        ('BT /F2 20 Tf 40 790 Td (MEDISENTINEL - 3-Minute Demo Video Script) Tj ET', ''),
        ('BT /F3 11 Tf 40 770 Td (Tagline: "YOUR HEALTH, OUR WATCH"  |  Target Duration: 3:00 Mins  |  Word Count: ~390 Words) Tj ET', ''),
        ('0.2 0.4 0.8 RG 40 760 m 555 760 l S', ''),
        
        # Purpose & Chapters
        ('BT /F2 13 Tf 40 740 Td (1. VIDEO TIMELINE & CHAPTER BREAKDOWN) Tj ET', ''),
        ('BT /F1 10 Tf 50 722 Td (0:00 - 0:30  |  Scene 1: The Outbreak Lag & Problem Statement) Tj ET', ''),
        ('BT /F1 10 Tf 50 706 Td (0:30 - 1:05  |  Scene 2: 4-Factor AI Risk Engine & 30-District Geospatial Ward Map) Tj ET', ''),
        ('BT /F1 10 Tf 50 690 Td (1:05 - 1:45  |  Scene 3: Official Command, RRT Dispatch & Multilingual Directives in Odia/Hindi/EN) Tj ET', ''),
        ('BT /F1 10 Tf 50 674 Td (1:45 - 2:25  |  Scene 4: Citizen Portal (Symptom Checker, Medicine Locator) & Outbreak Lab) Tj ET', ''),
        ('BT /F1 10 Tf 50 658 Td (2:25 - 3:00  |  Scene 5: 256-Bit Security, Sub-10ms Performance & Closing Punchline) Tj ET', ''),
        ('0.8 0.8 0.8 RG 40 645 m 555 645 l S', ''),

        # Scene 1
        ('BT /F2 12 Tf 40 625 Td (SCENE 1: THE PROBLEM & INTRODUCTION (0:00 - 0:30)) Tj ET', ''),
        ('BT /F3 9.5 Tf 40 610 Td ([ON SCREEN]: Show MEDISENTINEL full dashboard. Pan across live metric cards & glowing Odisha map.) Tj ET', ''),
        ('BT /F1 10 Tf 40 592 Td ("Every major epidemic starts with early signals: a sudden surge in pharmacy fever medicine) Tj ET', ''),
        ('BT /F1 10 Tf 40 578 Td (sales, crowded primary clinics, or contaminated municipal water.) Tj ET', ''),
        ('BT /F1 10 Tf 40 560 Td (By the time hospital lab reports confirm an outbreak 10 to 14 days later, it is already too late.) Tj ET', ''),
        ('BT /F1 10 Tf 40 542 Td (Meet MEDISENTINEL - an AI-powered Syndromic Surveillance & Epidemic Early Warning Platform) Tj ET', ''),
        ('BT /F1 10 Tf 40 528 Td (that detects outbreaks 5 to 10 days before traditional lab diagnosis.") Tj ET', ''),
        ('0.8 0.8 0.8 RG 40 515 m 515 515 l S', ''),

        # Scene 2
        ('BT /F2 12 Tf 40 495 Td (SCENE 2: 4-FACTOR RISK ENGINE & 30-DISTRICT WARD MAP (0:30 - 1:05)) Tj ET', ''),
        ('BT /F3 9.5 Tf 40 480 Td ([ON SCREEN]: Zoom into Geospatial Ward Map. Select Khurda/Angul district and click Saheed Nagar Ward 29.) Tj ET', ''),
        ('BT /F1 10 Tf 40 462 Td ("MEDISENTINEL monitors all 30 districts of Odisha across 90 real-time wards.) Tj ET', ''),
        ('BT /F1 10 Tf 40 446 Td (Our mathematical engine continuously evaluates four key signals:) Tj ET', ''),
        ('BT /F1 10 Tf 50 430 Td (- 30%: Pharmacy Over-the-Counter Antipyretic Demand) Tj ET', ''),
        ('BT /F1 10 Tf 50 416 Td (- 30%: Fever and Respiratory OPD Consultations) Tj ET', ''),
        ('BT /F1 10 Tf 50 402 Td (- 20%: Signal Persistence over consecutive days) Tj ET', ''),
        ('BT /F1 10 Tf 50 388 Td (- 20%: Spatial Diffusion to neighboring wards.) Tj ET', ''),
        ('BT /F1 10 Tf 40 370 Td (Clicking any ward provides instant drill-down telemetry, historical baselines, and risk scores.") Tj ET', ''),
        ('0.8 0.8 0.8 RG 40 355 m 555 355 l S', ''),

        # Footer
        ('BT /F3 9 Tf 40 40 Td (MEDISENTINEL Demo Script  |  Page 1 of 2  |  Smart India Hackathon Presentation) Tj ET', ''),
    ]

    # Page 2: Scene 3, Scene 4, Scene 5 & Recording Tips
    p2_text = [
        # Scene 3
        ('BT /F2 12 Tf 40 790 Td (SCENE 3: HEALTH OFFICIAL COMMAND & MULTILINGUAL DIRECTIVES (1:05 - 1:45)) Tj ET', ''),
        ('BT /F3 9.5 Tf 40 775 Td ([ON SCREEN]: Switch to Health Official persona. In Alert Hub click Dispatch RRT. Play Odia/Hindi voice audio.) Tj ET', ''),
        ('BT /F1 10 Tf 40 757 Td ("For public health officials, the Early Warning Hub triggers immediate action: with one click,) Tj ET', ''),
        ('BT /F1 10 Tf 40 743 Td (authorities can acknowledge anomalies, deploy Rapid Response Teams (RRT), or chlorinate water sources.) Tj ET', ''),
        ('BT /F1 10 Tf 40 725 Td (To overcome language barriers, MEDISENTINEL synthesizes official field directives into live) Tj ET', ''),
        ('BT /F1 10 Tf 40 711 Td (regional voice bulletins in English, Odia, and Hindi.") Tj ET', ''),
        ('0.8 0.8 0.8 RG 40 698 m 555 698 l S', ''),

        # Scene 4
        ('BT /F2 12 Tf 40 678 Td (SCENE 4: CITIZEN PORTAL & OUTBREAK SIMULATION LAB (1:45 - 2:25)) Tj ET', ''),
        ('BT /F3 9.5 Tf 40 663 Td ([ON SCREEN]: Switch to Citizen persona. Open Symptom Checker (triage) & Outbreak Lab (curve flattening).) Tj ET', ''),
        ('BT /F1 10 Tf 40 645 Td ("For the public, the Citizen Portal provides:) Tj ET', ''),
        ('BT /F1 10 Tf 50 629 Td (1. An AI Symptom Checker for 10-second personal risk triage.) Tj ET', ''),
        ('BT /F1 10 Tf 50 613 Td (2. A Care and Medicine Locator showing verified 24/7 hospitals and pharmacy stocks.) Tj ET', ''),
        ('BT /F1 10 Tf 50 597 Td (3. An Anonymous Community Watch protected by Differential Privacy.) Tj ET', ''),
        ('BT /F1 10 Tf 40 579 Td (Furthermore, policymakers can use our Outbreak Lab to simulate interventions - like mask mandates) Tj ET', ''),
        ('BT /F1 10 Tf 40 565 Td (and water treatment - to see live epidemic curve flattening.") Tj ET', ''),
        ('0.8 0.8 0.8 RG 40 552 m 555 552 l S', ''),

        # Scene 5
        ('BT /F2 12 Tf 40 532 Td (SCENE 5: PERFORMANCE, SECURITY & CONCLUSION (2:25 - 3:00)) Tj ET', ''),
        ('BT /F3 9.5 Tf 40 517 Td ([ON SCREEN]: Open Access Portal Modal (show 256-bit encryption badge & OTP options). Pan to full dashboard.) Tj ET', ''),
        ('BT /F1 10 Tf 40 499 Td ("Under the hood, MEDISENTINEL is secured with 256-bit PBKDF2/SHA-256 encryption, Role-Based) Tj ET', ''),
        ('BT /F1 10 Tf 40 485 Td (Access Control, and in-memory caching that delivers real-time data in under 10 milliseconds.) Tj ET', ''),
        ('BT /F1 10 Tf 40 467 Td (MEDISENTINEL shifts healthcare from reactive treatment to proactive community protection.) Tj ET', ''),
        ('BT /F2 10.5 Tf 40 445 Td (MEDISENTINEL: YOUR HEALTH, OUR WATCH. Thank you!") Tj ET', ''),
        ('0.2 0.4 0.8 RG 40 432 m 555 432 l S', ''),

        # Recording Tips
        ('BT /F2 12 Tf 40 410 Td (PRACTICAL RECORDING CHECKLIST FOR HACKATHON JURY) Tj ET', ''),
        ('BT /F1 9.5 Tf 50 392 Td (1. Full Screen: Launch browser in full-screen mode (F11) at 1920x1080 resolution.) Tj ET', ''),
        ('BT /F1 9.5 Tf 50 376 Td (2. Persona Showcase: Use the 1-click evaluation switcher (Admin -> Official -> Citizen) in the login portal.) Tj ET', ''),
        ('BT /F1 9.5 Tf 50 360 Td (3. Audio Demonstration: Let the Odia and Hindi audio bulletins play for 3-4 seconds during Scene 3.) Tj ET', ''),
        ('BT /F1 9.5 Tf 50 344 Td (4. Interactive Interventions: Adjust the compliance sliders in Outbreak Lab to show real-time transmission drop.) Tj ET', ''),
        ('BT /F1 9.5 Tf 50 328 Td (5. Pacing: Rehearse with a stopwatch at ~130 words/minute to finish precisely at 3:00 minutes.) Tj ET', ''),

        # Footer
        ('BT /F3 9 Tf 40 40 Td (MEDISENTINEL Demo Script  |  Page 2 of 2  |  Official Presentation Guide) Tj ET', ''),
    ]

    def build_page_stream(cmds):
        stream_content = '\n'.join([c[0] for c in cmds])
        return stream_content

    p1_stream = build_page_stream(p1_text)
    p2_stream = build_page_stream(p2_text)

    # Assemble objects
    objects = []
    # 1: Catalog
    objects.append('<< /Type /Catalog /Pages 2 0 R >>')
    # 2: Pages
    objects.append('<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>')
    # 3: Page 1
    objects.append('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R >> >> >>')
    # 4: Page 2
    objects.append('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R >> >> >>')
    # 5: Contents Page 1
    objects.append(f'<< /Length {len(p1_stream.encode("utf-8"))} >>\nstream\n{p1_stream}\nendstream')
    # 6: Contents Page 2
    objects.append(f'<< /Length {len(p2_stream.encode("utf-8"))} >>\nstream\n{p2_stream}\nendstream')
    # 7: Font Helvetica (Regular)
    objects.append('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    # 8: Font Helvetica-Bold
    objects.append('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
    # 9: Font Helvetica-Oblique (Italic)
    objects.append('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>')

    # Calculate xref
    body = '%PDF-1.4\n'
    xref = ['xref\n0 10\n0000000000 65535 f \n']
    for i, obj in enumerate(objects, 1):
        offset = len(body.encode('utf-8'))
        xref.append(f'{offset:010d} 00000 n \n')
        body += f'{i} 0 obj\n{obj}\nendobj\n'

    xref_offset = len(body.encode('utf-8'))
    body += ''.join(xref)
    body += f'trailer\n<< /Size 10 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF'

    with open(filename, 'wb') as f:
        f.write(body.encode('utf-8'))
    print(f'Created {filename} successfully ({len(body)} bytes).')

create_pdf(pdf_path)
create_pdf(pdf_path_project)
