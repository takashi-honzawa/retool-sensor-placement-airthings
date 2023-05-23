import { distancePoint2d, Line2d, Point2d, Polygon } from '@archilogic/scene-structure'

// TODO:    Add support for polyline to closestPointOnPolygon function in SceneStructure library
//          and remove this inline function.  New function needs to return the line segment
//          that the point is on as well
export function closestPointOnPolyline(pt, polygon) {
  // map input
  const pXy = {
    x: pt[0],
    y: pt[1]
  }
  let aXys = polygon.map(p => ({
    x: p[0],
    y: p[1]
  }))
  // this algorithm wants duplicated endpoints
  //if (!isEqualPoint(polygon[0], polygon[polygon.length - 1], 0.000001)) aXys.push(aXys[0])

  let minDist, fTo, x, y, i, dist, segment //, fFrom
  if (aXys.length > 1) {
    for (var n = 1; n < aXys.length; n++) {
      if (aXys[n].x != aXys[n - 1].x) {
        var a = (aXys[n].y - aXys[n - 1].y) / (aXys[n].x - aXys[n - 1].x)
        var b = aXys[n].y - a * aXys[n].x
        dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1)
      } else dist = Math.abs(pXy.x - aXys[n].x)
      // length^2 of line segment
      var rl2 = Math.pow(aXys[n].y - aXys[n - 1].y, 2) + Math.pow(aXys[n].x - aXys[n - 1].x, 2)
      // distance^2 of pt to end line segment
      var ln2 = Math.pow(aXys[n].y - pXy.y, 2) + Math.pow(aXys[n].x - pXy.x, 2)
      // distance^2 of pt to begin line segment
      var lnm12 = Math.pow(aXys[n - 1].y - pXy.y, 2) + Math.pow(aXys[n - 1].x - pXy.x, 2)
      // minimum distance^2 of pt to infinite line
      var dist2 = Math.pow(dist, 2)
      // calculated length^2 of line segment
      var calcrl2 = ln2 - dist2 + lnm12 - dist2
      // redefine minimum distance to line segment (not infinite line) if necessary
      if (calcrl2 > rl2) dist = Math.sqrt(Math.min(ln2, lnm12))

      if (minDist == null || minDist > dist) {
        if (calcrl2 > rl2) {
          if (lnm12 < ln2) {
            fTo = 0 //nearer to previous point
            // fFrom = 1
          } else {
            // fFrom = 0 //nearer to current point
            fTo = 1
          }
        } else {
          // perpendicular from point intersects line segment
          fTo = Math.sqrt(lnm12 - dist2) / Math.sqrt(rl2)
          // fFrom = ((Math.sqrt(ln2 - dist2)) / Math.sqrt(rl2))
        }
        minDist = dist
        i = n
        segment = [aXys[n], aXys[n - 1]] // pass back the actual line segment that contains the closest point
      }
    }

    var dx = aXys[i - 1].x - aXys[i].x
    var dy = aXys[i - 1].y - aXys[i].y

    x = aXys[i - 1].x - dx * fTo
    y = aXys[i - 1].y - dy * fTo
  }
  // map output
  return { x: x, y: y, segment: segment } //{ 'x': x, 'y': y, 'i': i, 'fTo': fTo, 'fFrom': fFrom }
}

// closestPointOnPolygon only checks against polygons (not arrays of polygons), so loop over an array
export function closestPointOnPolygons(point, polygons) {
  const closestPoints = polygons.map(polygon => {
    const closest = closestPointOnPolyline(point, polygon)
    const segment = closest.segment
    return {
      point: [closest.x, closest.y],
      segment: [
        [segment[0].x, segment[0].y],
        [segment[1].x, segment[1].y]
      ]
    }
  })
  closestPoints.sort((a, b) => {
    const distanceA = distancePoint2d(point, a.point)
    const distanceB = distancePoint2d(point, b.point)

    return distanceA - distanceB
  })
  return closestPoints[0]
}

export function angle(cx, cy, ex, ey) {
  var dy = ey - cy
  var dx = ex - cx
  var theta = Math.atan2(dy, dx) // range (-PI, PI]
  theta *= 180 / Math.PI // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta
}