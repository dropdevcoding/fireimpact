var EventManager = (function () {
    "use strict";
    var EventManager,
        _curId = 0,
        _listeners = {},
        _listenersExist,
        _getNextId;

    _getNextId = function () {
        return ++_curId;
    };

    _listenersExist = function (instance, eventName) {
        var id = instance._instanceId;

        if (!id || !_listeners[id] || !_listeners[id].events || !_listeners[id].events[eventName]) {
            return false;
        }

        return true;
    };

    EventManager = function () {};
    EventManager.prototype = {
        addListener: function (instance, eventName, fn, scope, single) {
            var listenersStub = {events: {}, suspended: false},
                eventsStub = {def: {stack: [], suspended: false}},
                id;

            single = single || false;
            id = instance._instanceId || _getNextId();
            instance._instanceId = id;
            scope = scope || instance;
            _listeners[id] = _listeners[id] || listenersStub;
            _listeners[id].events[eventName] = _listeners[id].events[eventName] || eventsStub;
            _listeners[id].events[eventName].def.stack.push({
                fn: fn,
                scope: scope,
                single: single
            });

        },
        removeListener: function (instance, eventName, fn, scope) {
            var id = instance._instanceId,
                eventStack,
                eventDef,
                index;

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
            if (!id || !_listeners[id]) {
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
        apply: function (obj) {
            var eventMgr = this;
            obj.on = function (event, callback, scope, single) {
                eventMgr.addListener(this, event, callback, scope, single);
            };

            obj.un = function (event, callback, scope) {
                eventMgr.removeListener(this, event, callback, scope);
            };

            obj.fire = function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(this);
                eventMgr.fireEvent.apply(eventMgr, args);
            };

            obj.suspendEvents = function () {
                eventMgr.suspendEvents(this);
            };

            obj.resumeEvents = function () {
                eventMgr.resumeEvents(this);
            };

            obj.suspendEvent = function (eventName) {
                eventMgr.suspendEvent(this, eventName);
            };

            obj.resumeEvent = function (eventName) {
                eventMgr.resumeEvent(this, eventName);
            };

            return obj;
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
