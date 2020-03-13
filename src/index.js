const Matter = require('matter-js')
const mousetrap = require('mousetrap')
const Metaesquema = require('metaesquema-util')
const instruments = require('./instruments')

/**
 * Matter submodules
 */
const Engine = Matter.Engine
const Render = Matter.Render
const Runner = Matter.Runner
const Body = Matter.Body
const Bodies = Matter.Bodies
const World = Matter.World
const Mouse = Matter.Mouse
const MouseConstraint = Matter.MouseConstraint
const Events = Matter.Events
const Common = Matter.Common

const MatterCollision = require('matter-collision')
const MatterCollisionStyles = require('./lib/matter-collision-styles')

let BACKGROUND_COLOR_LOOP = new Metaesquema.Array.Loop([
  'black',
  'white',
])

let COLOR_LOOP = new Metaesquema.Array.Loop([
  '#711619',
  '#041C3A',
  '#D5D6D8',
])

let NOTES_LOOP = new Metaesquema.Array.Loop([
  'C2',
  'F2',
  'F2',
  // 'G5',
  'C2',
  // 'G5',
  'C2',
  'F2',
  // 'G5',
])

let SOUND_BODIES_OPTIONS_LOOP = new Metaesquema.Array.Loop([
  {
    radius: 17,
    render: {
      strokeStyle: '#000000',
      lineWidth: 10,
      fillStyle: 'transparent',
    },
    collision: {
      start: (collision) => {
        instruments.chords[0].triggerAttack(NOTES_LOOP.next())
      }
    }
  },
  {
    radius: 20,
    render: {
      strokeStyle: '#000000',
      lineWidth: 2,
      fillStyle: 'transparent',
    },
    collision: {
      start: (collision) => {
        instruments.chords[1].triggerAttack(NOTES_LOOP.next())
      }
    }
  }
])

