var ELEMENT_NODE = 'element';
var RAW_TEXT_NODE = 'raw-text';

var BLOCK_CONTAINER_TAGS = {
    article: true,
    aside: true,
    body: true,
    div: true,
    figcaption: true,
    figure: true,
    footer: true,
    header: true,
    main: true,
    nav: true,
    search: true,
    section: true
};

var INLINE_CONTAINER_TAGS = {
    abbr: true,
    bdi: true,
    bdo: true,
    cite: true,
    data: true,
    dfn: true,
    ins: true,
    mark: true,
    small: true,
    span: true,
    sub: true,
    sup: true,
    time: true,
    u: true,
    var: true
};

var STRONG_TAGS = {
    b: true,
    strong: true
};

var EMPHASIS_TAGS = {
    em: true,
    i: true
};

var INLINE_CODE_TAGS = {
    code: true,
    kbd: true,
    samp: true
};

var OMIT_TAGS = {
    area: true,
    audio: true,
    base: true,
    button: true,
    canvas: true,
    caption: true,
    col: true,
    colgroup: true,
    datalist: true,
    details: true,
    dialog: true,
    embed: true,
    fieldset: true,
    form: true,
    head: true,
    iframe: true,
    img: true,
    input: true,
    label: true,
    legend: true,
    link: true,
    map: true,
    meta: true,
    meter: true,
    noscript: true,
    object: true,
    optgroup: true,
    option: true,
    output: true,
    picture: true,
    progress: true,
    rp: true,
    rt: true,
    ruby: true,
    script: true,
    select: true,
    slot: true,
    source: true,
    style: true,
    summary: true,
    table: true,
    tbody: true,
    td: true,
    template: true,
    textarea: true,
    tfoot: true,
    th: true,
    thead: true,
    title: true,
    track: true,
    tr: true,
    video: true
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

function isRenderableScalar(value) {
    return typeof value === 'string' || typeof value === 'number';
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

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeNewlines(value) {
    return String(value).replace(/\r\n?/g, '\n');
}

function trimWhitespace(value) {
    return normalizeNewlines(value).replace(/^\s+|\s+$/g, '');
}

function normalizeMetadataValue(value) {
    return trimWhitespace(value).replace(/\s+/g, ' ');
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

        if (isRenderableScalar(child) || isElementNode(child) || isRawTextNode(child)) {
            target.push(child);
            continue;
        }

        throw new Error(
            'Unsupported child value of type "' + describeValue(child) + '".'
        );
    }
}

function flattenChildren(children) {
    var flattened = [];

    appendChildren(children, flattened);

    return flattened;
}

function toChildArray(node) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return [];
    }

    if (isArray(node)) {
        return flattenChildren(node);
    }

    if (isRenderableScalar(node) || isElementNode(node) || isRawTextNode(node)) {
        return [node];
    }

    throw new Error('Unsupported render root of type "' + describeValue(node) + '".');
}

function repeatCharacter(character, count) {
    var result = '';
    var index;

    for (index = 0; index < count; index += 1) {
        result += character;
    }

    return result;
}

function longestBacktickRun(value) {
    var text = String(value);
    var longest = 0;
    var current = 0;
    var index;

    for (index = 0; index < text.length; index += 1) {
        if (text.charAt(index) === '`') {
            current += 1;

            if (current > longest) {
                longest = current;
            }
        } else {
            current = 0;
        }
    }

    return longest;
}

function getAttribute(props, name) {
    var value;

    if (!isPlainObject(props) || !hasOwn(props, name)) {
        return null;
    }

    value = props[name];

    if (value === undefined || value === null || value === false || value === true) {
        return null;
    }

    return String(value);
}

function escapeYamlScalar(value) {
    return '"' + normalizeNewlines(String(value))
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n') + '"';
}

