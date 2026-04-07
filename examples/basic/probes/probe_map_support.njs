function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_map_support.njs',
    required: false,
    run: function () {
        var map;

        try {
            if (typeof Map !== 'function') {
                return fail('Map is not available in this njs runtime.');
            }

            map = new Map();
            map.set('starter', 'ok');

            if (map.get('starter') !== 'ok') {
                return fail('Map did not preserve a stored value.');
            }

            return pass('Map is available, but the starter does not depend on it.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
