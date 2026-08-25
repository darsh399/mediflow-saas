import PDFDocument from 'pdfkit'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function streamToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

function sectionDivider(doc, label) {
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
  doc.y += 12
  if (label) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#333').text(label, 50, doc.y)
    doc.fillColor('#000')
    doc.y += 18
  }
}

export async function generateSalarySlipPdf({ slip, employee, company }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const buffer = streamToBuffer(doc)
  const monthName = MONTH_NAMES[slip.month - 1] || slip.month

  doc.fontSize(18).font('Helvetica-Bold').text(company?.companyName || 'Company', { align: 'center' })
  doc.fontSize(12).font('Helvetica').text('Salary Slip', { align: 'center' })
  doc.fontSize(10).fillColor('#555').text(`${monthName} ${slip.year}`, { align: 'center' })
  doc.fillColor('#000')
  doc.moveDown(1.5)

  const infoRow1 = doc.y
  doc.fontSize(10).font('Helvetica-Bold').text('Employee Name:', 50, infoRow1)
  doc.font('Helvetica').text(employee?.name || '-', 170, infoRow1)
  doc.font('Helvetica-Bold').text('Email:', 320, infoRow1)
  doc.font('Helvetica').text(employee?.email || '-', 370, infoRow1)

  const infoRow2 = infoRow1 + 20
  doc.font('Helvetica-Bold').text('Employee ID:', 50, infoRow2)
  doc.font('Helvetica').text(employee?.employeeId || '-', 170, infoRow2)
  doc.font('Helvetica-Bold').text('Pay Period:', 320, infoRow2)
  doc.font('Helvetica').text(`${monthName} ${slip.year}`, 370, infoRow2)

  const infoRow3 = infoRow2 + 20
  doc.font('Helvetica-Bold').text('Designation:', 50, infoRow3)
  doc.font('Helvetica').text(employee?.profile?.jobDetails?.designation || '-', 170, infoRow3)

  doc.y = infoRow3 + 25
  sectionDivider(doc)

  const bank = slip.bankDetailsSnapshot
  if (bank?.accountNumber) {
    doc.font('Helvetica-Bold').fontSize(11).text('Bank Details', 50, doc.y)
    doc.y += 18
    const bankRow1 = doc.y
    doc.font('Helvetica-Bold').fontSize(10).text('Bank:', 50, bankRow1)
    doc.font('Helvetica').text(bank.bankName || '-', 170, bankRow1)
    doc.font('Helvetica-Bold').text('Account:', 320, bankRow1)
    doc.font('Helvetica').text(bank.accountNumber || '-', 380, bankRow1)
    const bankRow2 = bankRow1 + 20
    doc.font('Helvetica-Bold').text('IFSC:', 50, bankRow2)
    doc.font('Helvetica').text(bank.ifscCode || '-', 170, bankRow2)
    doc.font('Helvetica-Bold').text('Branch:', 320, bankRow2)
    doc.font('Helvetica').text(bank.branchName || '-', 380, bankRow2)
    doc.y = bankRow2 + 25
    sectionDivider(doc)
  }

  const earnings = (slip.components || []).filter((item) => item.type === 'EARNING')
  const deductions = (slip.components || []).filter((item) => item.type === 'DEDUCTION')

  const colEarnLabel = 50, colEarnAmount = 250, colDeductLabel = 310, colDeductAmount = 500
  const headerY = doc.y
  doc.font('Helvetica-Bold').fontSize(11)
  doc.text('Earnings', colEarnLabel, headerY)
  doc.text('Deductions', colDeductLabel, headerY)

  let y = headerY + 20
  const rows = Math.max(earnings.length, deductions.length, 1)
  doc.font('Helvetica').fontSize(10)
  for (let index = 0; index < rows; index += 1) {
    const earning = earnings[index]
    const deduction = deductions[index]
    if (earning) { doc.text(earning.name, colEarnLabel, y, { width: 180 }); doc.text(money(earning.amount), colEarnAmount, y, { width: 80, align: 'right' }) }
    if (deduction) { doc.text(deduction.name, colDeductLabel, y, { width: 160 }); doc.text(money(deduction.amount), colDeductAmount, y, { width: 45, align: 'right' }) }
    y += 20
  }

  if (slip.lopDays > 0) {
    doc.fontSize(9).fillColor('#a15c00').text(`LOP Days: ${slip.lopDays}`, colDeductLabel, y, { width: 200 })
    doc.fillColor('#000').fontSize(10)
    y += 18
  }

  doc.y = y + 5
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
  doc.y += 15

  const totalsY = doc.y
  doc.font('Helvetica-Bold').fontSize(10)
  doc.text('Gross Salary', colEarnLabel, totalsY)
  doc.text(money(slip.grossSalary), colEarnAmount, totalsY, { width: 80, align: 'right' })
  doc.text('Total Deductions', colDeductLabel, totalsY)
  doc.text(money(slip.totalDeductions), colDeductAmount, totalsY, { width: 45, align: 'right' })

  doc.y = totalsY + 35
  const netBoxY = doc.y
  doc.rect(50, netBoxY, 495, 34).fillAndStroke('#f2f6ff', '#d0d9ec')
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(12)
  doc.text('Net Salary', 65, netBoxY + 11)
  doc.text(money(slip.netSalary), 390, netBoxY + 11, { width: 145, align: 'right' })

  doc.y = netBoxY + 50
  doc.font('Helvetica').fontSize(8).fillColor('#888')
  doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, doc.y, { width: 495, align: 'center' })
  doc.y += 14
  doc.text('This is a system-generated salary slip and does not require a signature.', 50, doc.y, { width: 495, align: 'center' })

  doc.end()
  return buffer
}

