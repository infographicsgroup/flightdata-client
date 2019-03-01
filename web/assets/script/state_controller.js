"use strict"

var stateController = (function () {
	var state = {
		airport:       false,
		intro:         false,
		credits:       false,
		globeLegend:   true,
		airportLegend: false,
		colorMode:     0,
	}

	var listeners = {};

	var me = {
		on: function (event, cb, trigger) {
			addListener(event, cb);
			if (trigger) me.trigger(event);
		},
		remove: removeListener,
		get: function (key) { return state[key] },
		set: changeState,
		trigger: function (event) {
			triggerListeners(event, state[event], state[event]);
		},
	}

	return me;

	function addListener(event, cb) {
		if (!listeners[event]) listeners[event] = [];
		listeners[event].push(cb);
	}

	function removeListener(event, func) {
		listeners[event] = listeners[event].filter(function (f) { return f !== func });
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
