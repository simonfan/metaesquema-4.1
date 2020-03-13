const aux = require('./auxiliary')

const MATTER_SOUND_DEFAULTS = {
	audios: []
}

const VOLUME_MAGNITUDE_MAX = 6000
const VOLUME_MAGNITUDE_MIN = 500

function MatterSound(options) {
	options = Object.assign({}, MATTER_SOUND_DEFAULTS, options)

	this.ready = Promise.all(options.audios.map(audioDef => {
		if (!audioDef.name || !audioDef.src) {
			throw new Error('invalid audioDef')
		}

		return aux.loadAudio(audioDef.src)
	}))
	.then(audioElements => {
		this.audios = audioElements.map((element, index) => {
			let def = options.audios[index]
			def.element = element

			return def
		})

		return this
	})
}

MatterSound.prototype.name = 'matter-sound' // PLUGIN_NAME
MatterSound.prototype.version = '0.0.0' // PLUGIN_VERSION
MatterSound.prototype.for = 'matter-js@^0.12.0'

MatterSound.prototype.install = function (Matter) {


	this.Matter = Matter

	let self = this

  this.Matter.after('Body.create', function () {
    self.initBody(this)
  })

  this.Matter.after('Engine.create', function () {
  	self.initEngine(this)
  })
}

MatterSound.prototype.initBody = function (body) {
	body.plugin.sound = body.plugin.sound || {}

	body.plugin.sound = Object.assign({

	}, body.plugin.sound)
}

MatterSound.prototype.initEngine = function (engine) {

  this.Matter.Events.on(engine, 'beforeUpdate', function () {
		/**
		 * As suggested at
		 * https://github.com/liabru/matter-js/issues/155
		 */
    engine.world.bodies.forEach(function (body) {
      body._velocity = Object.assign({}, body.velocity)
    })
  })


  // an example of using collisionStart event on an engine
  this.Matter.Events.on(engine, 'collisionStart', event => {
    let pairs = event.pairs

    pairs.forEach(pair => {
    	/**
    	 * As suggested at
    	 * https://github.com/liabru/matter-js/issues/155
    	 */
   //  	let bodyAMomentum = this.Matter.Vector.mult(
   //  		pair.bodyA._velocity || {x: 0, y: 0},
   //  		pair.bodyA.mass === Infinity ? 0 : pair.bodyA.mass
   //  	)
			// let bodyBMomentum = this.Matter.Vector.mult(
			// 	pair.bodyB._velocity || {x: 0, y: 0},
			// 	pair.bodyB.mass === Infinity ? 0 : pair.bodyB.mass
			// )
			// let relativeMomentum = this.Matter.Vector.sub(bodyAMomentum, bodyBMomentum)
			// let relativeMomentumMagnitude = this.Matter.Vector.magnitude(relativeMomentum)

			// if (relativeMomentumMagnitude >= VOLUME_MAGNITUDE_MIN) {
			// 	// TODO: this is a hack
			// 	let volume = Math.min(
			// 		relativeMomentumMagnitude / VOLUME_MAGNITUDE_MAX,
			// 		1
			// 	)

	  //   	this.playBodyCollisionAudio(pair.bodyA, {
	  //   		volume: volume
	  //   	})
	  //   	this.playBodyCollisionAudio(pair.bodyB, {
	  //   		volume: volume
	  //   	})
			// }
			
			if (pair.bodyA.plugin.sound.selfOnly) {
	    	this.playBodyCollisionAudio(pair.bodyA, {
	    		otherBody: pair.bodyB,
	    		volume: 1
	    	})
			} else if (pair.bodyB.plugin.sound.selfOnly) {
	    	this.playBodyCollisionAudio(pair.bodyB, {
	    		otherBody: pair.bodyA,
	    		volume: 1
	    	})
			} else {
	    	this.playBodyCollisionAudio(pair.bodyA, {
	    		otherBody: pair.bodyB,
	    		volume: 1
	    	})
	    	this.playBodyCollisionAudio(pair.bodyB, {
	    		otherBody: pair.bodyA,
	    		volume: 1
	    	})
			}





      // pair.bodyA.previousFillStyle = pair.bodyA.render.fillStyle
      // pair.bodyB.previousFillStyle = pair.bodyB.render.fillStyle

      // pair.bodyA.render.fillStyle = '#333'
      // pair.bodyB.render.fillStyle = '#333'
    })
  })

  // an example of using collisionActive event on an engine
  this.Matter.Events.on(engine, 'collisionActive', event => {
    let pairs = event.pairs

    // change object colours to show those in an active collision (e.g. resting contact)
    pairs.forEach(pair => {
      // pair.bodyA.render.fillStyle = '#333'
      // pair.bodyB.render.fillStyle = '#333'
    })
  });

  // an example of using collisionEnd event on an engine
  this.Matter.Events.on(engine, 'collisionEnd', event => {
    let pairs = event.pairs

    // change object colours to show those ending a collision
    pairs.forEach(pair => {
      // pair.bodyA.render.fillStyle = pair.bodyA.previousFillStyle || '#222'
      // pair.bodyB.render.fillStyle = pair.bodyB.previousFillStyle || '#222'
    })

  })

}

MatterSound.prototype.playBodyCollisionAudio = function (body, options) {
	options = Object.assign({
		volume: 1,
	}, options)

	if (typeof body.plugin.sound.audio === 'string') {
		let bodyAudio = this.audios.find(audio => {
			return audio.name === body.plugin.sound.audio
		})

		if (bodyAudio) {

			if (typeof bodyAudio === 'function') {
				
			} else {

				// clone the node so that all plays
				// of the same sound are kept separate and
				// may be executed simultaneously and their configurations
				// may be independent
				let clonedAudioElement = bodyAudio.element.cloneNode()

				clonedAudioElement.volume = options.volume
				clonedAudioElement.play()
			}
		}
	} else if (typeof body.plugin.sound.audio === 'function') {

		// 
		body.plugin.sound.audio.call(null, body, options.otherBody, options)
	}

	// HACK FOR ALTERNATE AUDIOS
	if (body.plugin.sound.alternateAudios) {
		let currentAudioIndex = body.plugin.sound.currentAudioIndex || 0
		let targetAudioIndex = body.plugin.sound.alternateAudios.length > currentAudioIndex + 1 ?
			currentAudioIndex + 1 : 0

		let targetAudio = this.audios.find(audio => {
			return audio.name === body.plugin.sound.alternateAudios[targetAudioIndex]
		})

		console.log(`play ${targetAudio.name}`)

		if (targetAudio) {
			// clone the node so that all plays
			// of the same sound are kept separate and
			// may be executed simultaneously and their configurations
			// may be independent
			let clonedAudioElement = targetAudio.element.cloneNode()

			clonedAudioElement.volume = options.volume
			clonedAudioElement.play()

			body.plugin.sound.currentAudioIndex = targetAudioIndex
		}
	}
}

module.exports = MatterSound
