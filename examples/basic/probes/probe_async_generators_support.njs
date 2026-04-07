function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_async_generators_support.njs',
    required: false,
    run: function () {
        var factory;
        var generatorFactory;

        try {
            factory = new Function('return async function* probe() { yield 1; };');
            generatorFactory = factory();

            if (typeof generatorFactory !== 'function') {
                return fail('Async generator syntax parsed, but no function was returned.');
            }

            return pass('Async generators are available, but the starter does not depend on them.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
