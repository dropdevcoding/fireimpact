var EventManager = (function () {
	var EventManager,
		_curId = 0,
		_listeners = {},
		_getNextId;

	_getNextId = function () {
		return ++_curId;
	};

	_listenersExist = function (instance, eventName) {
		id = instance._instanceId;

		if (!id || !_listeners[id] || !_listeners[id].events || !_listeners[id].events[eventName]) {
			return false;
		}
		
		return true;
	};

	EventManager = function () {};
	EventManager.prototype = {
		addListener: function (instance, eventName, fn, scope, single) {
			var listeners = {events: {}, suspended: false},
				events = {def: {stack:[], suspended:false}},
				id;
				
			single = single || false;
			id = instance._instanceId || _getNextId();
			instance._instanceId = id;		
			scope = scope || instance;
			_listeners[id] = _listeners[id] || listeners;
			_listeners[id].events[eventName] = _listeners[id].events[eventName] || events;
			_listeners[id].events[eventName].def.stack.push({fn: fn, scope: scope, single: single});
			console.log(single);
		},
		removeListener: function (instance, eventName, fn, scope) {
			var id = instance._instanceId;
			if (!_listenersExist(instance, eventName)) {
				return;
			}

			eventStack = _listeners[id].events[eventName].def.stack;

			for (index in eventStack) {
				eventDef = eventStack[index];
				if (typeof eventDef !== 'object') {
					continue;
				}

				if (eventDef.fn === fn && eventDef.scope === scope) {
					delete eventStack[index];
					break;
				}
			}			
		},
		fireEvent: function (instance, eventName) {
			var args = Array.prototype.slice.call(arguments, 0),
				eventStack,
				eventDef,
				listeners,
				index,
				id;

			// remove instance and eventName from arguments
			args.shift();
			args.shift();

			if (!_listenersExist(instance, eventName)) {
				return;
			}
			
			id = instance._instanceId;
			listeners = _listeners[id].events[eventName];
			if (_listeners[id].suspended || listeners.def.suspended) {
				return;
			}

			eventStack = listeners.def.stack;
			for (index in eventStack) {
				eventDef = eventStack[index];
				
				if (typeof eventDef !== 'object') {
					continue;
				}

				eventDef.fn.apply(eventDef.scope, args);

				if (eventDef.single) {
					this.removeListener(instance, eventName, eventDef.fn, eventDef.scope);
				}
			}
		},
		suspendEvents: function (instance) {
			var id = instance._instanceId;
			if (!id || !_listeners[id]) {
				return;
			}

			_listeners[id].suspended = true;
		},
		suspendEvent: function (instance, eventName) {
			var id = instance._instanceId;
			if (!_listenersExist(instance, eventName)) {
				return;
			}
			_listeners[id].events[eventName].def.suspended = true;
		},
		resumeEvents: function (instance) {
			var id = instance._instanceId;
			if (!_listenersExist(instance, eventName)) {
				return;
			}
			_listeners[id].suspended = false;
		},
		resumeEvent: function (instance, eventName) {
			var id = instance._instanceId;
			if (!_listenersExist(instance, eventName)) {
				return;
			}
			_listeners[id].events[eventName].def.suspended = false;
		},
		apply: function (clazz) {
			var eventMgr = this;
			clazz.on = function (event, callback, scope, single) {
				eventMgr.addListener(this, event, callback, scope, single);
			};
			
			clazz.un = function (event, callback, scope) {
				eventMgr.removeListener(this, event, callback, scope);
			};
			
			clazz.fire = function () {
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(this);
				eventMgr.fireEvent.apply(EventManager, args);
			};

			clazz.suspendEvents = function () {
				eventMgr.suspendEvents(this);
			};

			clazz.resumeEvents = function () {
				eventMgr.resumeEvents(this);
			};
			
			clazz.suspendEvent = function (eventName) {
				eventMgr.suspendEvent(this, eventName);
			};

			clazz.resumeEvent = function (eventName) {
				eventMgr.resumeEvent(this, eventName);
			};		
			
			return clazz;		
		}
	};
	return new EventManager();
}());


ig.module
(
	'plugins.events'
)
.defines(function () {
	EventManager.apply(ig.Class.prototype);
});
