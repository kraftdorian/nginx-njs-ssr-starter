import runtime from 'lib/runtime/html.njs';

var h = runtime.h;

function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

function expectFailure(work) {
    try {
        work();
        return false;
    } catch (error) {
        return true;
    }
}

var probe = {
    name: 'probe_runtime_attribute_validation.njs',
    required: true,
    run: function () {
        var failures = [];

        if (!expectFailure(function () {
            runtime.renderToString(h.button({ onclick: 'alert(1)' }, 'Nope'));
        })) {
            failures.push('Expected on* attributes to fail fast.');
        }

        if (!expectFailure(function () {
            runtime.renderToString(h.div({ style: { color: 'red' } }, 'Nope'));
        })) {
            failures.push('Expected object-valued attributes to fail fast.');
        }

        if (!expectFailure(function () {
            runtime.renderToString(h.img({ src: '/logo.png' }, 'child'));
        })) {
            failures.push('Expected void elements with children to fail fast.');
        }

        if (failures.length > 0) {
            return fail(failures.join(' '));
        }

        return pass('Attribute validation rejects unsafe or unsupported input.');
    }
};

export default probe;
