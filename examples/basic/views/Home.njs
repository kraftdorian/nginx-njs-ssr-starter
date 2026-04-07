import runtime from 'lib/runtime/html.njs';
import Layout from 'examples/basic/components/Layout.njs';
import site from 'examples/basic/content/site.njs';

var h = runtime.h;

function listItems(items) {
    var nodes = [];
    var index;

    for (index = 0; index < items.length; index += 1) {
        nodes.push(h.li(items[index]));
    }

    return nodes;
}

function Home(props) {
    var context = props && props.context ? props.context : {};

    return Layout({
        context: context,
        title: site.title,
        description: site.description,
        children: [
            h.section(
                h.h2('What this starter demonstrates'),
                h.ul(listItems(site.summaryPoints))
            ),
            h.section(
                h.h2('Request context'),
                h.p('The handler creates request-local context once and passes it into the root view.'),
                h.dl(
                    h.dt('Method'),
                    h.dd(String(context.method || 'GET')),
                    h.dt('Path'),
                    h.dd(String(context.path || '/')),
                    h.dt('Host'),
                    h.dd(String(context.host || 'localhost:8080'))
                )
            ),
            h.section(
                { id: 'request-summary' },
                h.h2('Runtime notes'),
                h.p('Unsafe HTML is escaped by default, raw output is explicit, and event attributes are rejected.'),
                h.p(
                    'Try extending the example by adding more views or additional ',
                    h.code('js_content'),
                    ' handlers.'
                )
            )
        ]
    });
}

export default Home;
