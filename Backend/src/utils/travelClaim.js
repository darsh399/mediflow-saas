import calculateDistance from './calculateDistance.js';

const round = (value) => Math.round(value * 100) / 100;

// Groups visits (each { visitLatitude, visitLongitude, visitedAt }) by local
// day, sums point-to-point distance between consecutive stops, and applies the
// per-km rate + a flat daily allowance for every day that had visits.
export function summariseTravelClaim(visits, ratePerKm = 0, dailyAllowance = 0) {
  const byDay = new Map();
  for (const visit of [...visits].sort((a, b) => new Date(a.visitedAt) - new Date(b.visitedAt))) {
    const key = new Date(visit.visitedAt).toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(visit);
  }

  const days = [];
  let totalKm = 0;
  for (const [date, dayVisits] of [...byDay.entries()].sort()) {
    let meters = 0;
    for (let index = 1; index < dayVisits.length; index += 1) {
      meters += calculateDistance(
        dayVisits[index - 1].visitLatitude, dayVisits[index - 1].visitLongitude,
        dayVisits[index].visitLatitude, dayVisits[index].visitLongitude,
      );
    }
    const km = Math.round(meters / 100) / 10;
    totalKm += km;
    days.push({ date, visits: dayVisits.length, km });
  }

  const travelAmount = round(totalKm * ratePerKm);
  const daAmount = round(days.length * dailyAllowance);
  return {
    totalKm: round(totalKm),
    daysWithVisits: days.length,
    travelAmount,
    daAmount,
    total: round(travelAmount + daAmount),
    days,
  };
}

export default { summariseTravelClaim };