export async function generateOfferLetterPdf({ offer, employee, company }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const buffer = streamToBuffer(doc)
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const joiningDate = offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'
  const snapshot = offer.salarySnapshot || {}

  doc.fontSize(20).font('Helvetica-Bold').text(company?.companyName || 'Company', { align: 'center' })
  if (company?.companyAddress) doc.fontSize(9).font('Helvetica').fillColor('#555').text(company.companyAddress, { align: 'center' })
  if (company?.companyEmail || company?.companyMobile) doc.fontSize(9).text([company.companyEmail, company.companyMobile].filter(Boolean).join(' | '), { align: 'center' })
  doc.fillColor('#000')
  doc.moveDown(1)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
  doc.moveDown(1)

  doc.fontSize(15).font('Helvetica-Bold').text('OFFER LETTER', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(9).font('Helvetica').fillColor('#555').text(`Date: ${today}`, { align: 'center' })
  doc.fillColor('#000')
  doc.moveDown(1.2)

  doc.fontSize(10).font('Helvetica')
  doc.text(`Dear ${employee?.name || 'Candidate'},`, 50, doc.y)
  doc.moveDown(0.6)
  doc.text(`We are pleased to offer you the position of `, { continued: true }).font('Helvetica-Bold').text(`${offer.jobTitle || '-'}`, { continued: true }).font('Helvetica').text(` at `, { continued: true }).font('Helvetica-Bold').text(`${company?.companyName || 'our company'}`, { continued: true }).font('Helvetica').text('.')
  doc.moveDown(0.8)

  doc.y += 5
  sectionDivider(doc, 'Position Details')
  const posRow1 = doc.y
  doc.font('Helvetica-Bold').fontSize(10).text('Department:', 50, posRow1)
  doc.font('Helvetica').text(offer.department || '-', 170, posRow1)
  doc.font('Helvetica-Bold').text('Employment Type:', 320, posRow1)
  doc.font('Helvetica').text(offer.employmentType || '-', 430, posRow1)
  const posRow2 = posRow1 + 20
  doc.font('Helvetica-Bold').text('Joining Date:', 50, posRow2)
  doc.font('Helvetica').text(joiningDate, 170, posRow2)
  doc.y = posRow2 + 25

  sectionDivider(doc, 'Compensation')
  const compRow1 = doc.y
  doc.font('Helvetica-Bold').fontSize(10).text('Annual CTC:', 50, compRow1)
  doc.font('Helvetica').text(money(snapshot.annualCtc), 170, compRow1)
  doc.font('Helvetica-Bold').text('Monthly CTC:', 320, compRow1)
  doc.font('Helvetica').text(money(snapshot.monthlyCtc), 430, compRow1)
  doc.y = compRow1 + 25

  const earnings = (snapshot.components || []).filter((item) => item.type === 'EARNING')
  if (earnings.length) {
    doc.font('Helvetica-Bold').fontSize(10).text('Salary Breakdown', 50, doc.y)
    doc.y += 18
    const tableTop = doc.y
    doc.font('Helvetica-Bold').fontSize(9).text('Component', 50, tableTop).text('Monthly Amount', 400, tableTop, { width: 145, align: 'right' })
    doc.y += 15
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke()
    doc.y += 8
    doc.font('Helvetica').fontSize(9)
    earnings.forEach((item) => {
      doc.text(item.name, 50, doc.y, { width: 300 })
      doc.text(money(item.amount), 400, doc.y, { width: 145, align: 'right' })
      doc.y += 16
    })
    doc.y += 10
  }

  if (doc.y > 650) doc.addPage()
  sectionDivider(doc, 'Terms & Conditions')
  doc.font('Helvetica').fontSize(9).fillColor('#333')
  const terms = offer.additionalTerms?.trim()
    ? offer.additionalTerms
    : 'This offer is subject to verification of documents and references provided by you, and to your continued satisfactory performance during the probation period. Your employment will be governed by the company policies in effect from time to time.'
  doc.text(terms, 50, doc.y, { width: 495, align: 'justify' })
  doc.fillColor('#000')
  doc.y += 20

  if (doc.y > 680) doc.addPage()
  doc.y = Math.max(doc.y, 680)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
  doc.y += 15
  doc.font('Helvetica').fontSize(10).text('We look forward to welcoming you to the team.', 50, doc.y)
  doc.y += 30
  doc.font('Helvetica-Bold').text('For ' + (company?.companyName || 'the Company'), 50, doc.y)
  doc.y += 35
  doc.font('Helvetica').fontSize(9).fillColor('#555').text('Authorized Signatory', 50, doc.y)
  doc.fillColor('#000')

  doc.end()
  return buffer
}

export default { generateSalarySlipPdf, generateOfferLetterPdf }
