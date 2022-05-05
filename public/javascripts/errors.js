const errorAudio = new Audio("/audio/error.mp3")
const apatheticQuack = new Audio("/audio/apatheticquack.mp3")

document.addEventListener('click', () => {
  errorAudio.play()
})

document.querySelector('img').addEventListener('click', () => {
  apatheticQuack.play()
})