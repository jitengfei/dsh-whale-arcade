import css from '../WhaleArcade.module.css'

export interface SplashState {
  id: number
  x: number
  y: number
}

export interface SplashProps {
  splash: SplashState | null
}

export function Splash({ splash }: SplashProps) {
  return splash && <span key={splash.id} className={css.splash} style={{ left: `${splash.x}%`, top: `${splash.y}%` }}><i/><i/><i/><i/></span>
}
