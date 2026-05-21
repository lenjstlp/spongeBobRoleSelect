import { AnimatePresence, motion } from "motion/react"
import { TouchEvent, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { initialCharacters, type CharacterCard } from "@/data/characters"

type Screen = "home" | "list" | "detail" | "random"

type RouteState = {
  screen: Screen
  index?: number
}

type DetailGestureState = {
  mode: "idle" | "pan" | "pinch"
  startX: number
  startY: number
  startScale: number
  startDistance: number
  startOffsetX: number
  startOffsetY: number
}

type RectangleSlot = {
  left: number
  top: number
}

type RandomTrackMetrics = {
  cardWidth: number
  cardHeight: number
  centerCardWidth: number
  stageHeight: number
}

function getCircularOffset(index: number, activeIndex: number, total: number) {
  let offset = index - activeIndex
  const half = total / 2

  if (offset > half) {
    offset -= total
  }

  if (offset < -half) {
    offset += total
  }

  return offset
}

function resolveRoute(pathname: string, characters: CharacterCard[]): RouteState {
  if (pathname === "/roles") {
    return { screen: "list" }
  }

  if (pathname === "/random") {
    return { screen: "random" }
  }

  if (pathname.startsWith("/roles/")) {
    const roleId = decodeURIComponent(pathname.replace("/roles/", ""))
    const roleIndex = characters.findIndex((character) => character.id === roleId)
    if (roleIndex >= 0) {
      return {
        screen: "detail",
        index: roleIndex
      }
    }
  }

  return { screen: "home" }
}

function getRandomTrackMetrics(total: number): RandomTrackMetrics {
  if (total <= 8) {
    return {
      cardWidth: 72,
      cardHeight: 92,
      centerCardWidth: 132,
      stageHeight: 432
    }
  }

  if (total <= 12) {
    return {
      cardWidth: 62,
      cardHeight: 80,
      centerCardWidth: 128,
      stageHeight: 446
    }
  }

  return {
    cardWidth: 54,
    cardHeight: 70,
    centerCardWidth: 122,
    stageHeight: 462
  }
}

function getLinePositions(count: number, start: number, end: number) {
  if (count <= 0) {
    return []
  }

  if (count === 1) {
    return [(start + end) / 2]
  }

  return Array.from({ length: count }, (_, index) => {
    return start + ((end - start) * index) / (count - 1)
  })
}

function getRectangleSlots(total: number): RectangleSlot[] {
  if (total <= 0) {
    return []
  }

  const sideInsetX = 10
  const sideInsetY = 8
  const leftX = sideInsetX
  const rightX = 100 - sideInsetX
  const topY = sideInsetY
  const bottomY = 100 - sideInsetY

  const topCount = Math.max(4, Math.ceil(total / 4))
  const rightCount = Math.max(2, Math.ceil((total - topCount) / 4))
  const bottomCount = Math.max(4, Math.ceil((total - topCount - rightCount) / 2))
  const leftCount = Math.max(2, total - topCount - rightCount - bottomCount)

  const top = getLinePositions(topCount, leftX, rightX).map((left) => ({
    left,
    top: topY
  }))
  const right = getLinePositions(rightCount, topY + 14, bottomY - 14).map((top) => ({
    left: rightX,
    top
  }))
  const bottom = getLinePositions(bottomCount, rightX, leftX).map((left) => ({
    left,
    top: bottomY
  }))
  const left = getLinePositions(leftCount, bottomY - 14, topY + 14).map((top) => ({
    left: leftX,
    top
  }))

  return [...top, ...right, ...bottom, ...left].slice(0, total)
}

export default function App() {
  const [characters, setCharacters] = useState(initialCharacters)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rotateIntervalSeconds, setRotateIntervalSeconds] = useState<number>(3)
  const [screen, setScreen] = useState<Screen>(() =>
    typeof window === "undefined"
      ? "home"
      : resolveRoute(window.location.pathname, initialCharacters).screen
  )
  const [randomHighlightIndex, setRandomHighlightIndex] = useState(0)
  const [randomResultId, setRandomResultId] = useState<string | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [isRandomSpinning, setIsRandomSpinning] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const randomTimeoutRef = useRef<number | null>(null)
  const detailGestureRef = useRef<DetailGestureState>({
    mode: "idle",
    startX: 0,
    startY: 0,
    startScale: 1,
    startDistance: 0,
    startOffsetX: 0,
    startOffsetY: 0
  })
  const [detailScale, setDetailScale] = useState(1)
  const [detailPosition, setDetailPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (
      characters.length <= 1 ||
      screen !== "home" ||
      rotateIntervalSeconds === 0
    ) {
      return
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % characters.length)
    }, rotateIntervalSeconds * 1000)

    return () => window.clearInterval(timer)
  }, [characters.length, rotateIntervalSeconds, screen])

  useEffect(() => {
    const route = resolveRoute(window.location.pathname, characters)

    setScreen(route.screen)
    if (route.index !== undefined) {
      setCurrentIndex(route.index)
    }

    function handlePopState() {
      const nextRoute = resolveRoute(window.location.pathname, characters)
      setScreen(nextRoute.screen)
      if (nextRoute.index !== undefined) {
        setCurrentIndex(nextRoute.index)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [characters])

  useEffect(() => {
    return () => {
      if (randomTimeoutRef.current !== null) {
        window.clearTimeout(randomTimeoutRef.current)
      }
    }
  }, [])

  const activeCharacter = characters[currentIndex]
  const visibleCharacters = characters.map((character, index) => ({
    index,
    ...character,
    offset: getCircularOffset(index, currentIndex, characters.length)
  }))
  const availableRandomCharacters = characters.filter(
    (character) => !selectedRoleIds.includes(character.id)
  )
  const selectedCharacters = selectedRoleIds
    .map((id) => characters.find((character) => character.id === id) ?? null)
    .filter((character): character is CharacterCard => character !== null)
  const randomSelectedCharacter =
    randomResultId === null
      ? null
      : characters.find((character) => character.id === randomResultId) ?? null
  const randomHighlightCharacter =
    availableRandomCharacters.length === 0
      ? null
      : availableRandomCharacters[
          Math.min(randomHighlightIndex, availableRandomCharacters.length - 1)
        ]
  const randomTrackMetrics = getRandomTrackMetrics(availableRandomCharacters.length)
  const randomSlots = getRectangleSlots(availableRandomCharacters.length)
  const currentRandomSlot =
    availableRandomCharacters.length === 0
      ? null
      : randomSlots[
          Math.min(randomHighlightIndex, availableRandomCharacters.length - 1)
        ] ?? null

  useEffect(() => {
    if (availableRandomCharacters.length === 0) {
      setRandomHighlightIndex(0)
      return
    }

    if (randomHighlightIndex > availableRandomCharacters.length - 1) {
      setRandomHighlightIndex(0)
    }
  }, [availableRandomCharacters.length, randomHighlightIndex])

  function showPreviousCharacter() {
    setCurrentIndex((current) => (current - 1 + characters.length) % characters.length)
  }

  function showNextCharacter() {
    setCurrentIndex((current) => (current + 1) % characters.length)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchStartX = touchStartXRef.current
    const touchEndX = event.changedTouches[0]?.clientX

    touchStartXRef.current = null

    if (touchStartX === null || touchEndX === undefined) {
      return
    }

    const deltaX = touchEndX - touchStartX
    if (Math.abs(deltaX) < 48) {
      return
    }

    if (deltaX < 0) {
      showNextCharacter()
      return
    }

    showPreviousCharacter()
  }

  function openRoleList() {
    window.history.pushState({}, "", "/roles")
    setScreen("list")
  }

  function closeRoleList() {
    window.history.pushState({}, "", "/")
    setScreen("home")
  }

  function openDetail() {
    setDetailScale(1)
    setDetailPosition({ x: 0, y: 0 })
    window.history.pushState({}, "", `/roles/${encodeURIComponent(activeCharacter.id)}`)
    setScreen("detail")
  }

  function openRandom() {
    window.history.pushState({}, "", "/random")
    setScreen("random")
  }

  function closeDetail() {
    window.history.pushState({}, "", "/")
    setScreen("home")
    setDetailScale(1)
    setDetailPosition({ x: 0, y: 0 })
  }

  function closeRandom() {
    clearRandomTimers()
    setIsRandomSpinning(false)
    window.history.pushState({}, "", "/")
    setScreen("home")
  }

  function clampScale(nextScale: number) {
    return Math.min(4, Math.max(1, nextScale))
  }

  function resetDetailView() {
    setDetailScale(1)
    setDetailPosition({ x: 0, y: 0 })
  }

  function getTouchDistance(event: TouchEvent<HTMLDivElement>) {
    const firstTouch = event.touches[0]
    const secondTouch = event.touches[1]
    if (!firstTouch || !secondTouch) {
      return 0
    }

    return Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY
    )
  }

  function handleDetailTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      detailGestureRef.current = {
        mode: "pinch",
        startX: 0,
        startY: 0,
        startScale: detailScale,
        startDistance: getTouchDistance(event),
        startOffsetX: detailPosition.x,
        startOffsetY: detailPosition.y
      }
      return
    }

    if (event.touches.length === 1) {
      detailGestureRef.current = {
        mode: "pan",
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        startScale: detailScale,
        startDistance: 0,
        startOffsetX: detailPosition.x,
        startOffsetY: detailPosition.y
      }
    }
  }

  function handleDetailTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (detailGestureRef.current.mode === "pinch" && event.touches.length === 2) {
      event.preventDefault()
      const nextDistance = getTouchDistance(event)
      const distanceRatio =
        detailGestureRef.current.startDistance === 0
          ? 1
          : nextDistance / detailGestureRef.current.startDistance

      setDetailScale(clampScale(detailGestureRef.current.startScale * distanceRatio))
      return
    }

    if (detailGestureRef.current.mode === "pan" && event.touches.length === 1) {
      event.preventDefault()
      const deltaX = event.touches[0].clientX - detailGestureRef.current.startX
      const deltaY = event.touches[0].clientY - detailGestureRef.current.startY

      setDetailPosition({
        x: detailGestureRef.current.startOffsetX + deltaX,
        y: detailGestureRef.current.startOffsetY + deltaY
      })
    }
  }

  function handleDetailTouchEnd() {
    detailGestureRef.current.mode = "idle"
  }

  function clearRandomTimers() {
    if (randomTimeoutRef.current !== null) {
      window.clearTimeout(randomTimeoutRef.current)
      randomTimeoutRef.current = null
    }
  }

  function startRandomSelection() {
    if (isRandomSpinning || availableRandomCharacters.length === 0) {
      return
    }

    clearRandomTimers()
    setIsRandomSpinning(true)
    setRandomResultId(null)

    const spinPool = [...availableRandomCharacters]
    const steps =
      spinPool.length * 2 + Math.floor(Math.random() * spinPool.length) + 3
    let currentIndex = Math.min(randomHighlightIndex, spinPool.length - 1)
    const startDelay = 60
    const endDelay = 240

    function runSpin(step: number) {
      randomTimeoutRef.current = window.setTimeout(() => {
        currentIndex = (currentIndex + 1) % spinPool.length
        setRandomHighlightIndex(currentIndex)

        if (step >= steps) {
          const winner = spinPool[currentIndex]
          setRandomResultId(winner.id)
          setSelectedRoleIds((current) => [...current, winner.id])
          const nextCurrentIndex = characters.findIndex(
            (character) => character.id === winner.id
          )
          if (nextCurrentIndex >= 0) {
            setCurrentIndex(nextCurrentIndex)
          }
          setIsRandomSpinning(false)
          return
        }

        runSpin(step + 1)
      }, startDelay + ((endDelay - startDelay) * step) / steps)
    }

    runSpin(0)
  }

  function resetRandomSelection() {
    clearRandomTimers()
    setIsRandomSpinning(false)
    setRandomResultId(null)
    setRandomHighlightIndex(0)
    setSelectedRoleIds([])
  }

  return (
    <main className="min-h-dvh bg-white text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+20px)]">
        {screen !== "detail" ? (
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex items-center justify-between"
          >
            <h1 className="text-2xl font-semibold tracking-tight">角色选择器</h1>
            <button
              type="button"
              className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition hover:bg-slate-50"
              onClick={openRoleList}
            >
              {characters.length} 个角色
            </button>
          </motion.header>
        ) : null}

        {screen === "home" ? (
          <div className="mt-6 flex flex-1 flex-col gap-4">
            <section className="relative flex-1 overflow-hidden rounded-[10px] border border-border/70 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCharacter.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <img
                    src={activeCharacter.image}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full scale-110 object-cover blur-2xl"
                  />
                  <div className="absolute inset-0 bg-white/68" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.52)_35%,rgba(255,255,255,0.92)_100%)]" />
                </motion.div>
              </AnimatePresence>

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">角色卡片轮播</div>
                  <label className="rounded-full bg-white/85 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                    <span className="sr-only">自动切换频率</span>
                    <select
                      value={String(rotateIntervalSeconds)}
                      onChange={(event) =>
                        setRotateIntervalSeconds(Number(event.target.value))
                      }
                      className="bg-transparent pr-1 outline-none"
                    >
                      <option value="3">3 秒</option>
                      <option value="5">5 秒</option>
                      <option value="9">9 秒</option>
                      <option value="0">不自动切</option>
                    </select>
                  </label>
                </div>

                <div
                  className="relative mt-4 min-h-[360px] overflow-hidden [perspective:1800px]"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="absolute inset-0">
                    {visibleCharacters.map((character) => {
                      const absOffset = Math.abs(character.offset)
                      const isCenter = character.offset === 0
                      const isHidden = absOffset > Math.floor(characters.length / 2)
                      const direction = character.offset === 0 ? 0 : character.offset > 0 ? 1 : -1
                      const shiftByDepth = [0, 124, 168, 198]
                      const widthByDepth = ["64%", "18%", "13%", "10%"]
                      const heightByDepth = ["100%", "78%", "70%", "62%"]
                      const depthIndex = Math.min(absOffset, 3)
                      const baseShift = shiftByDepth[depthIndex]
                      const translateX = direction * baseShift
                      const rotateY = isCenter ? 0 : direction * -82
                      const scale = isCenter ? 1 : Math.max(0.8, 0.95 - depthIndex * 0.05)
                      const opacity = isHidden ? 0 : isCenter ? 1 : Math.max(0.5, 0.98 - depthIndex * 0.14)
                      const cardWidth = widthByDepth[depthIndex]
                      const cardHeight = heightByDepth[depthIndex]

                      return (
                        <div
                          key={character.id}
                          className="pointer-events-none absolute inset-0"
                          style={{
                            zIndex: isCenter ? 40 : 20 - absOffset
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.button
                              type="button"
                              className="pointer-events-auto overflow-hidden rounded-[10px] border border-white/70 bg-white text-left"
                              animate={{
                                x: translateX,
                                rotateY,
                                scale,
                                opacity
                              }}
                              transition={{ duration: 0.55, ease: "easeInOut" }}
                              style={{
                                pointerEvents: isHidden ? "none" : "auto",
                                transformStyle: "preserve-3d",
                                transformOrigin:
                                  direction < 0 ? "right center" : direction > 0 ? "left center" : "center center",
                                width: cardWidth,
                                height: cardHeight,
                                boxShadow: "0 16px 50px rgba(15,23,42,0.1)"
                              }}
                              onClick={() => {
                                if (isCenter) {
                                  openDetail()
                                  return
                                }

                                setCurrentIndex(character.index)
                              }}
                            >
                              <img
                                src={character.image}
                                alt={character.name}
                                className="h-full w-full object-cover"
                              />
                            </motion.button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full px-6"
                    onClick={openRandom}
                  >
                    随机选择
                  </Button>
                </div>

                <div className="mt-4 rounded-[10px] border border-border/70 bg-slate-50/90 p-4">
                  <p className="text-sm text-muted-foreground">角色介绍</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/82">
                    {activeCharacter.note}
                  </p>
                </div>
              </div>
            </section>

          </div>
        ) : screen === "list" ? (
          <section className="mt-6 flex min-h-0 flex-1 flex-col rounded-[10px] border border-border/70 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">角色列表</p>
                <h2 className="mt-1 text-xl font-semibold">一个个卡片排布</h2>
              </div>
              <Button variant="outline" className="h-10 rounded-2xl" onClick={closeRoleList}>
                返回
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto pr-1">
              {characters.map((character, index) => (
                <motion.article
                  key={character.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden rounded-[10px] border border-border/70 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      setCurrentIndex(index)
                      openDetail()
                    }}
                  >
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold">{character.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {character.note}
                      </p>
                    </div>
                  </button>
                </motion.article>
              ))}
            </div>
          </section>
        ) : screen === "detail" ? (
          <section className="flex min-h-0 flex-1 flex-col">
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white"
              onTouchStart={handleDetailTouchStart}
              onTouchMove={handleDetailTouchMove}
              onTouchEnd={handleDetailTouchEnd}
            >
              <motion.img
                src={activeCharacter.image}
                alt={activeCharacter.name}
                className="select-none object-contain"
                draggable={false}
                animate={{
                  scale: detailScale,
                  x: detailPosition.x,
                  y: detailPosition.y
                }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                style={{
                  width: "min(100%, 100vw - 40px)",
                  maxHeight: "calc(100dvh - 180px)"
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={closeDetail}>
                返回
              </Button>
              <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={resetDetailView}>
                复原
              </Button>
            </div>
          </section>
        ) : (
          <section className="mt-6 flex min-h-0 flex-1 flex-col rounded-[10px] border border-border/70 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">随机选择角色</h2>
              </div>
              <Button variant="outline" className="h-10 rounded-2xl" onClick={closeRandom}>
                返回
              </Button>
            </div>

            <div
              className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-[10px] border border-border/70 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.99),_rgba(248,250,252,0.95)_42%,_rgba(226,232,240,0.92)_100%)]"
              style={{ minHeight: randomTrackMetrics.stageHeight }}
            >
              <div className="pointer-events-none absolute inset-[14px] rounded-[10px] border border-slate-300/90" />
              <div className="pointer-events-none absolute inset-x-[14px] top-[14px] h-[96px] rounded-[10px] border border-slate-200/80" />
              <div className="pointer-events-none absolute inset-x-[14px] bottom-[14px] h-[96px] rounded-[10px] border border-slate-200/80" />
              <div className="pointer-events-none absolute inset-y-[110px] left-[14px] w-[72px] rounded-[10px] border border-slate-200/80" />
              <div className="pointer-events-none absolute inset-y-[110px] right-[14px] w-[72px] rounded-[10px] border border-slate-200/80" />
              <div className="absolute inset-0">
                {currentRandomSlot && randomHighlightCharacter ? (
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-cyan-400/22 shadow-[0_0_0_10px_rgba(34,211,238,0.18),0_0_32px_rgba(34,211,238,0.35)]"
                    animate={{
                      left: `${currentRandomSlot.left}%`,
                      top: `${currentRandomSlot.top}%`
                    }}
                    transition={{
                      duration: isRandomSpinning ? 0.1 : 0.2,
                      ease: "easeInOut"
                    }}
                      style={{
                        zIndex: 5,
                        width: randomTrackMetrics.cardWidth + 10,
                        height: randomTrackMetrics.cardHeight + 10
                      }}
                  />
                ) : null}

                {availableRandomCharacters.map((character, index) => {
                  const slot = randomSlots[index]
                  const isHighlighted =
                    randomHighlightCharacter?.id === character.id

                  return (
                    <motion.div
                      key={character.id}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border border-white/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
                      animate={{
                        left: `${slot?.left ?? 50}%`,
                        top: `${slot?.top ?? 50}%`,
                        scale: isHighlighted ? 1.04 : 1
                      }}
                      transition={{ duration: 0.2 }}
                      style={{
                        zIndex: 6,
                        width: randomTrackMetrics.cardWidth,
                        height: randomTrackMetrics.cardHeight
                      }}
                    >
                      <img
                        src={character.image}
                        alt={character.name}
                        className="h-full w-full object-cover"
                      />
                    </motion.div>
                  )
                })}
              </div>

              <button
                type="button"
                className="relative z-10 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[10px] border border-slate-300 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.12)] transition active:scale-[0.98]"
                style={{ width: randomTrackMetrics.centerCardWidth }}
                onClick={() => {
                  if (!randomSelectedCharacter || isRandomSpinning) {
                    return
                  }

                  openDetail()
                }}
              >
                {randomSelectedCharacter ? (
                  <img
                    src={randomSelectedCharacter.image}
                    alt={randomSelectedCharacter.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="text-6xl font-semibold">?</div>
                    <p className="mt-2 text-sm">未知角色</p>
                  </div>
                )}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-2xl"
                onClick={resetRandomSelection}
                disabled={isRandomSpinning}
              >
                重置
              </Button>
              <Button
                className="h-11 flex-[1.4] rounded-2xl"
                onClick={startRandomSelection}
                disabled={isRandomSpinning || availableRandomCharacters.length === 0}
              >
                {isRandomSpinning
                  ? "选择中..."
                  : availableRandomCharacters.length === 0
                    ? "已全部选完"
                  : "开始"}
              </Button>
            </div>

            <div className="mt-4 min-h-[132px] rounded-[10px] border border-border/70 bg-slate-50/90 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">已选顺序</p>
                  <p className="text-xs text-muted-foreground">
                    已选 {selectedCharacters.length} / {characters.length}，剩余{" "}
                    {availableRandomCharacters.length}
                  </p>
                </div>

              {selectedCharacters.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {selectedCharacters.map((character, index) => (
                    <div
                      key={character.id}
                      className="flex items-center gap-3 rounded-[10px] border border-border/70 bg-white p-2"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {index + 1}
                      </div>
                      <div className="h-14 w-11 overflow-hidden rounded-[8px]">
                        <img
                          src={character.image}
                          alt={character.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{character.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {character.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[10px] border border-dashed border-border bg-white/75 px-4 py-6 text-center text-sm text-muted-foreground">
                  点击开始后，选中的角色会按顺序出现在这里。
                </div>
              )}
            </div>
          </section>
        )}
      </div>

    </main>
  )
}
