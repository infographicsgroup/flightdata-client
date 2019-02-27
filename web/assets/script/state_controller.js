"use strict"

var stateController = (function () {
	var state = {
		globe:  true,
		airport:false,
		intro:  true,
		credits:false,
	}

	var listeners = {};

	return {
		onChange: function (event, cb) { addListener(event, cb) },
		showGlobe: function () {
			if (!state.globe) changeState({ globe: true, airport: false })
		},
		showAirport: function (airport) {
			if (state.airport !== airport) changeState({globe: !airport, airport: airport})
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
