// Lichess public sound assets
const SOUNDS = {
  move:    'https://lichess1.org/assets/sound/standard/Move.mp3',
  capture: 'https://lichess1.org/assets/sound/standard/Capture.mp3',
  check:   'https://lichess1.org/assets/sound/standard/Check.mp3',
  end:     'https://lichess1.org/assets/sound/standard/GenericNotify.mp3',
}

const cache = {}

function play(name) {
  try {
    if (!cache[name]) {
      cache[name] = new Audio(SOUNDS[name])
      cache[name].volume = 0.6
    }
    const audio = cache[name].cloneNode()
    audio.volume = 0.6
    audio.play().catch(() => {})
  } catch {}
}

export function useSound() {
  return {
    playMove:    () => play('move'),
    playCapture: () => play('capture'),
    playCheck:   () => play('check'),
    playEnd:     () => play('end'),
  }
}
