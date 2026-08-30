// Pure balance maths for sample transactions, shared by the controller and its
// tests. ISSUE/ADJUST add to a rep's balance; RETURN/GIVEN subtract.
export function sign(type) {
  return type === 'RETURN' || type === 'GIVEN' ? -1 : 1
}

export function computeBalances(transactions) {
  const map = new Map()
  for (const txn of transactions) {
    const key = `${txn.employeeId}:${txn.itemId}`
    map.set(key, (map.get(key) || 0) + sign(txn.type) * Number(txn.quantity || 0))
  }
  return [...map.entries()].map(([key, balance]) => {
    const [employeeId, itemId] = key.split(':')
    return { employeeId, itemId, balance }
  })
}

export default { sign, computeBalances }
