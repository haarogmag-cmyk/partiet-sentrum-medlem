import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function generateCertificatePDF(member: any, orgName: string) {
  // Opprett et nytt dokument
  const pdfDoc = await PDFDocument.create()
  
  // Legg til en side (størrelse som et bredt kort)
  const page = pdfDoc.addPage([600, 350])
  const { width, height } = page.getSize()
  
  // Last inn standard fonter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Farger
  const psRed = rgb(0.79, 0.22, 0.38) // #c93960
  const usPurple = rgb(0.54, 0.39, 0.82) // #8a63d2
  const brandColor = orgName.includes('Unge') ? usPurple : psRed

  // 1. BAKGRUNN & RAMME
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: rgb(0.98, 0.98, 0.97)
  })

  // Topp-stripe
  page.drawRectangle({
    x: 0, y: height - 80, width, height: 80,
    color: brandColor
  })

  // 2. TITTEL (Hvit tekst på farget bakgrunn)
  page.drawText('MEDLEMSBEVIS', {
    x: 40, y: height - 50,
    size: 24, font: fontBold, color: rgb(1, 1, 1)
  })

  const currentYear = new Date().getFullYear().toString()
  page.drawText(currentYear, {
    x: width - 100, y: height - 50,
    size: 24, font: fontBold, color: rgb(1, 1, 1)
  })

  // 3. MEDLEMSINFO
  const startY = height - 140
  
  // Navn
  page.drawText('NAVN', { x: 40, y: startY, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
  page.drawText(`${member.first_name} ${member.last_name}`, { 
      x: 40, y: startY - 20, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.1) 
  })

  // Medlemsnummer
  page.drawText('MEDLEMSNUMMER', { x: 40, y: startY - 60, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
  page.drawText(member.id.slice(0, 8).toUpperCase(), { 
      x: 40, y: startY - 80, size: 14, font, color: rgb(0.1, 0.1, 0.1) 
  })

  // Organisasjon
  page.drawText('ORGANISASJON', { x: 300, y: startY, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
  page.drawText(orgName, { 
      x: 300, y: startY - 20, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) 
  })

  // Lokallag (hvis finnes)
  const lokallag = orgName.includes('Unge') ? member.lokallag_navn_us : member.lokallag_navn
  if (lokallag) {
    page.drawText('LOKALLAG', { x: 300, y: startY - 60, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(lokallag.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', ''), { 
        x: 300, y: startY - 80, size: 14, font, color: rgb(0.1, 0.1, 0.1) 
    })
  }

  // 4. STATUS-STEMPEL
  const isPaid = orgName.includes('Unge') 
    ? member.payment_status_us === 'active' 
    : member.payment_status_ps === 'active';

  const statusText = isPaid ? 'GYLDIG MEDLEM' : 'IKKE BETALT';
  const statusColor = isPaid ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);

  // Tegn en boks rundt status
  page.drawRectangle({
      x: 40, y: 50, width: 150, height: 30,
      color: isPaid ? rgb(0.9, 1, 0.9) : rgb(1, 0.9, 0.9),
      borderColor: statusColor,
      borderWidth: 1
  })
  
  page.drawText(statusText, {
      x: 55, y: 60,
      size: 12, font: fontBold, color: statusColor
  })

  // 5. FOOTER
  const today = new Date().toLocaleDateString('no-NO')
  page.drawText(`Generert: ${today}`, {
    x: width - 150, y: 30,
    size: 9, font, color: rgb(0.7, 0.7, 0.7)
  })

  // Returner bytes
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}