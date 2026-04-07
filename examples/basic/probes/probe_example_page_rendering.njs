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
        var html = render.renderPage({
            method: 'GET',
            path: '/',
            host: 'localhost:8080',
            nonce: null
        });

        if (html.indexOf('<!DOCTYPE html>') !== 0) {
            return fail('Rendered page does not begin with <!DOCTYPE html>.');
        }

        if (html.indexOf('<main>') === -1) {
            return fail('Rendered page is missing a <main> element.');
        }

        if (html.indexOf('Nginx NJS SSR Starter') === -1) {
            return fail('Rendered page is missing expected starter copy.');
        }

        return pass('The example route renders a complete HTML document.');
    }
};

export default probe;
