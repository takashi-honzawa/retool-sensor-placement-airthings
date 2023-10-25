export function createLine(position1, position2, color = '#5500ff', strokeWidth = 10){
  return {
    type: 'line',
    start: position1,
    end: position2,
    style: { stroke: color, strokeWidth: 10}
  }
}

export function createCircle(position, radius, color = '#5500ff', strokeWidth = 10){
  return {
    type: 'circle', 
    position: position, 
    radius: radius,
    style: { stroke: color }
  }
}