import HTML_TAGS from 'lib/runtime/tags.njs';

var ELEMENT_NODE = 'element';
var RAW_TEXT_NODE = 'raw-text';

var VOID_ELEMENTS = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    source: true,
    track: true,
    wbr: true
};

var ATTRIBUTE_ALIASES = {
    acceptCharset: 'accept-charset',
    autoComplete: 'autocomplete',
    autoFocus: 'autofocus',
    className: 'class',
    colSpan: 'colspan',
    crossOrigin: 'crossorigin',
    encType: 'enctype',
    formAction: 'formaction',
    formEncType: 'formenctype',
    formMethod: 'formmethod',
    formNoValidate: 'formnovalidate',
    formTarget: 'formtarget',
    htmlFor: 'for',
    httpEquiv: 'http-equiv',
    inputMode: 'inputmode',
    maxLength: 'maxlength',
    minLength: 'minlength',
    noValidate: 'novalidate',
    readOnly: 'readonly',
    referrerPolicy: 'referrerpolicy',
    rowSpan: 'rowspan',
    srcDoc: 'srcdoc',
    srcSet: 'srcset',
    tabIndex: 'tabindex',
    useMap: 'usemap'
};

function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
}

function isPlainObject(value) {
    return value !== null
        && typeof value === 'object'
        && Object.prototype.toString.call(value) === '[object Object]';
}

function isElementNode(value) {
    return isPlainObject(value) && value.nodeType === ELEMENT_NODE;
}

function isRawTextNode(value) {
    return isPlainObject(value) && value.nodeType === RAW_TEXT_NODE;
}

function isNode(value) {
    return isElementNode(value) || isRawTextNode(value);
}

function isRenderableScalar(value) {
    return typeof value === 'string' || typeof value === 'number';
}

function toArray(args, startIndex) {
    var items = [];
    var index = startIndex || 0;

    for (; index < args.length; index += 1) {
        items.push(args[index]);
    }

    return items;
}

function describeValue(value) {
    if (value === null) {
        return 'null';
    }

    if (value === undefined) {
        return 'undefined';
    }

    if (isArray(value)) {
        return 'array';
    }

    if (isElementNode(value)) {
        return 'element node';
    }

    if (isRawTextNode(value)) {
        return 'raw-text node';
    }

    return typeof value;
}

function ensureTagName(tag) {
    if (typeof tag !== 'string' || tag.length === 0) {
        throw new Error('h(tag, props, ...children) requires a non-empty string tag.');
    }

    if (!/^[A-Za-z][A-Za-z0-9:-]*$/.test(tag)) {
        throw new Error('Unsupported tag name: "' + tag + '".');
    }

    return tag;
}

function rawText(value) {
    return {
        nodeType: RAW_TEXT_NODE,
        value: value === undefined || value === null ? '' : String(value)
    };
}

function normalizeElementInput(tag, props, children) {
    var resolvedProps = {};
    var resolvedChildren = children;

    if (props === undefined || props === null) {
        resolvedProps = {};
    } else if (isPlainObject(props) && !isNode(props)) {
        resolvedProps = props;
    } else {
        resolvedChildren = [props].concat(children);
    }

    return {
        nodeType: ELEMENT_NODE,
        tag: ensureTagName(tag),
        props: resolvedProps,
        children: flattenChildren(resolvedChildren)
    };
}

function h(tag, props) {
    return normalizeElementInput(tag, props, toArray(arguments, 2));
}

function flattenChildren(children) {
    var flattened = [];

    appendChildren(children, flattened);

    return flattened;
}

function appendChildren(children, target) {
    var index;
    var child;

    for (index = 0; index < children.length; index += 1) {
        child = children[index];

        if (child === null || child === undefined || typeof child === 'boolean') {
            continue;
        }

        if (isArray(child)) {
            appendChildren(child, target);
            continue;
        }

        if (isRenderableScalar(child) || isNode(child)) {
            target.push(child);
            continue;
        }

        throw new Error(
            'Unsupported child value of type "' + describeValue(child) + '".'
        );
    }
}

