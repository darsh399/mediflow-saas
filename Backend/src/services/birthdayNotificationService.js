import Doctor from '../models/Doctor.js'
import Company from '../models/Company.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import mailService from './mailService.js'
import cron from 'node-cron'

const RECIPIENT_ROLES = ['company_owner', 'hr_manager']
function datePartsInTimezone(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  return Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]))
}

function isBirthday(dateOfBirth, today) {
  if (!(dateOfBirth instanceof Date) || Number.isNaN(dateOfBirth.getTime())) return false
  return dateOfBirth.getUTCMonth() + 1 === Number(today.month) && dateOfBirth.getUTCDate() === Number(today.day)
}

export async function processDoctorBirthdays(now = new Date()) {
  const today = datePartsInTimezone(now)
  const birthdayDate = `${today.year}-${today.month}-${today.day}`
  const doctors = await Doctor.find({ dateOfBirth: { $type: 'date' } }).select('_id companyId name dateOfBirth').lean()
  let created = 0

  for (const doctor of doctors) {
    try {
      if (!isBirthday(doctor.dateOfBirth, today)) continue
      const company = await Company.findOne({ _id: doctor.companyId, isActive: true, status: 'ACTIVE' }).select('_id').lean()
      if (!company) continue

      const recipients = await User.find({
        companyId: company._id,
        role: { $in: RECIPIENT_ROLES },
        active: true,
        blocked: { $ne: true },
      }).select('_id email name').lean()
      const message = `Today is Dr. ${doctor.name}'s birthday.`

      for (const recipient of recipients) {
        const dedupeKey = `doctor-birthday:${company._id}:${doctor._id}:${birthdayDate}:${recipient._id}`
        try {
          await Notification.create({
            companyId: company._id,
            recipientId: recipient._id,
            type: 'DOCTOR_BIRTHDAY',
            title: 'Doctor Birthday',
            message,
            dedupeKey,
          })
          created += 1
          if (recipient.email) {
            try {
              await mailService.sendMail({ to: recipient.email, subject: 'Doctor Birthday', text: message, html: `<p>${message}</p>` })
            } catch (error) {
              console.error(`Doctor birthday email failed for ${recipient._id}:`, error.message)
            }
          }
        } catch (error) {
          if (error?.code !== 11000) console.error(`Doctor birthday notification failed for ${doctor._id}:`, error.message)
        }
      }
    } catch (error) {
      console.error(`Doctor birthday processing failed for ${doctor._id}:`, error.message)
    }
  }

  return { matched: doctors.filter((doctor) => isBirthday(doctor.dateOfBirth, today)).length, created, birthdayDate }
}

export function startBirthdayScheduler() {
  const timezone = process.env.APP_TIMEZONE || 'Asia/Kolkata'
  cron.schedule('5 0 * * *', () => processDoctorBirthdays().catch((error) => console.error('Doctor birthday scheduler failed:', error.message)), { timezone })
  processDoctorBirthdays().catch((error) => console.error('Initial doctor birthday check failed:', error.message))
}
