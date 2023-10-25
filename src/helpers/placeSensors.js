//import { FloorPlanEngine } from '@archilogic/floor-plan-webgl'
import {
  getContour,
  getElementsForSpace,
  getMergedSpace,
  Line2d,
  Point2d,
  polygonDifference,
  polygonIntersection,
  polygonOffset,
  polygonPerimeter
} from '@archilogic/scene-structure'
import { feetToMeters } from '@archilogic/toolbox'

/**
 * rules
 * located in occupiable areas
 * at least 3.3 ft (1m) away from exterior walls and doors
 * roughly 1 sensor per 500sqft 
 */

const sensorProgram = ['work', 'meet', 'socialize']

export function placeSensor(fpe, state) {
  const { boundary, outline, holes } = getMergedSpace(fpe.scene)
  
  const exteriorWallOffset = feetToMeters({ feet: parseFloat(state.facadeDistance) }) || 1
  const doorOffset = feetToMeters({ feet: parseFloat(state.doorDistance) }) || 1
  const productId = `!497082b4-6458-4b74-a942-85be1f5793be`

  let doorContours = fpe.scene.nodesByType.door.map(node => {
    let contour = getContour(node.getWorldPosition())
    return polygonOffset([contour], doorOffset)[0]
  })

  let doorShapes = doorContours.map(shape => {
    return { type: 'polygon', points: shape, style: { stroke: 0x00ff99, strokeWidth: 10 } }
  })

  //const innerFacade = polygonOffset(polygonOffset([boundary.shape], 1), -1)
  const innerFacade = polygonOffset([outline], -0.45)
  let innerFacadeOffset = polygonOffset(innerFacade, -exteriorWallOffset)

  const terraceShapes = fpe.resources.spaces
    .filter(space => space.usage === 'terrace')
    .flatMap(space => polygonOffset(space.polygons, exteriorWallOffset))

  innerFacadeOffset = terraceShapes.length
    ? polygonDifference(innerFacadeOffset, terraceShapes)
    : innerFacadeOffset

  const interiors = fpe.scene.nodesByType['interior'].map(node => node.getWorldPosition())

  let lineSegmentMidPoints = [] 
  let spaceShapes = []

  fpe.resources.spaces.forEach(space => {
    if (!sensorProgram.includes(space.program)) return

    //if(space.id !== "abfdfa0e-6c3f-4f5c-85fe-32e3da3d1e48") return

    // get actual wall contours per space
    const { walls } = getElementsForSpace({
      scene: fpe.scene,
      uuid: space.id,
      interiors
    })

    let wallPolylines = walls.polylines
    if (!wallPolylines[0]?.length) return

    // intersect with inner facade offset ( blue line )
    const intersection = polygonIntersection(wallPolylines, innerFacadeOffset, true)
    if (!intersection[0]?.length) return

    // cut away door shapes
    const shapes = polygonDifference(intersection, doorContours, null, true)
    if (!shapes[0]) return

    // sort resulting poly lines by length
    shapes.sort((a, b) => {
      let perA = polygonPerimeter(a, false)
      let perB = polygonPerimeter(b, false)
      return perA > perB ? -1 : 1
    })

    // turn poly lines into line segments
    const lineSegments = polylinesToLines(shapes)
    // get mid points of each line segment and add to mid points to lineSegments if the segment is longer than 0.6m
    const midPoints = []
    lineSegments.forEach(segment => {
      const length = calculateLineLength(segment)
      if(length < 0.6) return
      midPoints.push(
        [
          segment[0][0] + (segment[1][0] - segment[0][0]) / 2,
          segment[0][1] + (segment[1][1] - segment[0][1]) / 2
        ]
      ) 
    })
    lineSegmentMidPoints.push(...midPoints)
    
    // mountable wall surface to display
    spaceShapes.push(
      ...shapes.map(shape => ({
        type: 'polyline',
        points: shape,
        style: { stroke: 0xff3300, strokeWidth: 10 }
      }))
    )

    //space.node.setHighlight({ fill: [255, 250, 230] })
  })

  // filter the mid points so that they will be 6 meters apart from each other
  const filteredPoints = filterPoints(lineSegmentMidPoints)

  const holesShape = holes.map(hole => {
    return {
      type: 'polygon',
      points: hole,

      style: { stroke: 0x800080, strokeWidth: 10 }
    }
  })

  const layer = fpe.addLayer({ id: 'facade' })
  layer.clear()
  layer.addGraphic({
    shapes: [
      //...doorShapes,
      ...spaceShapes
      
      /*
      {
        type: 'polygon',
        points: innerFacadeOffset[0],
        style: { stroke: 0x0099ff, strokeWidth: 10 }
      },
      {
        type: 'polygon',
        points: boundary.shape,
        style: { stroke: 0xff3300, strokeWidth: 10 }
      },
      {
        type: 'polygon',
        points: outline,
        style: { stroke: 0xFFA500, strokeWidth: 10 }
      },
      
      ...holesShape,
      {
        type: 'polygon',
        points: innerFacade[0],
        style: { stroke: 0x800080, strokeWidth: 10 }
      },
      */
    ]
  })  

  return filteredPoints
}

function filterPoints(points) {
  const takenPoints = []

  // Function to compute the Euclidean distance between two points.
  function getDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2))
  }
  // Function to check if a point is more than 3 units away from all the points in the takenPoints array.
  function isAwayFromAllTakenPoints(point) {
    for (let i = 0; i < takenPoints.length; i++) {
      if (getDistance(point, takenPoints[i]) <= 3) {
        return false
      }
    }
    return true
  }
  
  // Iterate over the input array of points.
  for (let i = 0; i < points.length; i++) {
    if (takenPoints.length === 0 || isAwayFromAllTakenPoints(points[i])) {
      takenPoints.push(points[i])
    }
  }
  
  return takenPoints;
}

function calculateLineLength(line) {
  const [x1, y1] = line[0];
  const [x2, y2] = line[1];
  return Math.hypot(x2 - x1, y2 - y1);
}

function polylinesToLines(polylines) {
  let lines = [];

  for (let i = 0; i < polylines.length; i++) {
    const polyline = polylines[i]
    for (let j = 0; j < polyline.length - 1; j++) {
      lines.push([polyline[j], polyline[j+1]])
    }
  }

  return lines
}