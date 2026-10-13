import { predictParkingML } from '../api'

export function predictScore(traffic, withDay) {
  const h = new Date().getHours()
  const d = new Date().getDay()
  let score = 0.55
  if (h >= 11 && h <= 14) score -= 0.25
  if (h >= 17 && h <= 20) score -= 0.3
  if (withDay && (d === 0 || d === 6)) score -= 0.15
  if (traffic === 'high') score -= 0.25
  if (traffic === 'low') score += 0.2
  if (withDay) score += (Math.random() - 0.5) * 0.08
  return Math.max(0.05, Math.min(0.95, score))
}

export function applyPrediction(score) {
  const available = score > 0.5
  const confidence = Math.round(available ? 50 + score * 44 : 50 + (1 - score) * 44)
  return { available, confidence }
}

export async function fetchMlPrediction(traffic, hour, day, capacity = 100, occupied = 50) {
  try {
    const h = typeof hour === 'number' ? hour : new Date().getHours()
    const d = typeof day === 'number' ? day : new Date().getDay()
    const result = await predictParkingML(h, d, traffic, capacity, occupied)
    if (result && typeof result.available === 'boolean') {
      return {
        available: result.available,
        confidence: Number(result.confidence) || 85,
      }
    }
  } catch (err) {
    console.warn("ML API notice:", err)
  }
  return applyPrediction(predictScore(traffic, true))
}
