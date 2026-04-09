const PDFDocument = require('pdfkit');

/**
 * Generate an event attendance certificate PDF
 * @param {Object} opts - { userName, eventTitle, eventDate, eventType, points }
 * @returns {Buffer}
 */
const generateCertificate = (opts) => {
  return new Promise((resolve, reject) => {
    const { userName, eventTitle, eventDate, eventType = 'Event', points = 0 } = opts;

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // ── Background ──────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill('#000000');

    // ── Outer border ────────────────────────────────────────────────────────
    doc.rect(20, 20, W - 40, H - 40)
      .lineWidth(2)
      .strokeColor('#39FF14')
      .stroke();

    doc.rect(26, 26, W - 52, H - 52)
      .lineWidth(0.5)
      .strokeColor('#39FF1440')
      .stroke();

    // ── Corner decorations ───────────────────────────────────────────────────
    const corners = [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]];
    corners.forEach(([x, y]) => {
      doc.circle(x, y, 4).fill('#39FF14');
    });

    // ── Club Logo / Name ─────────────────────────────────────────────────────
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#555555')
      .text('GCETTB OFFICIAL TECH CLUB', 0, 45, { align: 'center', characterSpacing: 4 });

    doc.font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#39FF14')
      .text('TECHNOPHILES', 0, 60, { align: 'center', characterSpacing: 6 });

    // ── Neon underline ───────────────────────────────────────────────────────
    doc.moveTo(W / 2 - 100, 100)
      .lineTo(W / 2 + 100, 100)
      .lineWidth(1)
      .strokeColor('#39FF14')
      .stroke();

    // ── Certificate of Participation ─────────────────────────────────────────
    doc.font('Helvetica')
      .fontSize(14)
      .fillColor('#888888')
      .text('CERTIFICATE OF PARTICIPATION', 0, 115, { align: 'center', characterSpacing: 3 });

    // ── This is to certify ───────────────────────────────────────────────────
    doc.font('Helvetica')
      .fontSize(13)
      .fillColor('#aaaaaa')
      .text('This is to certify that', 0, 160, { align: 'center' });

    // ── Name ─────────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold')
      .fontSize(36)
      .fillColor('#FFFFFF')
      .text(userName, 0, 182, { align: 'center' });

    // ── Name underline ───────────────────────────────────────────────────────
    const nameWidth = Math.min(doc.widthOfString(userName, { fontSize: 36 }) + 40, 400);
    doc.moveTo(W / 2 - nameWidth / 2, 228)
      .lineTo(W / 2 + nameWidth / 2, 228)
      .lineWidth(0.5)
      .strokeColor('#39FF1460')
      .stroke();

    // ── Has participated in ───────────────────────────────────────────────────
    doc.font('Helvetica')
      .fontSize(13)
      .fillColor('#aaaaaa')
      .text(`has successfully participated in the`, 0, 242, { align: 'center' });

    // ── Event type ────────────────────────────────────────────────────────────
    doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#39FF14')
      .text(eventType.toUpperCase(), 0, 265, { align: 'center', characterSpacing: 2 });

    // ── Event name ────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#FFFFFF')
      .text(`"${eventTitle}"`, 0, 282, { align: 'center' });

    // ── Date ──────────────────────────────────────────────────────────────────
    const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    doc.font('Helvetica')
      .fontSize(12)
      .fillColor('#888888')
      .text(`held on ${formattedDate}`, 0, 315, { align: 'center' });

    // ── Points badge ──────────────────────────────────────────────────────────
    if (points > 0) {
      const badgeX = W / 2 - 60;
      const badgeY = 345;
      doc.roundedRect(badgeX, badgeY, 120, 28, 4)
        .fillAndStroke('#39FF1415', '#39FF1440');
      doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#39FF14')
        .text(`+${points} POINTS EARNED`, badgeX, badgeY + 8, { width: 120, align: 'center' });
    }

    // ── Signature lines ───────────────────────────────────────────────────────
    const sigY = H - 100;

    // Left signature
    doc.moveTo(80, sigY).lineTo(220, sigY).lineWidth(0.5).strokeColor('#333').stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#777').text('Club President', 80, sigY + 8, { width: 140, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#555').text('Technophiles', 80, sigY + 22, { width: 140, align: 'center' });

    // Right signature
    doc.moveTo(W - 220, sigY).lineTo(W - 80, sigY).lineWidth(0.5).strokeColor('#333').stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#777').text('Faculty Advisor', W - 220, sigY + 8, { width: 140, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#555').text('GCETTB', W - 220, sigY + 22, { width: 140, align: 'center' });

    // ── Certificate ID ────────────────────────────────────────────────────────
    const certId = `TECH-${Date.now().toString(36).toUpperCase()}`;
    doc.font('Helvetica').fontSize(8).fillColor('#333')
      .text(`Certificate ID: ${certId}`, 0, H - 40, { align: 'center' });

    doc.end();
  });
};

/**
 * Generate a course completion certificate
 */
const generateCourseCertificate = (opts) => {
  const { userName, courseTitle, category, completedDate, points } = opts;
  return generateCertificate({
    userName,
    eventTitle: courseTitle,
    eventDate: completedDate,
    eventType: `${(category || 'Course').replace('_', ' ').toUpperCase()} COURSE COMPLETION`,
    points,
  });
};

module.exports = { generateCertificate, generateCourseCertificate };
