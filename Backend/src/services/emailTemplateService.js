function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
}

export function renderTemplate(template, variables = {}) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => escapeHtml(variables[key]))
}

export function offerLetterTemplate(variables) {
  const text = `Dear {{employeeName}},\n\nWe are pleased to offer you the position of {{jobTitle}} at {{companyName}}.\nYour joining date will be {{joiningDate}}.\nYour annual CTC will be {{annualCTC}} and monthly salary will be {{monthlySalary}}.\n\nSalary Breakdown:\n{{salaryBreakdown}}\n\nWe look forward to having you as part of our team.\n\nRegards,\n{{senderName}}\n{{companyName}}`
  return { subject: `Offer Letter - ${variables.jobTitle || 'Position'} - ${variables.companyName || 'MediFlow'}`, text: renderTemplate(text, variables), html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>Dear ${escapeHtml(variables.employeeName)},</p><p>We are pleased to offer you the position of <strong>${escapeHtml(variables.jobTitle)}</strong> at <strong>${escapeHtml(variables.companyName)}</strong>.</p><p>Joining date: ${escapeHtml(variables.joiningDate)}<br>Annual CTC: ${escapeHtml(variables.annualCTC)}<br>Monthly salary: ${escapeHtml(variables.monthlySalary)}</p><h3>Salary Breakdown</h3><p>${escapeHtml(variables.salaryBreakdown).replace(/\n/g, '<br>')}</p><p>We look forward to having you as part of our team.</p><p>Regards,<br>${escapeHtml(variables.senderName)}<br>${escapeHtml(variables.companyName)}</p></div>` }
}

export function promotionTemplate(variables) {
  const noteLine = variables.note ? `\n${variables.note}\n` : ''
  const text = `Dear {{employeeName}},\n\nCongratulations! You have been promoted from {{previousDesignation}} to {{designation}}, effective {{effectiveDate}}.${noteLine}\nRegards,\n{{senderName}}`
  return { subject: `Congratulations on Your Promotion to ${variables.designation || 'Your New Role'}`, text: renderTemplate(text, variables), html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>Dear ${escapeHtml(variables.employeeName)},</p><p>Congratulations! You have been promoted from <strong>${escapeHtml(variables.previousDesignation)}</strong> to <strong>${escapeHtml(variables.designation)}</strong>, effective ${escapeHtml(variables.effectiveDate)}.</p>${variables.note ? `<p>${escapeHtml(variables.note)}</p>` : ''}<p>Congratulations once again on this well-deserved achievement.</p><p>Regards,<br>${escapeHtml(variables.senderName)}</p></div>` }
}

export function salarySlipTemplate(variables) {
  const text = `Hello {{employeeName}},\n\nYour salary slip for {{month}} {{year}} is attached to this email as a PDF.\nNet Salary: {{netSalary}}\n\nYou can also log in to MediFlow to view your complete salary slip.\n\nRegards,\n{{companyName}}`
  return { subject: `Salary Slip - ${variables.month} ${variables.year} - ${variables.companyName}`, text: renderTemplate(text, variables), html: `<p>Hello ${escapeHtml(variables.employeeName)},</p><p>Your salary slip for <strong>${escapeHtml(variables.month)} ${escapeHtml(variables.year)}</strong> is attached to this email as a PDF.</p><p>Net Salary: <strong>${escapeHtml(variables.netSalary)}</strong></p><p>You can also log in to MediFlow to view your complete salary slip.</p><p>Regards,<br>${escapeHtml(variables.companyName)}</p>` }
}
