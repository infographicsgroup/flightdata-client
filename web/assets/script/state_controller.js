"use strict"

var stateController = (function () {
	var state = {
		globe:    true,
		airport:  false,
		intro:    true,
		credits:  false,
		colorMode:0,
	}

	var listeners = {};

	return {
		on: function (event, cb) { addListener(event, cb) },
		get: function (key) { return state[key] },
		showGlobe: function () {
			if (!state.globe) changeState({globe:true, airport:false, intro:false, })
		},
		showAirport: function (airport) {
			if (state.airport !== airport) changeState({globe:!airport, airport:airport, intro:false, })
		},
		setColorMode: function (colorMode) {
			changeState({colorMode:colorMode})
		},
		trigger: function (event) {
			triggerListeners(event, state[event], state[event]);
		},
	}

	function addListener(event, cb) {
		if (!listeners[event]) listeners[event] = [];
		listeners[event].push(cb);
	}

	function triggerListeners(event, newValue, oldValue) {
		if (!listeners[event]) return;
		listeners[event].forEach(function (listener) {
			listener(newValue, oldValue);
		})
	}

	function changeState(newState) {
		Object.keys(newState).forEach(function (key) {
			if (newState[key] === state[key]) return;
			triggerListeners(key, newState[key], state[key]);
			state[key] = newState[key];
		})
	}
})()
