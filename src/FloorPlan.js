import React, { useEffect, useRef } from 'react'
import { FloorPlanEngine } from '@archilogic/floor-plan-sdk'

import { startupSettings } from './utils/constants'
import { placeHub } from './helpers/placeHubs'
import { placeSensor } from './helpers/placeSensors'
import { createLine, createCircle } from './helpers/draw'
import { addMarker } from './helpers/marker'

import './FloorPlan.css'

let hasLoaded = false
let fpe
let sensorType

let hubCount
let sensorCount

const FloorPlan = ({ triggerQuery, model, modelUpdate }) => {
  const container = useRef(null);
  const { token, floorId } = model
  sensorType = model.sensorType

  console.log('model', model)
  
  function getSensors(fpe){
    const state = {
      facadeDistance: 3,
      doorDistance: 3
    }
    const sensorPoints = placeSensor(fpe, state)
    sensorCount = sensorPoints.length
    sensorPoints.forEach(sensorPoint => {
      addMarker(fpe, sensorPoint, sensorType.id)
    })
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
    if(hasLoaded === floorId) return
    hasLoaded = floorId
    fpe = new FloorPlanEngine(container.current, startupSettings)
    await fpe.loadScene(floorId, {publishableToken: token})
    return fpe
  }

  function onClick(fpe){
    fpe.on('click', (event) => {
      // const state = {
      //   facadeDistance: 3,
      //   doorDistance: 3
      // }
      // const sensorPoints = placeSensor(fpe, state)
      const hubs = placeHub(fpe)
    })
  }
  
  useEffect(() => {
    if(container.current){
      initFloorPlan()
    }
  })

  useEffect(() => {
    if(!fpe) return
    if(!sensorType) return
    getSensors(fpe)
    getHubs(fpe)
    modelUpdate({hubCount, sensorCount})
  })

  useEffect(() => {
    if(!fpe) return
    onClick(fpe)
  })
  
  return(
    <div id="floor-plan" ref={container}></div>
  )
}

export default FloorPlan