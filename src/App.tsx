import { AnimatePresence, motion } from "motion/react"
import { ChangeEvent, FormEvent, TouchEvent, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { initialCharacters, type CharacterCard } from "@/data/characters"

type FormState = {
  name: string
  image: string
  note: string
}

type Screen = "home" | "list" | "detail"

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

export default function App() {
  const [characters, setCharacters] = useState(initialCharacters)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [rotateIntervalSeconds, setRotateIntervalSeconds] = useState<number>(3)
  const [screen, setScreen] = useState<Screen>(() =>
    typeof window === "undefined"
      ? "home"
      : resolveRoute(window.location.pathname, initialCharacters).screen
  )
  const touchStartXRef = useRef<number | null>(null)
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
  const [detailOffset, setDetailOffset] = useState({ x: 0, y: 0 })
  const [formState, setFormState] = useState<FormState>({
    name: "",
    image: "",
    note: ""
  })

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

  const activeCharacter = characters[currentIndex]
  const visibleCharacters = characters.map((character, index) => ({
    index,
    ...character,
    offset: getCircularOffset(index, currentIndex, characters.length)
  }))

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
    setDetailOffset({ x: 0, y: 0 })
    window.history.pushState({}, "", `/roles/${encodeURIComponent(activeCharacter.id)}`)
    setScreen("detail")
  }

  function closeDetail() {
    window.history.pushState({}, "", "/")
    setScreen("home")
    setDetailScale(1)
    setDetailOffset({ x: 0, y: 0 })
  }

  function clampScale(nextScale: number) {
    return Math.min(4, Math.max(1, nextScale))
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
        startOffsetX: detailOffset.x,
        startOffsetY: detailOffset.y
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
        startOffsetX: detailOffset.x,
        startOffsetY: detailOffset.y
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

    if (detailGestureRef.current.mode === "pan" && event.touches.length === 1 && detailScale > 1) {
      event.preventDefault()
      const deltaX = event.touches[0].clientX - detailGestureRef.current.startX
      const deltaY = event.touches[0].clientY - detailGestureRef.current.startY

      setDetailOffset({
        x: detailGestureRef.current.startOffsetX + deltaX,
        y: detailGestureRef.current.startOffsetY + deltaY
      })
    }
  }

  function handleDetailTouchEnd() {
    detailGestureRef.current.mode = "idle"
  }

  function zoomIn() {
    setDetailScale((current) => clampScale(current + 0.25))
  }

  function zoomOut() {
    setDetailScale((current) => {
      const nextScale = clampScale(current - 0.25)
      if (nextScale === 1) {
        setDetailOffset({ x: 0, y: 0 })
      }
      return nextScale
    })
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        setFormState((current) => ({ ...current, image: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextName = formState.name.trim()
    const nextNote = formState.note.trim()
    if (!nextName || !formState.image || !nextNote) {
      return
    }

    const nextCharacter: CharacterCard = {
      id: `${nextName}-${Date.now()}`,
      name: nextName,
      image: formState.image,
      accent: "from-slate-100 via-sky-50 to-cyan-50",
      note: nextNote
    }

    setCharacters((current) => [...current, nextCharacter])
    setCurrentIndex(characters.length)
    setFormState({ name: "", image: "", note: "" })
    setIsDrawerOpen(false)
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
                    const shadow = "0 16px 50px rgba(15,23,42,0.1)"

                    return (
                      <div
                        key={character.id}
                        style={{
                          zIndex: isCenter ? 40 : 20 - absOffset
                        }}
                        className="pointer-events-none absolute inset-0"
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
                              boxShadow: shadow
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
                <div className="rounded-full bg-slate-100 px-4 py-2 text-xs text-muted-foreground shadow-sm">
                  左右滑动或点击卡片切换
                </div>
              </div>

              <div className="mt-4 rounded-[10px] border border-border/70 bg-slate-50/90 p-4">
                <p className="text-sm text-muted-foreground">角色介绍</p>
                <p className="mt-2 text-sm leading-6 text-foreground/82">
                  {activeCharacter.note}
                </p>
              </div>
            </div>
            </section>

            <Button
              className="h-[52px] w-full rounded-2xl"
              onClick={() => setIsDrawerOpen(true)}
            >
              新增角色
            </Button>
          </div>
        ) : (
          screen === "list" ? (
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
                        closeRoleList()
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
          ) : (
            <section className="flex min-h-0 flex-1 flex-col">
              <div
                className="relative flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-white"
                onTouchStart={handleDetailTouchStart}
                onTouchMove={handleDetailTouchMove}
                onTouchEnd={handleDetailTouchEnd}
              >
                <motion.img
                  src={activeCharacter.image}
                  alt={activeCharacter.name}
                  className="max-h-full max-w-full select-none object-contain"
                  draggable={false}
                  animate={{
                    scale: detailScale,
                    x: detailOffset.x,
                    y: detailOffset.y
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={zoomOut}>
                  缩小
                </Button>
                <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={closeDetail}>
                  返回
                </Button>
                <Button className="h-11 flex-1 rounded-2xl" onClick={zoomIn}>
                  放大
                </Button>
              </div>
            </section>
          )
        )}
      </div>

      <AnimatePresence>
        {isDrawerOpen ? (
          <>
            <motion.button
              aria-label="关闭新增角色表单"
              className="fixed inset-0 bg-black/28"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.section
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md rounded-t-[30px] border border-border bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 shadow-[0_-18px_48px_rgba(15,23,42,0.18)]"
            >
              <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200" />
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">角色表单</p>
                <h4 className="mt-2 text-xl font-semibold">新增角色</h4>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">名称</span>
                  <input
                    required
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="输入角色名称"
                    className="h-12 w-full rounded-2xl border border-border bg-white px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">角色介绍</span>
                  <textarea
                    required
                    value={formState.note}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        note: event.target.value
                      }))
                    }
                    placeholder="输入简短角色介绍"
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">图片</span>
                  <input
                    required
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                  />
                </label>

                {formState.image ? (
                  <div className="overflow-hidden rounded-[24px] border border-border">
                    <img
                      src={formState.image}
                      alt="新角色预览"
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" className="h-12 flex-1 rounded-2xl">
                    保存角色
                  </Button>
                </div>
              </form>
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
