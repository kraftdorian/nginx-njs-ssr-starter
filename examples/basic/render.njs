import runtime from 'lib/runtime/html.njs';
import markdown from 'lib/runtime/markdown.njs';
import Home from 'examples/basic/views/Home.njs';

function createRequestContext(r) {
    var headersIn = r && r.headersIn ? r.headersIn : {};
    var variables = r && r.variables ? r.variables : {};

    return {
        method: r && r.method ? r.method : 'GET',
        path: r && r.uri ? r.uri : '/',
        host: headersIn.host ? headersIn.host : (headersIn.Host ? headersIn.Host : 'localhost:8080'),
        nonce: variables.example_nonce ? variables.example_nonce : null
    };
}

function buildPageNode(context) {
    return Home({ context: context });
}

function renderHtmlPage(context) {
    return '<!DOCTYPE html>' + runtime.renderToString(buildPageNode(context));
}

function renderMarkdownPage(context) {
    return markdown.renderToString(buildPageNode(context));
}

function requestWantsMarkdown(r) {
    var headersIn = r && r.headersIn ? r.headersIn : {};
    var accept = headersIn.accept ? headersIn.accept : (headersIn.Accept ? headersIn.Accept : '');
    var values;
    var index;
    var mediaType;

    if (!accept) {
        return false;
    }

    values = String(accept).split(',');

    for (index = 0; index < values.length; index += 1) {
        mediaType = values[index].split(';')[0].replace(/^\s+|\s+$/g, '').toLowerCase();

        if (mediaType === 'text/markdown') {
            return true;
        }
    }

    return false;
}

function appendVaryAccept(headersOut) {
    var existing;
    var lower;

    if (!headersOut) {
        return;
    }

    existing = headersOut.Vary ? headersOut.Vary : headersOut['Vary'];

    if (!existing) {
        headersOut['Vary'] = 'Accept';
        return;
    }

    lower = String(existing).toLowerCase();

    if (lower.indexOf('accept') === -1) {
        headersOut['Vary'] = String(existing) + ', Accept';
    }
}

function renderPage(context) {
    return renderHtmlPage(context);
}

function handle(r) {
    var body;
    var context;
    var message;
    var wantsMarkdown;

    try {
        context = createRequestContext(r);
        wantsMarkdown = requestWantsMarkdown(r);
        body = wantsMarkdown ? renderMarkdownPage(context) : renderHtmlPage(context);
        appendVaryAccept(r.headersOut);
        r.headersOut['Content-Type'] = wantsMarkdown
            ? 'text/markdown; charset=utf-8'
            : 'text/html; charset=utf-8';
        r.return(200, body);
    } catch (error) {
        message = error && error.message ? error.message : String(error);

        if (r && typeof r.warn === 'function') {
            r.warn('SSR render failure: ' + message);
        }

        appendVaryAccept(r.headersOut);
        r.headersOut['Content-Type'] = 'text/plain; charset=utf-8';
        r.return(500, 'Internal Server Error');
    }
}

var renderModule = {
    buildPageNode: buildPageNode,
    renderHtmlPage: renderHtmlPage,
    renderMarkdownPage: renderMarkdownPage,
    requestWantsMarkdown: requestWantsMarkdown,
    handle: handle,
    renderPage: renderPage,
    createRequestContext: createRequestContext
};

export default renderModule;
