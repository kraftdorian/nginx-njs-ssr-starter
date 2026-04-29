import runtime from 'lib/runtime/html.njs';
import markdown from 'lib/runtime/markdown.njs';

var h = runtime.h;

function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_runtime_markdown_safety.njs',
    required: true,
    run: function () {
        var rendered;

        try {
            rendered = markdown.renderToString(
                h.html(
                    h.head(
                        h.title('Safety Example'),
                        h.meta({ name: 'description', content: 'Metadata only.' })
                    ),
                    h.body(
                        h.p('Keep ', h.span('this'), ' visible.'),
                        runtime.rawText('<script>alert("x")</script>'),
                        h.video(h.p('Drop me entirely.'))
                    )
                )
            );

            if (rendered.indexOf('title: "Safety Example"') === -1) {
                return fail('Expected title metadata in markdown preamble.');
            }

            if (rendered.indexOf('description: "Metadata only."') === -1) {
                return fail('Expected description metadata in markdown preamble.');
            }

            if (rendered.indexOf('Keep this visible.') === -1) {
                return fail('Expected span content to unwrap into visible markdown text.');
            }

            if (rendered.indexOf('&lt;script&gt;alert\\("x"\\)&lt;/script&gt;') === -1) {
                return fail('Expected rawText content to be escaped into safe markdown text.');
            }

            if (rendered.indexOf('Drop me entirely.') !== -1) {
                return fail('Unsupported tags should omit their children from markdown output.');
            }

            if (rendered.indexOf('<meta') !== -1 || rendered.indexOf('<title') !== -1) {
                return fail('Head metadata should not leak into the markdown body as HTML.');
            }

            return pass('Markdown mode escapes raw text, omits unsupported subtrees, and keeps metadata in the preamble.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
