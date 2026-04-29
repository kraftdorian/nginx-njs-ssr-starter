import render from 'examples/basic/render.njs';

function pass(details) {
    return { ok: true, details: details };
}

function fail(details) {
    return { ok: false, details: details };
}

var probe = {
    name: 'probe_example_page_rendering.njs',
    required: true,
    run: function () {
        var context = {
            method: 'GET',
            path: '/',
            host: 'localhost:8080',
            nonce: null
        };
        var html = render.renderHtmlPage(context);
        var markdown = render.renderMarkdownPage(context);

        if (html.indexOf('<!DOCTYPE html>') !== 0) {
            return fail('Rendered page does not begin with <!DOCTYPE html>.');
        }

        if (html.indexOf('<main>') === -1) {
            return fail('Rendered page is missing a <main> element.');
        }

        if (html.indexOf('Nginx NJS SSR Starter') === -1) {
            return fail('Rendered page is missing expected starter copy.');
        }

        if (markdown.indexOf('title: "Nginx NJS SSR Starter"') === -1) {
            return fail('Rendered markdown page is missing expected frontmatter title.');
        }

        if (markdown.indexOf('description: "A lightweight starter for string-first server-rendered HTML in Nginx NJS."') === -1) {
            return fail('Rendered markdown page is missing expected frontmatter description.');
        }

        if (markdown.indexOf('## What this starter demonstrates') === -1) {
            return fail('Rendered markdown page is missing expected heading content.');
        }

        if (markdown.indexOf('Method: GET') === -1 || markdown.indexOf('Path: /') === -1 || markdown.indexOf('Host: localhost:8080') === -1) {
            return fail('Rendered markdown page is missing expected request-context content.');
        }

        if (markdown.indexOf('Try extending the example by adding more views or additional `js_content` handlers.') === -1) {
            return fail('Rendered markdown page is missing expected inline code content.');
        }

        if (markdown.indexOf('<!DOCTYPE html>') !== -1 || markdown.indexOf('<main>') !== -1 || markdown.indexOf('<script') !== -1) {
            return fail('Rendered markdown page should not include HTML document wrappers or inline scripts.');
        }

        if (!render.requestWantsMarkdown({ headersIn: { Accept: 'text/markdown' } })) {
            return fail('Expected explicit Accept: text/markdown to select markdown rendering.');
        }

        if (render.requestWantsMarkdown({ headersIn: { Accept: 'text/html' } })) {
            return fail('Expected HTML Accept header to keep the HTML path.');
        }

        return pass('The example route renders both HTML and markdown from the same page AST.');
    }
};

export default probe;
