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
    name: 'probe_runtime_markdown_rendering.njs',
    required: true,
    run: function () {
        var rendered;
        var expected;

        try {
            rendered = markdown.renderToString(
                h.html(
                    h.head(
                        h.title('Example page'),
                        h.meta({ name: 'description', content: 'Markdown output from the same AST.' }),
                        h.meta({ charset: 'utf-8' })
                    ),
                    h.body(
                        h.header(h.h1('Hello agents')),
                        h.main(
                            h.p('Plain ', h.strong('text'), ' with ', h.code('njs'), '.'),
                            h.ul(
                                h.li('One'),
                                h.li(h.a({ href: 'https://example.invalid/docs' }, 'Docs'))
                            ),
                            h.script('ignore me')
                        )
                    )
                )
            );

            expected = [
                '---',
                'title: "Example page"',
                'description: "Markdown output from the same AST."',
                '---',
                '',
                '# Hello agents',
                '',
                'Plain **text** with `njs`.',
                '',
                '- One',
                '- [Docs](<https://example.invalid/docs>)'
            ].join('\n');

            if (rendered !== expected) {
                return fail('Unexpected markdown renderer output: ' + rendered);
            }

            return pass('Markdown rendering emits frontmatter, headings, paragraphs, lists, and links from the HTML AST.');
        } catch (error) {
            return fail(error && error.message ? error.message : String(error));
        }
    }
};

export default probe;
