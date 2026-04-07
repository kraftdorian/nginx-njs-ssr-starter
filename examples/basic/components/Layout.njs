import runtime from 'lib/runtime/html.njs';
import site from 'examples/basic/content/site.njs';

var h = runtime.h;

function toChildArray(value) {
    if (value === undefined || value === null) {
        return [];
    }

    if (Object.prototype.toString.call(value) === '[object Array]') {
        return value;
    }

    return [value];
}

function buildBootScript(context) {
    var pathLiteral = JSON.stringify(String(context.path || '/'));
    var lines = [
        '(function () {',
        "    var summary = document.getElementById('request-summary');",
        '    if (!summary) {',
        '        return;',
        '    }',
        "    summary.setAttribute('data-inline-script', 'ran');",
        "    summary.setAttribute('data-request-path', " + pathLiteral + ');',
        '}());'
    ];

    return lines.join('\n');
}

function Layout(props) {
    var title = props && props.title ? props.title : site.title;
    var description = props && props.description ? props.description : site.description;
    var context = props && props.context ? props.context : {};
    var children = toChildArray(props && props.children);
    var jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: site.canonicalUrl,
        description: description
    };

    return h.html(
        { lang: site.language },
        h.head(
            h.meta({ charset: 'utf-8' }),
            h.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
            h.title(title),
            h.meta({ name: 'description', content: description }),
            h.link({ rel: 'canonical', href: site.canonicalUrl }),
            h.meta({ name: 'generator', content: 'nginx-njs-ssr-starter' }),
            runtime.jsonLd(jsonLd)
        ),
        h.body(
            h.header(
                h.p('Generic SSR starter'),
                h.h1(title),
                h.p(description)
            ),
            h.main(children),
            h.footer(
                h.p('This example keeps the render path synchronous, explicit, and build-free.'),
                h.p('Route: ' + String(context.path || '/'))
            ),
            runtime.inlineScript(buildBootScript(context), context.nonce || null)
        )
    );
}

export default Layout;
