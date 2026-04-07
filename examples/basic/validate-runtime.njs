import probeMapSupport from 'examples/basic/probes/probe_map_support.njs';
import probeAsyncGeneratorsSupport from 'examples/basic/probes/probe_async_generators_support.njs';
import probeProxySupport from 'examples/basic/probes/probe_proxy_support.njs';
import probeRuntimeCoreRendering from 'examples/basic/probes/probe_runtime_core_rendering.njs';
import probeRuntimeAttributeValidation from 'examples/basic/probes/probe_runtime_attribute_validation.njs';
import probeRuntimeScriptHelpers from 'examples/basic/probes/probe_runtime_script_helpers.njs';
import probeExamplePageRendering from 'examples/basic/probes/probe_example_page_rendering.njs';

var PROBES = [
    probeMapSupport,
    probeAsyncGeneratorsSupport,
    probeProxySupport,
    probeRuntimeCoreRendering,
    probeRuntimeAttributeValidation,
    probeRuntimeScriptHelpers,
    probeExamplePageRendering
];

function writeLine(text) {
    if (typeof console !== 'undefined' && console && typeof console.log === 'function') {
        console.log(text);
        return;
    }

    if (typeof print === 'function') {
        print(text);
    }
}

function runProbe(probe) {
    var result;

    try {
        result = probe.run();

        return {
            name: probe.name,
            required: !!probe.required,
            ok: !!(result && result.ok),
            details: result && result.details ? result.details : ''
        };
    } catch (error) {
        return {
            name: probe.name,
            required: !!probe.required,
            ok: false,
            details: error && error.message ? error.message : String(error)
        };
    }
}

function summarize(results) {
    var summary = {
        passed: 0,
        failed: 0,
        requiredPassed: 0,
        requiredFailed: 0
    };
    var index;
    var result;

    for (index = 0; index < results.length; index += 1) {
        result = results[index];

        if (result.ok) {
            summary.passed += 1;

            if (result.required) {
                summary.requiredPassed += 1;
            }
        } else {
            summary.failed += 1;

            if (result.required) {
                summary.requiredFailed += 1;
            }
        }
    }

    return summary;
}

function printSummary(results) {
    var summary = summarize(results);
    var index;
    var result;
    var verdict = summary.requiredFailed === 0 ? 'SAFE TO USE' : 'NOT SAFE TO USE';

    writeLine('NJS runtime validation summary');
    writeLine('');
    writeLine('Passed: ' + summary.passed + '/' + results.length);
    writeLine('Failed: ' + summary.failed + '/' + results.length);
    writeLine('Required passed: ' + summary.requiredPassed + '/' + (summary.requiredPassed + summary.requiredFailed));

    if (summary.failed > 0) {
        writeLine('');
        writeLine('Failed probes:');

        for (index = 0; index < results.length; index += 1) {
            result = results[index];

            if (!result.ok) {
                writeLine('- ' + result.name + (result.required ? ' (required)' : ' (informational)'));

                if (result.details) {
                    writeLine('  ' + result.details);
                }
            }
        }
    }

    writeLine('');
    writeLine('Final verdict: ' + verdict);

    return verdict;
}

function exitIfNeeded(results) {
    var summary = summarize(results);

    if (summary.requiredFailed === 0) {
        return;
    }

    if (typeof process !== 'undefined' && process && typeof process.exit === 'function') {
        process.exit(1);
        return;
    }

    throw new Error('Required runtime probes failed.');
}

function runAll() {
    var results = [];
    var index;

    for (index = 0; index < PROBES.length; index += 1) {
        results.push(runProbe(PROBES[index]));
    }

    printSummary(results);
    exitIfNeeded(results);

    return results;
}

runAll();
