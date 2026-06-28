import SparkMD5 from 'spark-md5'
import exifr from 'exifr'
import { supabase } from './supabase'

const CONFIDENCE_THRESHOLD = 0.8

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function computeImageHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(e.target.result)
      resolve(spark.end())
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export async function extractExif(file) {
  try {
    const data = await exifr.parse(file, { DateTimeOriginal: true })
    if (!data?.DateTimeOriginal) return { takenAt: null, future: false }
    const date = new Date(data.DateTimeOriginal)
    return { takenAt: date.toISOString(), future: date > new Date() }
  } catch {
    return { takenAt: null, future: false }
  }
}

export async function identifyBird(file) {
  const base64 = await fileToBase64(file)

  const { data, error } = await supabase.functions.invoke('gemini-identify', {
    body: { image_base64: base64, mime_type: file.type },
  })

  if (error) throw new Error(`인식 서버 오류: ${error.message}`)
  if (!data || data.error) throw new Error(data?.error || 'Gemini 응답 없음')

  const result = data.result
  if (!result || typeof result.is_bird !== 'boolean') {
    throw new Error('Gemini 응답 파싱 실패')
  }
  if (result.name_ko) result.name_ko = result.name_ko.trim()

  const conf = typeof result.confidence === 'number' ? result.confidence : 0
  if (!result.is_bird || conf < CONFIDENCE_THRESHOLD) {
    return { success: false, result }
  }

  return { success: true, result }
}