function escapeHtmlText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeScriptText(value) {
    return String(value)
        .replace(/&/g, '\\u0026')
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeAttributeName(name) {
    var canonicalName;

    if (/^on/i.test(name)) {
        throw new Error('Event handler attributes are not supported: "' + name + '".');
    }

    canonicalName = hasOwn(ATTRIBUTE_ALIASES, name) ? ATTRIBUTE_ALIASES[name] : name;

    if (!/^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(canonicalName)) {
        throw new Error('Unsupported attribute name: "' + canonicalName + '".');
    }

    return canonicalName;
}

function validateAttributeValue(name, value) {
    if (value === undefined || value === null || value === false || value === true) {
        return;
    }

    if (isRenderableScalar(value)) {
        return;
    }

    throw new Error(
        'Unsupported value for attribute "' + name + '": ' + describeValue(value) + '.'
    );
}

function collectAttributes(props) {
    var rawKeys;
    var attributes;
    var index;
    var rawName;
    var canonicalName;
    var value;

    if (!isPlainObject(props)) {
        throw new Error('Element props must be a plain object.');
    }

    rawKeys = Object.keys(props).sort();
    attributes = {};

    for (index = 0; index < rawKeys.length; index += 1) {
        rawName = rawKeys[index];
        value = props[rawName];

        if (rawName === 'children') {
            throw new Error('Use positional children instead of props.children.');
        }

        canonicalName = normalizeAttributeName(rawName);

        if (hasOwn(attributes, canonicalName)) {
            throw new Error(
                'Duplicate attribute after alias normalization: "' + canonicalName + '".'
            );
        }

        validateAttributeValue(canonicalName, value);

        if (value === undefined || value === null || value === false) {
            continue;
        }

        attributes[canonicalName] = value;
    }

    return attributes;
}

function renderAttributes(props) {
    var attributes = collectAttributes(props);
    var names = Object.keys(attributes).sort();
    var parts = [];
    var index;
    var name;
    var value;

    for (index = 0; index < names.length; index += 1) {
        name = names[index];
        value = attributes[name];

        if (value === true) {
            parts.push(' ' + name);
            continue;
        }

        parts.push(' ' + name + '="' + escapeHtmlAttribute(value) + '"');
    }

    return parts.join('');
}

function renderChildren(children) {
    var output = [];
    var index;

    for (index = 0; index < children.length; index += 1) {
        output.push(renderToString(children[index]));
    }

    return output.join('');
}

function renderElement(node) {
    var openingTag = '<' + node.tag + renderAttributes(node.props) + '>';

    if (hasOwn(VOID_ELEMENTS, node.tag)) {
        if (node.children.length > 0) {
            throw new Error('Void element "' + node.tag + '" cannot have children.');
        }

        return openingTag;
    }

    return openingTag + renderChildren(node.children) + '</' + node.tag + '>';
}

function renderToString(node) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }

    if (isArray(node)) {
        return renderChildren(flattenChildren(node));
    }

    if (isElementNode(node)) {
        return renderElement(node);
    }

    if (isRawTextNode(node)) {
        return node.value;
    }

    if (isRenderableScalar(node)) {
        return escapeHtmlText(node);
    }

    throw new Error('Unsupported render root of type "' + describeValue(node) + '".');
}

function jsonLd(data) {
    var json = JSON.stringify(data);

    if (json === undefined) {
        throw new Error('jsonLd(data) requires JSON-serializable input.');
    }

    return h('script', { type: 'application/ld+json' }, rawText(escapeScriptText(json)));
}

function inlineScript(code, nonce) {
    var props = {};
    var source = code === undefined || code === null ? '' : String(code);

    if (nonce !== undefined && nonce !== null && nonce !== '') {
        props.nonce = nonce;
    }

    return h('script', props, rawText(escapeScriptText(source)));
}

function inlineModule(code, nonce) {
    var props = { type: 'module' };
    var source = code === undefined || code === null ? '' : String(code);

    if (nonce !== undefined && nonce !== null && nonce !== '') {
        props.nonce = nonce;
    }

    return h('script', props, rawText(escapeScriptText(source)));
}

function attachTagHelper(tag) {
    h[tag] = function (props) {
        var args = [tag];
        var index;

        for (index = 0; index < arguments.length; index += 1) {
            args.push(arguments[index]);
        }

        return h.apply(null, args);
    };
}

function attachTagHelpers() {
    var index;

    for (index = 0; index < HTML_TAGS.length; index += 1) {
        attachTagHelper(HTML_TAGS[index]);
    }
}

attachTagHelpers();

var runtime = {
    h: h,
    rawText: rawText,
    renderToString: renderToString,
    jsonLd: jsonLd,
    inlineScript: inlineScript,
    inlineModule: inlineModule
};

export default runtime;
