import runtime from 'lib/runtime/html.njs';

function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_runtime_script_helpers.njs',
    required: true,
    run: function () {
        var jsonLdHtml;
        var scriptHtml;
        var moduleHtml;

        try {
            jsonLdHtml = runtime.renderToString(
                runtime.jsonLd({ name: 'Example </script>' })
            );
            scriptHtml = runtime.renderToString(
                runtime.inlineScript('console.log("</script>");')
            );
            moduleHtml = runtime.renderToString(
                runtime.inlineModule('export default 1;', 'nonce-123')
            );

            if (jsonLdHtml.indexOf('\\u003C/script\\u003E') === -1) {
                return fail('jsonLd() did not escape a closing script sequence.');
            }

            if (scriptHtml.indexOf('\\u003C/script\\u003E') === -1) {
                return fail('inlineScript() did not escape a closing script sequence.');
            }

            if (moduleHtml !== '<script nonce="nonce-123" type="module">export default 1;</script>') {
                return fail('inlineModule() rendered unexpected output: ' + moduleHtml);
            }

            return pass('Script helpers escape inline content and render nonce/type attributes correctly.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
