// One-time migration: make every company's `enabledModules` explicit.
//
// Granular feature keys (organization_chart, territories, tour_plans,
// sales_targets, expenses, products, offer_letters, doctor_import) were added
// after some companies already existed. Existing companies must keep full
// access, so we union each company's current array with the full catalogue.
// Idempotent — safe to run more than once.
//
//   node src/utils/migrateCompanyModules.mjs

import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/dbConnection.js'
import Company from '../models/Company.js'
import { MODULES, normalizeModules } from '../config/modules.js'

await connectDB()

const companies = await Company.find({}).select('_id companyName enabledModules')
let updated = 0

for (const company of companies) {
  const current = normalizeModules(company.enabledModules)
  const next = [...new Set([...current, ...MODULES])]
  if (next.length !== current.length || next.some((k) => !current.includes(k))) {
    await Company.updateOne({ _id: company._id }, { $set: { enabledModules: next } })
    updated += 1
    console.log(`  + ${company.companyName}: ${current.length} -> ${next.length} features`)
  }
}

console.log(`\nDone. ${updated}/${companies.length} companies updated.`)
await mongoose.connection.close()
process.exit(0)
