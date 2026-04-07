import runtime from 'lib/runtime/html.njs';

var h = runtime.h;

function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_runtime_core_rendering.njs',
    required: true,
    run: function () {
        var rendered;
        var expected;

        try {
            rendered = runtime.renderToString(
                h.div(
                    { className: 'hero', hidden: true, 'data-role': 'example' },
                    'Hello ',
                    h.strong('world'),
                    [' and ', h.code('njs'), '.'],
                    h.br(),
                    runtime.rawText('<span data-raw="yes">raw</span>')
                )
            );

            expected = '<div class="hero" data-role="example" hidden>Hello <strong>world</strong> and <code>njs</code>.<br><span data-raw="yes">raw</span></div>';

            if (rendered !== expected) {
                return fail('Unexpected renderer output: ' + rendered);
            }

            return pass('Core rendering, escaping, alias mapping, and array flattening work.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