function setup(options) {
  const CANVAS_WIDTH = options.canvasWidth
  const CANVAS_HEIGHT = options.canvasHeight
  let canvas = options.canvas

  if (!canvas) {
    throw new Error('canvas is required')
  }
  
  if (!CANVAS_WIDTH) {
    throw new Error('CANVAS_WIDTH is required')
  }
  
  if (!CANVAS_HEIGHT) {
    throw new Error('CANVAS_HEIGHT is required')
  }

  if (options.plugins) {
  	options.plugins.forEach(plugin => {
  		Matter.use(plugin)
  	})
  }

  // create engine
  let engine = Engine.create({
  	// enable sleeping as we are collision heavy users
  	// enableSleeping: true
  })

  engine.world.gravity.x = 0
  engine.world.gravity.y = 0

  // create renderer
  let render = Render.create({
  	canvas: canvas,
  	engine: engine,
  	options: {
  		wireframes: false,
      // showPositions: true,
      // showAngleIndicator: true,
  		background: '#FFFFFF',
  		pixelRatio: 1,

  		width: CANVAS_WIDTH,
  		height: CANVAS_HEIGHT,
  	}
  })
  Render.run(render)

  // create engine runner
  let runner = Metaesquema.Matter.Runner.createMixedRunner(engine)
  runner.run()

  let wallGenerator = Metaesquema.Matter.Bodies.walls({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  })

  let walls = [
    wallGenerator.top({
      label: 'CEILING',
      restitution: 1,
    }),

    wallGenerator.bottom({
      label: 'GROUND',
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
    }),

    wallGenerator.left({
      label: 'LEFT',
      isStatic: true,
      restitution: 1,
    }),

    wallGenerator.right({
      label: 'RIGHT',
      isStatic: true,
      restitution: 1,
    }),
	]

  World.add(engine.world, walls)

  let fixedBodies = [
    Bodies.rectangle(
      CANVAS_WIDTH * 0.25,
      CANVAS_HEIGHT * 0.36,
      CANVAS_WIDTH * 0.3,
      CANVAS_HEIGHT * 0.45,
      {
        label: 'fixed-large-1',
        angle: 2 * Math.PI * -15 / 360,
        isStatic: true,
        restitution: 1,
        plugin: {
          collision: {
            start: (e) => {
              // instruments.polySynths[0].triggerAttackRelease(['C3','E4','G4'], 0.01)
            },
          }
        },
        render: {
          fillStyle: '#282829',
        },
      }
    ),
    Bodies.rectangle(
      CANVAS_WIDTH * .7,
      CANVAS_HEIGHT * 1/2,
      CANVAS_WIDTH * 0.3,
      CANVAS_HEIGHT * 0.30,
      {
        label: 'fixed-large-2',
        angle: 2 * Math.PI * 8 / 360,
        isStatic: true,
        restitution: 1,
        plugin: {
          collision: {
            start: (e) => {
              // instruments.polySynths[1].triggerAttackRelease(['G3','B4','D4'], 0.01)
            },
          }
        },
        render: {
          fillStyle: '#282829',
        },
      }
    ),
    Bodies.rectangle(
      CANVAS_WIDTH * 0.5,
      CANVAS_HEIGHT * 4/5,
      CANVAS_WIDTH * .20,
      CANVAS_HEIGHT * 0.15,
      {
        label: 'fixed-large-3',
        // angle: 2 * Math.PI * 15 / 360,
        isStatic: true,
        restitution: 1,
        plugin: {
          collision: {
            start: (e) => {
              // instruments.polySynths[2].triggerAttackRelease(['E3','G4','B5'], 0.01)
            },
          }
        },
        render: {
          fillStyle: '#282829',
        },
      }
    ),
    Bodies.rectangle(
      CANVAS_WIDTH * 0.55,
      CANVAS_HEIGHT * 1/6,
      CANVAS_WIDTH * .20,
      CANVAS_HEIGHT * 0.15,
      {
        label: 'fixed-large-3',
        angle: 2 * Math.PI * 7 / 360,
        isStatic: true,
        restitution: 1,
        plugin: {
          collision: {
            start: (e) => {
              // instruments.polySynths[2].triggerAttackRelease(['E3','G4','B5'], 0.01)
            },
          }
        },
        render: {
          fillStyle: '#282829',
        },
      }
    ),
  ]

  World.add(engine.world, fixedBodies)


  // add mouse control
  let mouse = Mouse.create(render.canvas)
  let mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      // allow bodies on mouse to rotate
      angularStiffness: 0,
      render: {
        visible: false
      }
    }
  })

  World.add(engine.world, mouseConstraint);

  // keep the mouse in sync with rendering
  render.mouse = mouse;


  return {
  	engine: engine,
    isPlaying: false,

    targetX: CANVAS_WIDTH,
    targetY: 0,

    injectBody: function () {
      let sourcePosition = {
        x: CANVAS_WIDTH * 0.1,
        y: CANVAS_HEIGHT * 0.9,
      }

      let bodyOptions = SOUND_BODIES_OPTIONS_LOOP.next()




    // Bodies.circle(600, 250, 17, {
    //   restitution: 1,
    //   friction: 0,
    //   frictionAir: 0,
    //   frictionStatic: 0,
    //   slop: 0,
    //   density: 100,
    //   // inertia: Infinity,
    //   render: {
    //     strokeStyle: '#000000',
    //     lineWidth: 10,
    //     fillStyle: 'transparent',
    //   },
    //   plugin: {
    //     collision: {
    //       start: (collision) => {
    //         instruments.chords[0].triggerAttackRelease()
    //       }
    //     },
    //   },
    // }),
    // Bodies.circle(600, 250, 20, {
    //   restitution: 1,
    //   friction: 0,
    //   frictionAir: 0,
    //   frictionStatic: 0,
    //   slop: 0,
    //   density: 100,
    //   // inertia: Infinity,
    //   render: {
    //     strokeStyle: '#000000',
    //     lineWidth: 2,
    //     fillStyle: 'transparent',
    //   },
    //   plugin: {
    //     collision: {
    //       start: (collision) => {
    //         instruments.chords[0].triggerAttackRelease()
    //       }
    //     },
    //   },
    // }),

      // let targetDirection = 

      let body = Bodies.circle(
        sourcePosition.x,
        sourcePosition.y,
        bodyOptions.radius,
        {
          restitution: 1,
          friction: 0,
          frictionAir: 0,
          frictionStatic: 0,
          slop: 0,
          density: 0.0001,
          // inertia: Infinity,
          render: bodyOptions.render,
          plugin: {
            collision: bodyOptions.collision,
          }
        }
      )

      World.add(engine.world, body)

      let forceMagnitude = 0.004

      let direction = Matter.Vector.normalise(
        Matter.Vector.sub(
          {
            x: this.targetX,
            y: this.targetY
          },
          sourcePosition
        )
      )

      let force = Matter.Vector.mult(direction, forceMagnitude)

      // apply force to elements
      Body.applyForce(body, body.position, force)

    },

  	stop: function () {
      this.isPlaying = false

      runner.stop()
  	}
  }
}


let config = {
  canvasWidth: window.innerWidth,
  canvasHeight: window.innerHeight,
  canvas: document.querySelector('canvas'),
  plugins: [
  	// new MatterCollisionStyles(),
    Metaesquema.Matter.Plugins.maxVelocity({
      maxVelocity: 10,
    }),
    new MatterCollision({
      collisionMomentumUpperThreshold: 1000,
    })
  ]
}

let app = setup(config)

let mousePositionElement = document.querySelector('#mouse-position')
document.querySelector('body').addEventListener('mousemove', e => {
  mousePositionElement.innerHTML = `${e.clientX}x${e.clientY}`
})

// document.querySelector('body').addEventListener('click', e => {
//   if (app.isPlaying) {
//     app.stop()
//   } else {
//     app.play()
//   }
// })

document.querySelector('body').addEventListener('mousemove', e => {
  let x = e.clientX
  let y = e.clientY

  app.targetX = x
  app.targetY = y
})

document.querySelector('body').addEventListener('click', e => {
  app.injectBody()
})

mousetrap.bind('space', (e) => {
  app.stop()
})

// setInterval(function () {
//   app.injectBody()
// }, 200)

