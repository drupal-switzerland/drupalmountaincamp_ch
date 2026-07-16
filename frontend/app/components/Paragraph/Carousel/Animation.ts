import type { SwiperModule, Swiper } from 'swiper/types'

type SwiperContext = {
  swiper: Swiper
}

type SlideAnimationState = {
  x: number
  y: number
  scale: number
  opacity: number
}

export function easing(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2
}

function interpolatePosition(
  start: number,
  end: number,
  progress: number,
): number {
  if (progress <= -1) return start
  if (progress >= 1) return end
  if (progress === 0) return 0
  return progress < 0 ? start * easing(-progress) : end * easing(progress)
}

function interpolateScale(
  start: number,
  end: number,
  progress: number,
): number {
  if (progress <= -1) return start
  if (progress >= 1) return end
  if (progress === 0) return 1
  return progress < 0
    ? 1 + (start - 1) * easing(-progress)
    : 1 + (end - 1) * easing(progress)
}

function setTransform(
  progress: number,
  start: SlideAnimationState,
  end: SlideAnimationState,
  el?: Element | null,
): void {
  if (!(el instanceof HTMLElement)) {
    return
  }

  const x = interpolatePosition(start.x, end.x, progress)
  const y = interpolatePosition(start.y, end.y, progress)
  const scale = interpolateScale(start.scale, end.scale, progress)

  const opacity = interpolateScale(start.opacity, end.opacity, progress)

  // Apply styles.
  el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
  el.style.opacity = opacity.toString()
}

export const Parallax: SwiperModule = ({ swiper }: SwiperContext) => {
  const setTranslate = () => {
    const isMobile = window.innerWidth < 1024
    const { slides, progress, snapGrid, el } = swiper
    const rootWidth: number = el.offsetWidth
    const slidesPerGroup = swiper.params.slidesPerGroup || 1
    slides.forEach((slideEl: HTMLElement, slideIndex: number) => {
      // @ts-ignore
      let slideProgress = slideEl.progress
      if (slidesPerGroup > 1 && swiper.params.slidesPerView !== 'auto') {
        slideProgress +=
          Math.ceil(slideIndex / 2) - progress * (snapGrid.length - 1)
      }
      slideProgress = Math.min(Math.max(slideProgress, -1), 1)
      const image = slideEl.querySelector('.swiper-carousel-left')
      if (image instanceof HTMLElement) {
        const imageEndScale = 0.75
        // Calculate the ramining width *after* the image has been scaled.
        // We use this to translate the image horizontally.
        // The resulting value would make the image "touch" the preceeding slide exactly.
        const remainingWidth = rootWidth - image.offsetWidth * imageEndScale
        setTransform(
          slideProgress,
          {
            x: 32,
            y: 0,
            scale: 0.75,
            opacity: 1,
          },
          {
            x: isMobile ? -50 : remainingWidth - 32,
            y: 0,
            scale: imageEndScale,
            opacity: 1,
          },

          image,
        )
      }

      setTransform(
        slideProgress,
        {
          x: isMobile ? 200 : 400,
          y: 0,
          scale: 1,
          opacity: 0,
        },
        {
          x: isMobile ? -200 : 500,
          y: 0,
          scale: 1,
          opacity: 0,
        },

        slideEl.querySelector('.swiper-carousel-content'),
      )
    })
  }

  swiper.on('beforeInit', () => {
    swiper.params.watchSlidesProgress = true
    swiper.originalParams.watchSlidesProgress = true
  })
  swiper.on('init', () => {
    setTranslate()
  })
  swiper.on('setTranslate', () => {
    setTranslate()
  })

  swiper.on('setTransition', (swiper: Swiper, duration: number) => {
    swiper.el.style.setProperty(
      '--swiper-transition-duration',
      duration.toString() + 'ms',
    )
  })
}
