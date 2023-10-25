export function addMarker(fpe, pos, className){
  const el = document.createElement('div')
  el.classList.add(className)
  const marker = fpe.addHtmlMarker({
    pos: pos,
    el
  })
  return marker
}