import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadGLTFModel } from '../lib/model'
import { DogContainer } from './voxel-dog-loader'


const VoxelDog = (props) => {
  const { rotate } = props;
  const refContainer = useRef()
  const refRenderer = useRef()
  const urlDogGLB = (process.env.NODE_ENV === 'production' ? 'https://craftzdog.global.ssl.fastly.net/homepage' : '') + '/model1.glb'
  

 

  const handleWindowResize = useCallback(() => {
    const { current: renderer } = refRenderer
    const { current: container } = refContainer
    if (container && renderer) {
      const scW = container.clientWidth
      const scH = container.clientHeight

      renderer.setSize(scW, scH)
    }
  }, [])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const { current: container } = refContainer
    if (container) {
      const scW = container.clientWidth
      const scH = container.clientHeight

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(scW, scH)
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement)
      refRenderer.current = renderer
      const scene = new THREE.Scene()

      const target = new THREE.Vector3(-1, 1.3, 0) // Adjusted X position to move the object to the left
      const initialCameraPosition = new THREE.Vector3(
        10 * Math.sin(2 * Math.PI),
        40,
        100 * Math.cos(5 * Math.PI)
      )

      const scale = scH * 0.002 + 5.8
      const camera = new THREE.OrthographicCamera(
        -scale,
        scale,
        scale,
        -scale,
        0.3,
        500
      )
      camera.position.copy(initialCameraPosition)
      camera.lookAt(target)

      const ambientLight = new THREE.AmbientLight(0xcccccc, Math.PI)
      scene.add(ambientLight)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.autoRotate = true
      controls.target = target

      loadGLTFModel(scene, urlDogGLB, {
        receiveShadow: false,
        castShadow: false
      }).then(() => {
        animate()
      })

      let req = null
      let frame = 0
      const maxFrame = 300; // Maximum frame for 160 degree rotation
      const animate = () => {
        req = requestAnimationFrame(animate)

        frame = frame <= 100 ? frame + 1 : maxFrame  

        if (frame <= 100) {
          const p = initialCameraPosition
          // Adjusted position to move the object to the rightconst rotSpeed = -easeOutCirc(frame / 100) * Math.PI * rotate

          camera.position.y = 4
          camera.position.x = 
            p.x * Math.cos(80) + p.z * Math.sin(80)
          camera.position.z =
            p.z * Math.cos(80) - p.x * Math.sin(80)
          camera.lookAt(target)
        } else {
          // controls.update()
        }
        
        renderer.render(scene, camera)
      }

      return () => {
        cancelAnimationFrame(req)
        renderer.domElement.remove()
        renderer.dispose()
      }
    }
  }, [rotate])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize, false)
    return () => {
      window.removeEventListener('resize', handleWindowResize, false)
    }
  }, [handleWindowResize])

  return (
    <DogContainer ref={refContainer}/>
  )
}

export default VoxelDog
