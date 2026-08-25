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

  doc.y = infoRow2 + 30
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
  doc.y += 15

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

  doc.y = netBoxY + 60
  doc.font('Helvetica').fontSize(8).fillColor('#888').text('This is a system-generated salary slip and does not require a signature.', 50, doc.y, { width: 495, align: 'center' })

  doc.end()
  return buffer
}

export default { generateSalarySlipPdf }