function escapeMarkdownText(value) {
    return normalizeNewlines(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\/g, '\\\\')
        .replace(/([`*_{}\[\]()#+\-!|])/g, '\\$1');
}

function escapeLinkDestination(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/>/g, '%3E');
}

function collectPlainText(node) {
    var children;
    var output;
    var index;

    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }

    if (isArray(node)) {
        children = flattenChildren(node);
        output = [];

        for (index = 0; index < children.length; index += 1) {
            output.push(collectPlainText(children[index]));
        }

        return output.join('');
    }

    if (isRenderableScalar(node)) {
        return String(node);
    }

    if (isRawTextNode(node)) {
        return normalizeNewlines(node.value);
    }

    if (isElementNode(node)) {
        if (node.tag === 'br') {
            return '\n';
        }

        return collectPlainText(node.children);
    }

    throw new Error('Unsupported plain-text input of type "' + describeValue(node) + '".');
}

function findDocumentParts(node) {
    var rootChildren;
    var metadataSource;
    var bodySource;
    var headNode = null;
    var bodyNode = null;
    var bodyCandidates = [];
    var index;
    var child;

    if (isElementNode(node) && node.tag === 'html') {
        rootChildren = flattenChildren(node.children);
    } else {
        rootChildren = toChildArray(node);
    }

    for (index = 0; index < rootChildren.length; index += 1) {
        child = rootChildren[index];

        if (isElementNode(child) && child.tag === 'head' && headNode === null) {
            headNode = child;
            continue;
        }

        if (isElementNode(child) && child.tag === 'body' && bodyNode === null) {
            bodyNode = child;
            continue;
        }

        bodyCandidates.push(child);
    }

    metadataSource = headNode ? headNode.children : rootChildren;

    if (bodyNode) {
        bodySource = flattenChildren([bodyNode.children, bodyCandidates]);
    } else {
        bodySource = bodyCandidates.length > 0 ? bodyCandidates : rootChildren;
    }

    return {
        metadataSource: metadataSource,
        bodySource: bodySource
    };
}

function collectMetadata(node) {
    var metadata = {
        title: null,
        description: null
    };

    visitMetadata(node, metadata);

    return metadata;
}

function visitMetadata(node, metadata) {
    var children;
    var index;
    var name;
    var content;
    var text;

    if (node === null || node === undefined || typeof node === 'boolean') {
        return;
    }

    if (isArray(node)) {
        children = flattenChildren(node);

        for (index = 0; index < children.length; index += 1) {
            visitMetadata(children[index], metadata);
        }

        return;
    }

    if (!isElementNode(node)) {
        return;
    }

    if (node.tag === 'title' && metadata.title === null) {
        text = normalizeMetadataValue(collectPlainText(node.children));

        if (text !== '') {
            metadata.title = text;
        }

        return;
    }

    if (node.tag === 'meta' && metadata.description === null) {
        name = getAttribute(node.props, 'name');
        content = getAttribute(node.props, 'content');

        if (name !== null && content !== null && name.toLowerCase() === 'description') {
            text = normalizeMetadataValue(content);

            if (text !== '') {
                metadata.description = text;
            }
        }

        return;
    }

    visitMetadata(node.children, metadata);
}

function renderPreamble(metadata) {
    var lines = [];

    if (metadata.title !== null) {
        lines.push('title: ' + escapeYamlScalar(metadata.title));
    }

    if (metadata.description !== null) {
        lines.push('description: ' + escapeYamlScalar(metadata.description));
    }

    if (lines.length === 0) {
        return '';
    }

    return ['---'].concat(lines).concat(['---']).join('\n');
}

function isInlineLikeNode(node) {
    var tag;

    if (node === null || node === undefined || typeof node === 'boolean') {
        return true;
    }

    if (isRenderableScalar(node) || isRawTextNode(node)) {
        return true;
    }

    if (!isElementNode(node)) {
        return false;
    }

    tag = node.tag;

    return hasOwn(INLINE_CONTAINER_TAGS, tag)
        || hasOwn(STRONG_TAGS, tag)
        || hasOwn(EMPHASIS_TAGS, tag)
        || hasOwn(INLINE_CODE_TAGS, tag)
        || tag === 'a'
        || tag === 'br'
        || tag === 'del'
        || tag === 'q'
        || tag === 's'
        || tag === 'wbr';
}

function renderInlineCode(value) {
    var content = normalizeNewlines(value).replace(/\n/g, ' ');
    var fenceLength;
    var fence;

    if (content === '') {
        return '``';
    }

    fenceLength = longestBacktickRun(content) + 1;

    if (fenceLength < 1) {
        fenceLength = 1;
    }

    fence = repeatCharacter('`', fenceLength);

    if (/^\s|\s$/.test(content) || content.charAt(0) === '`' || content.charAt(content.length - 1) === '`') {
        content = ' ' + content + ' ';
    }

    return fence + content + fence;
}

function renderInlineChildren(children) {
    var flattened = flattenChildren(children);
    var parts = [];
    var index;
    var part;

    for (index = 0; index < flattened.length; index += 1) {
        part = renderInlineNode(flattened[index]);

        if (part !== '') {
            parts.push(part);
        }
    }

    return parts.join('');
}

function renderInlineNode(node) {
    var content;
    var href;

    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }

    if (isRenderableScalar(node)) {
        return escapeMarkdownText(node);
    }

    if (isRawTextNode(node)) {
        return escapeMarkdownText(node.value);
    }

    if (isArray(node)) {
        return renderInlineChildren(node);
    }

    if (!isElementNode(node)) {
        throw new Error('Unsupported inline node of type "' + describeValue(node) + '".');
    }

    if (hasOwn(BLOCK_CONTAINER_TAGS, node.tag) || node.tag === 'html' || node.tag === 'body') {
        return renderInlineChildren(node.children);
    }

    if (hasOwn(INLINE_CONTAINER_TAGS, node.tag)) {
        return renderInlineChildren(node.children);
    }

    if (hasOwn(STRONG_TAGS, node.tag)) {
        content = renderInlineChildren(node.children);
        return content === '' ? '' : '**' + content + '**';
    }

    if (hasOwn(EMPHASIS_TAGS, node.tag)) {
        content = renderInlineChildren(node.children);
        return content === '' ? '' : '*' + content + '*';
    }

    if (hasOwn(INLINE_CODE_TAGS, node.tag)) {
        return renderInlineCode(collectPlainText(node.children));
    }

    if (node.tag === 'a') {
        content = renderInlineChildren(node.children);
        href = getAttribute(node.props, 'href');

        if (content === '' && href !== null) {
            content = escapeMarkdownText(href);
        }

        if (href === null || href === '') {
            return content;
        }

        return '[' + content + '](<' + escapeLinkDestination(href) + '>)';
    }

    if (node.tag === 'br') {
        return '\n';
    }

    if (node.tag === 'q') {
        content = renderInlineChildren(node.children);
        return content === '' ? '' : '"' + content + '"';
    }

    if (node.tag === 'del' || node.tag === 's') {
        content = renderInlineChildren(node.children);
        return content === '' ? '' : '~~' + content + '~~';
    }

    if (node.tag === 'wbr') {
        return '';
    }

    if (hasOwn(OMIT_TAGS, node.tag)) {
        return '';
    }

    return '';
}

function flushInlineBuffer(blocks, inlineParts) {
    var text;

    if (inlineParts.length === 0) {
        return;
    }

    text = trimWhitespace(inlineParts.join(''));

    inlineParts.length = 0;

    if (text !== '') {
        blocks.push(text);
    }
}

function joinBlocks(blocks) {
    var filtered = [];
    var index;
    var block;

    for (index = 0; index < blocks.length; index += 1) {
        block = trimWhitespace(blocks[index]);

        if (block !== '') {
            filtered.push(block);
        }
    }

    return filtered.join('\n\n');
}

function renderChildrenAsBlocks(children) {
    var flattened = flattenChildren(children);
    var blocks = [];
    var inlineParts = [];
    var index;
    var child;
    var block;

    for (index = 0; index < flattened.length; index += 1) {
        child = flattened[index];

        if (isInlineLikeNode(child)) {
            inlineParts.push(renderInlineNode(child));
            continue;
        }

        flushInlineBuffer(blocks, inlineParts);

        block = renderBlockNode(child);

        if (block !== '') {
            blocks.push(block);
        }
    }

    flushInlineBuffer(blocks, inlineParts);

    return joinBlocks(blocks);
}

function renderHeading(node) {
    var level = parseInt(node.tag.charAt(1), 10);
    var content = trimWhitespace(renderInlineChildren(node.children));

    if (content === '') {
        return '';
    }

    return repeatCharacter('#', level) + ' ' + content;
}

function renderParagraph(node) {
    return trimWhitespace(renderInlineChildren(node.children));
}

function renderListItem(node, number) {
    var prefix = number ? String(number) + '. ' : '- ';
    var content = renderChildrenAsBlocks(node.children);
    var lines;
    var output;
    var index;

    if (content === '') {
        return prefix.replace(/\s$/, '');
    }

    lines = normalizeNewlines(content).split('\n');
    output = prefix + lines[0];

    for (index = 1; index < lines.length; index += 1) {
        output += '\n    ' + lines[index];
    }

    return output;
}

function renderList(node, ordered) {
    var children = flattenChildren(node.children);
    var items = [];
    var itemNumber = 1;
    var index;
    var child;
    var rendered;

    for (index = 0; index < children.length; index += 1) {
        child = children[index];

        if (!isElementNode(child) || child.tag !== 'li') {
            continue;
        }

        rendered = renderListItem(child, ordered ? itemNumber : 0);

        if (rendered !== '') {
            items.push(rendered);
            itemNumber += 1;
        }
    }

    return items.join('\n');
}

function renderDefinitionEntry(term, definition) {
    var lines = normalizeNewlines(definition).split('\n');
    var output = term + ': ' + lines[0];
    var index;

    for (index = 1; index < lines.length; index += 1) {
        output += '\n    ' + lines[index];
    }

    return output;
}

function renderDefinitionList(node) {
    var children = flattenChildren(node.children);
    var blocks = [];
    var term = null;
    var definitions = [];
    var index;
    var child;
    var value;

    function flushEntry() {
        var definitionIndex;

        if (term === null) {
            return;
        }

        if (definitions.length === 0) {
            blocks.push(term);
            term = null;
            return;
        }

        for (definitionIndex = 0; definitionIndex < definitions.length; definitionIndex += 1) {
            blocks.push(renderDefinitionEntry(term, definitions[definitionIndex]));
        }

        term = null;
        definitions = [];
    }

    for (index = 0; index < children.length; index += 1) {
        child = children[index];

        if (!isElementNode(child)) {
            continue;
        }

        if (child.tag === 'dt') {
            flushEntry();
            term = trimWhitespace(renderInlineChildren(child.children));
            definitions = [];
            continue;
        }

        if (child.tag === 'dd') {
            value = renderChildrenAsBlocks(child.children);

            if (value !== '') {
                definitions.push(value);
            }
        }
    }

    flushEntry();

    return joinBlocks(blocks);
}

function renderCodeBlock(node) {
    var content;
    var fenceLength;
    var fence;

    if (node.children.length === 1 && isElementNode(node.children[0]) && node.children[0].tag === 'code') {
        content = collectPlainText(node.children[0].children);
    } else {
        content = collectPlainText(node.children);
    }

    content = normalizeNewlines(content).replace(/^\n+|\n+$/g, '');
    fenceLength = longestBacktickRun(content) + 1;

    if (fenceLength < 3) {
        fenceLength = 3;
    }

    fence = repeatCharacter('`', fenceLength);

    return fence + '\n' + content + '\n' + fence;
}

function renderBlockquote(node) {
    var content = renderChildrenAsBlocks(node.children);
    var lines;
    var output = [];
    var index;

    if (content === '') {
        return '';
    }

    lines = normalizeNewlines(content).split('\n');

    for (index = 0; index < lines.length; index += 1) {
        output.push(lines[index] === '' ? '>' : '> ' + lines[index]);
    }

    return output.join('\n');
}

function renderBlockNode(node) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }

    if (isRenderableScalar(node) || isRawTextNode(node)) {
        return trimWhitespace(renderInlineNode(node));
    }

    if (isArray(node)) {
        return renderChildrenAsBlocks(node);
    }

    if (!isElementNode(node)) {
        throw new Error('Unsupported block node of type "' + describeValue(node) + '".');
    }

    if (node.tag === 'html' || node.tag === 'body' || hasOwn(BLOCK_CONTAINER_TAGS, node.tag)) {
        return renderChildrenAsBlocks(node.children);
    }

    if (/^h[1-6]$/.test(node.tag)) {
        return renderHeading(node);
    }

    if (node.tag === 'p') {
        return renderParagraph(node);
    }

    if (node.tag === 'ul' || node.tag === 'menu') {
        return renderList(node, false);
    }

    if (node.tag === 'ol') {
        return renderList(node, true);
    }

    if (node.tag === 'dl') {
        return renderDefinitionList(node);
    }

    if (node.tag === 'li') {
        return renderListItem(node, 0);
    }

    if (node.tag === 'dt' || node.tag === 'dd') {
        return trimWhitespace(renderInlineChildren(node.children));
    }

    if (node.tag === 'pre') {
        return renderCodeBlock(node);
    }

    if (node.tag === 'blockquote') {
        return renderBlockquote(node);
    }

    if (node.tag === 'hr') {
        return '---';
    }

    if (isInlineLikeNode(node)) {
        return trimWhitespace(renderInlineNode(node));
    }

    if (hasOwn(OMIT_TAGS, node.tag)) {
        return '';
    }

    return '';
}

function renderBody(node) {
    return trimWhitespace(renderBlockNode(node));
}

function renderToString(node) {
    var parts = findDocumentParts(node);
    var metadata = collectMetadata(parts.metadataSource);
    var preamble = renderPreamble(metadata);
    var body = renderBody(parts.bodySource);

    if (preamble !== '' && body !== '') {
        return preamble + '\n\n' + body;
    }

    if (preamble !== '') {
        return preamble;
    }

    return body;
}

var runtime = {
    renderToString: renderToString
};

export default runtime;
