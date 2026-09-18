type SpeedControl = { setSpeed?: (speed: number) => void }
type SpeedAPIs = {
  vlibras?: SpeedControl
  plugin?: SpeedControl & { player?: SpeedControl }
  VLibrasPlayer?: SpeedControl
}

export function applyPlaybackSpeed(apis: SpeedAPIs, speed: number): boolean {
  const player = [apis.vlibras, apis.plugin?.player, apis.VLibrasPlayer, apis.plugin].find(
    (candidate) => typeof candidate?.setSpeed === 'function',
  )
  if (!player) return false
  player.setSpeed!(speed)
  return true
}
