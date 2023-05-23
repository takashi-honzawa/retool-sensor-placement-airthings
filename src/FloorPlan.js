import React, { useEffect, useRef } from 'react';
import { FloorPlanEngine } from '@archilogic/floor-plan-sdk'

import { placeHub } from './helpers/placeHubs'
import { startupSettings } from './utils/constants'
import './FloorPlan.css'

let hasLoaded = false
let fpe

let hubCount
let spaceProCount
let co2MiniCount

const FloorPlan = ({ triggerQuery, model, modelUpdate }) => {
  const container = useRef(null);
  const { token, floorId } = model
  
  console.log('model', model)
  
  function addMarker(fpe, pos, className){
    const el = document.createElement('div')
    el.classList.add(className)
    const marker = fpe.addHtmlMarker({
      pos: pos,
      el
    })
    return marker
  }

  function getSensors(fpe){
    const spaces = fpe.resources.spaces
    const selectedSpaces = spaces.filter(space => {
      return space.program !== 'void' && space.program !== 'circulate' && space.program !== 'care' && space.usage !== 'undefined'
    })
    let miniCount = 0
    let proCount = 0
    selectedSpaces.forEach(space => {
      if(space.area < (100 / 10.764)){
        addMarker(fpe, [space.center[0], space.center[1]], 'co2-mini')
        miniCount += 1
      } else {
        addMarker(fpe, [space.center[0], space.center[1]], 'space-pro')
        proCount += 1
      }
    })
    spaceProCount = proCount
    co2MiniCount = miniCount
  }
  function getHubs(fpe){
    const hubs = placeHub(fpe)
    hubCount = hubs.length
    hubs.forEach(hub => {
      addMarker(fpe, hub.point, 'hub-marker')
    })
  }
  
  async function initFloorPlan(){
    if(!token || !floorId) return
    fpe = new FloorPlanEngine(container.current, startupSettings)
      await fpe.loadScene(floorId, {publishableToken: token})
      hasLoaded = floorId
      return fpe
  }
  
  useEffect(() => {
    if(fpe && hasLoaded === floorId) return
    if(container.current){
      initFloorPlan()
      .then((fpe) => {
        getHubs(fpe)
        getSensors(fpe)
        modelUpdate({hubCount, spaceProCount, co2MiniCount})
      })
    }
  })
  
  return(
    <div id="floor-plan" ref={container}></div>
  )
}

export default FloorPlan