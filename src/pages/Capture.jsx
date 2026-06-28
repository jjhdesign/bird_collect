import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  identifyBird,
  computeImageHash,
  extractExif,
} from '../lib/geminiVision'
import {
  checkImageHashExists,
  uploadBirdImage,
  createUpload,
  findBirdByName,
  unlockBird,
} from '../lib/supabase'

const STATUS = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  SUCCESS: 'success',
  NOT_FOUND: 'not_found',
  FAIL: 'fail',
  DUPLICATE: 'duplicate',
}

export default function Capture() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [status, setStatus] = useState(STATUS.IDLE)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [unlockedBird, setUnlockedBird] = useState(null)
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false)
  const [failMsg, setFailMsg] = useState('사진 인식에 실패했습니다')

  useEffect(() => {
    if (!loading && !user) navigate('/', { replace: true })
  }, [loading, user, navigate])

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return null

  async function handleFile(selected) {
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setFailMsg('이미지 파일만 업로드할 수 있어요')
      setStatus(STATUS.FAIL)
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFailMsg('사진 용량이 너무 커요 (최대 10MB)')
      setStatus(STATUS.FAIL)
      return
    }

    setPreview(URL.createObjectURL(selected))
    setStatus(STATUS.ANALYZING)
    setResult(null)
    setUnlockedBird(null)

    try {
      const hash = await computeImageHash(selected)
      if (await checkImageHashExists(hash)) {
        setStatus(STATUS.DUPLICATE)
        return
      }

      const exif = await extractExif(selected)
      if (exif.future) {
        setFailMsg('촬영일시가 비정상이에요 (미래 날짜). 다른 사진을 사용해주세요')
        setStatus(STATUS.FAIL)
        return
      }

      const { success, result: aiResult } = await identifyBird(selected)

      let storagePath
      try {
        storagePath = await uploadBirdImage(user.id, selected)
      } catch (e) {
        console.error('Storage 업로드 실패:', e)
        setFailMsg('사진 저장에 실패했어요. 잠시 후 다시 시도해주세요')
        setStatus(STATUS.FAIL)
        return
      }

      let upload
      try {
        upload = await createUpload({
          userId: user.id,
          storageUrl: storagePath,
          imageHash: hash,
          exifTakenAt: exif.takenAt,
          aiResult: aiResult?.name_ko || null,
          aiConfidence: aiResult?.confidence ?? null,
          status: success ? 'success' : 'failed',
        })
      } catch (e) {
        if (e?.code === '23505') {
          setStatus(STATUS.DUPLICATE)
          return
        }
        throw e
      }

      if (!success) {
        setResult(aiResult)
        setFailMsg('새를 식별하지 못했어요. 선명한 새 사진을 사용해주세요')
        setStatus(STATUS.FAIL)
        return
      }

      const bird = await findBirdByName(aiResult.name_ko)
      setResult(aiResult)

      if (!bird) {
        setStatus(STATUS.NOT_FOUND)
        return
      }

      try {
        await unlockBird({ userId: user.id, birdId: bird.id, uploadId: upload.id })
        setUnlockedBird(bird)
      } catch (e) {
        if (e?.code === '23505') {
          setUnlockedBird(bird)
          setAlreadyUnlocked(true)
        } else {
          throw e
        }
      }

      setStatus(STATUS.SUCCESS)
    } catch (err) {
      console.error(err)
      setFailMsg('사진 인식에 실패했습니다')
      setStatus(STATUS.FAIL)
    }
  }

  function reset() {
    setStatus(STATUS.IDLE)
    setPreview(null)
    setResult(null)
    setUnlockedBird(null)
    setAlreadyUnlocked(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-900">새 사진 업로드</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {status === STATUS.IDLE && (
          <>
            {/* UX: entire zone is the primary CTA — eliminates "box vs button" ambiguity; larger area = easier Fitts's Law target */}
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-3xl bg-gradient-to-b from-forest-50 to-forest-100 border-2 border-dashed border-forest-300 flex flex-col items-center justify-center gap-5 py-16 px-6 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center">
                <svg className="w-10 h-10 text-forest-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-forest-900 text-xl">새 사진 업로드</p>
                <p className="text-sm text-forest-700 mt-1.5 opacity-70">탭하여 갤러리에서 사진 선택</p>
              </div>
            </button>
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400">새가 선명하게 찍힌 사진일수록 인식이 잘 돼요</p>
              <p className="text-xs text-gray-400">한 번 제출한 사진은 재사용할 수 없어요</p>
            </div>
          </>
        )}

        {status === STATUS.ANALYZING && (
          <>
            {preview && (
              <div className="w-64 h-64 rounded-2xl overflow-hidden">
                <img src={preview} alt="업로드 사진" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 font-medium">AI가 새를 분석하고 있어요...</p>
            </div>
          </>
        )}

        {status === STATUS.SUCCESS && (
          <>
            {preview && (
              <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-md">
                <img src={preview} alt="인식된 사진" className="w-full object-cover" />
              </div>
            )}
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-sm">
              {alreadyUnlocked ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">📖</div>
                    <h2 className="text-lg font-bold text-gray-700">{result?.name_ko}</h2>
                    <p className="text-xs text-gray-400 mt-1">이미 해금한 종이에요</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/dex/${unlockedBird.id}`)}
                      className="flex-1 bg-forest-600 text-white py-2 rounded-xl text-sm font-medium"
                    >
                      해금 기록 보기
                    </button>
                    <button onClick={reset} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium">
                      다시 찍기
                    </button>
                  </div>
                </>
              ) : unlockedBird ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">🎉</div>
                    <h2 className="text-xl font-bold text-forest-700">{result?.name_ko} 해금!</h2>
                    <p className="text-sm text-gray-400 italic">{result?.name_sci}</p>
                    {result?.confidence != null && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[120px] bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-forest-500 h-1.5 rounded-full"
                            style={{ width: `${Math.round(result.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">일치도 {Math.round(result.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 text-center">{result?.reason}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/dex/${unlockedBird.id}`)}
                      className="flex-1 bg-forest-600 text-white py-2 rounded-xl text-sm font-medium"
                    >
                      상세 보기
                    </button>
                    <button onClick={reset} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium">
                      다시 찍기
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </>
        )}

        {status === STATUS.NOT_FOUND && (
          <>
            {preview && (
              <div className="w-48 h-48 rounded-2xl overflow-hidden">
                <img src={preview} alt="인식 사진" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium text-gray-800">{result?.name_ko} 같아요!</p>
              <p className="text-sm text-gray-500 mt-1">아직 도감에 없는 새예요</p>
            </div>
            <button onClick={reset} className="px-6 py-2.5 bg-forest-600 text-white rounded-xl text-sm font-medium">
              다른 새 찾기
            </button>
          </>
        )}

        {status === STATUS.FAIL && (
          <>
            {preview && (
              <div className="w-48 h-48 rounded-2xl overflow-hidden opacity-50">
                <img src={preview} alt="실패 사진" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-center">
              <div className="text-4xl mb-3">😔</div>
              <p className="font-medium text-gray-800">{failMsg}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/dex')} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
                확인
              </button>
              <button onClick={() => inputRef.current?.click()} className="px-5 py-2.5 bg-forest-600 text-white rounded-xl text-sm font-medium">
                다시 업로드
              </button>
            </div>
          </>
        )}

        {status === STATUS.DUPLICATE && (
          <div className="text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="font-medium text-gray-800">이미 사용한 사진이에요</p>
            <p className="text-sm text-gray-500 mt-1">새로 찍은 사진을 업로드해주세요</p>
            <button onClick={reset} className="mt-4 px-6 py-2.5 bg-forest-600 text-white rounded-xl text-sm font-medium">
              다시 선택
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
