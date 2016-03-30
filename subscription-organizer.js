SubscriptionOrganizer = function ({connection = Meteor.connection, waitTimeUntilUnsubscribe = 60000} = {}) {
    const _subs = {};
    let _timeOut = waitTimeUntilUnsubscribe;
    let _connection = connection;

    function subscribe(...params) {
        const key = EJSON.stringify(params);
        if (_subs[key]) {
            _subs[key]._count++;
            if (_subs[key]._countDeps) {
                _subs[key]._countDeps.changed();
            }
            if (typeof _subs[key]._tId !== 'undefined') {
                Meteor.clearTimeout(_subs[key]._tId);
                delete _subs[key]._tId;
            }
            return _subs[key];
        }
        _subs[key] = _connection.subscribe(...params);
        _subs[key]._tasks = [];
        _subs[key]._stop = _subs[key].stop;
        _subs[key]._count = 1;
        _subs[key].count = () => {
            if (!_subs[key]._countDeps) {
                _subs[key]._countDeps = new Tracker.Dependency();
            }
            _subs[key]._countDeps.depend();
            return _subs[key]._count;
        };
        _subs[key].autorun = func => {
            _subs[key]._tasks.push(Tracker.autorun(computation => {
                if (_subs[key].ready()) {
                    func.call(SubscriptionOrganizer, _subs[key], computation)
                }
            }));
        };
        _subs[key].stop = () => {
            _subs[key]._count--;
            if (_subs[key]._countDeps) {
                _subs[key]._countDeps.changed();
            }
            if (_subs[key]._count < 1) {
                _subs[key]._tId = Meteor.setTimeout(() => {
                    if (_subs[key]._count < 1) {
                        _subs[key]._tasks.forEach(computation => computation.stop());
                        _subs[key]._stop();
                        delete _subs[key];
                    }
                }, _timeOut);
            }
        };
        return _subs[key];
    }

    Object.assign(this, {
        _subs,
        setConfig ({waitTimeUntilUnsubscribe = _timeOut, connection = Meteor.connection}) {
            _timeOut = waitTimeUntilUnsubscribe;
            _connection = connection
        },
        subscribe
    });
};


Object.assign(SubscriptionOrganizer, new SubscriptionOrganizer());

/**
 * @deprecated please use SubscriptionOrganizer instead
 * @type {SubscriptionOrganizer}
 */
SubscriptionImprover = SubscriptionOrganizer;