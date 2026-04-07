import runtime from 'lib/runtime/html.njs';
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

function renderPage(context) {
    return '<!DOCTYPE html>' + runtime.renderToString(Home({ context: context }));
}

function handle(r) {
    var body;
    var context;
    var message;

    try {
        context = createRequestContext(r);
        body = renderPage(context);
        r.headersOut['Content-Type'] = 'text/html; charset=utf-8';
        r.return(200, body);
    } catch (error) {
        message = error && error.message ? error.message : String(error);

        if (r && typeof r.warn === 'function') {
            r.warn('SSR render failure: ' + message);
        }

        r.headersOut['Content-Type'] = 'text/plain; charset=utf-8';
        r.return(500, 'Internal Server Error');
    }
}

var renderModule = {
    handle: handle,
    renderPage: renderPage,
    createRequestContext: createRequestContext
};

export default renderModule;
