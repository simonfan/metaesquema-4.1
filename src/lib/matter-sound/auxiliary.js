exports.loadAudio = function (audioSrc) {

	return new Promise((resolve, reject) => {
		let audio = new Audio(audioSrc)

		function _removeEventListeners() {
			audio.removeEventListener('error', _reject)
			audio.removeEventListener('canplaythrough', _resolve)
			audio.removeEventListener('loadeddata', _resolve)
		}

		function _reject(err) {
			_removeEventListeners()
			reject(err)
		}

		function _resolve() {
			_removeEventListeners()
			resolve(audio)
		}

		audio.addEventListener('error', _reject)
		audio.addEventListener('canplaythrough', _resolve)
		audio.addEventListener('loadeddata', _resolve)
	})
}
