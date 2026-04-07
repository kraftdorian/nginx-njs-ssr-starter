function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_proxy_support.njs',
    required: false,
    run: function () {
        var target;
        var proxy;

        try {
            if (typeof Proxy !== 'function') {
                return fail('Proxy is not available in this njs runtime.');
            }

            target = { value: 1 };
            proxy = new Proxy(target, {
                get: function (source, key) {
                    return source[key];
                }
            });

            if (proxy.value !== 1) {
                return fail('Proxy did not forward property reads as expected.');
            }

            return pass('Proxy is available, but helper registration stays explicit without it.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
