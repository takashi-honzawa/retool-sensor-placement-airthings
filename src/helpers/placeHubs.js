import {
  getMergedSpace,
  pointInPolygon,
  polygonOffset,
  polygonDifference,
  structureElsForSpace,
  polygonBounds,
  polygonIntersection,
  getContour
} from '@archilogic/scene-structure'

import { feetToMeters } from '@archilogic/toolbox'
import { angle, closestPointOnPolygons } from './common'

export function placeHub(fpe /*, state*/){
  // all the globals + conversion to metric
  const wallOffsetInFt = 3
  const maxHubDistanceInFt = 70
  const wallOffset = feetToMeters({ feet: wallOffsetInFt })
  const maxHubDistance = feetToMeters({ feet: maxHubDistanceInFt })
  
  const productId = '!94d91d4c-06e8-42bc-aaf6-5852b19e59de'

  let pointsArray = []
  let spaceShapes = []
  let sensors = []

  let doorContours = fpe.scene.nodesByType.door.map(node => {
    let contour = getContour(node.getWorldPosition())
    return polygonOffset([contour], 0.1)[0]
  })

  // get the boundary and outline shapes of the floor plan
  const { boundary, outline } = getMergedSpace(fpe.scene)
  let boundingBox = fpe.getSceneBoundingBox()
  const exteriorWallOffset = wallOffset || 1

  // contract the boundary shape by the wall offset to get a smaller shape
  const innerFacade = polygonOffset(polygonOffset([boundary.shape], 1), -1)
  let innerFacadeOffset = polygonOffset(innerFacade, -exteriorWallOffset)
  boundingBox = polygonBounds(innerFacadeOffset)

  // if there's a terrance, subtract it from the boundary shape calculation
  const terraceShapes = fpe.resources.spaces
    .filter(space => space.usage === 'terrace')
    .flatMap(space => polygonOffset(space.polygons, exteriorWallOffset))

  innerFacadeOffset = terraceShapes.length
    ? polygonDifference(innerFacadeOffset, terraceShapes)
    : innerFacadeOffset

  const wallPolylinesArray = []

  for (const space of fpe.resources.spaces) {
    if (space.usage === ('void' || 'shaft' || 'restroom')) continue

    const { walls } = structureElsForSpace({
      scene: fpe.scene,
      uuid: space.id
    })

    let wallPolylines = walls.polylines

    if (wallPolylines.length) {
      // intersect with inner facade offset ( red line )
      const intersection = polygonIntersection(wallPolylines, innerFacadeOffset, true)
      if (intersection[0]?.length) {
        wallPolylines = intersection
      }

      // cut away door shapes
      const shapes = polygonDifference(wallPolylines, doorContours, null, true)
      if (shapes[0]) {
        wallPolylines = polygonDifference(shapes, doorContours, null, true)
      }

      wallPolylinesArray.push(...wallPolylines)
    }
  }

  // create a placement grid
  for (let i = boundingBox.x + maxHubDistance / 2; i < boundingBox.length; i = i + maxHubDistance) {
    for (
      let j = boundingBox.z + maxHubDistance / 2;
      j < boundingBox.width;
      j = j + maxHubDistance
    ) {
      const point = [i, j]
      const inOffsetPolygon = pointInPolygon(point, innerFacadeOffset[0])

      // skip any points that fall outside the wall offset
      if (inOffsetPolygon) {
        pointsArray.push(point)
      }
    }
  }

  pointsArray.forEach(point => {
    // place a sensor on the closest point on the closest wall in that space
    const closestPoint = closestPointOnPolygons(point, wallPolylinesArray)
    const segment = closestPoint.segment
    const identifiedShape = {
      type: 'polyline',
      points: segment,
      props: { stroke: 0x00ff00, strokeWidth: 20 }
    }
    spaceShapes.push(identifiedShape)
    const sensorPoint = [closestPoint.point[0], closestPoint.point[1]]
    const rotation = angle(segment[0][0], segment[0][1], segment[1][0], segment[1][1])
    sensors.push({
      point: sensorPoint,
      src: productId,
      rotation: rotation
    })
  })

  return sensors
}