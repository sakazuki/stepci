"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderLoadTest = exports.renderAnalyticsMessage = exports.renderFeedbackMessage = exports.renderSummary = exports.renderStep = exports.renderStepSummary = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_highlight_1 = require("cli-highlight");
const labels_json_1 = require("./../labels.json");
const utils_1 = require("./utils");
const GitHubHighlightTheme = {
    tag: chalk_1.default.hex('#7ee787'),
    name: chalk_1.default.hex('#7ee787'),
    meta: chalk_1.default.hex('#7ee787'),
    attr: chalk_1.default.hex('#7ee787'),
    string: chalk_1.default.hex('#79c0ff'),
    number: chalk_1.default.hex('#79c0ff'),
    attribute: chalk_1.default.hex('#ff7b72'),
    default: chalk_1.default.hex('#c9d1d9'),
    'selector-tag': chalk_1.default.hex('#ff7b72'),
    'selector-pseudo': chalk_1.default.hex('#ff7b72'),
    'selector-id': chalk_1.default.hex('#ff7b72')
};
function renderSpaces(spaces) {
    return ' '.repeat(spaces);
}
function shouldDisplayBody(contentType) {
    // Treat empty content-type as displayable
    if (!contentType) {
        return true;
    }
    const displayableTypes = [
        /^text\//,
        /application\/(x-)?(json|xml|csv|javascript|ecmascript)/,
        /application\/.*\+(json|xml)$/, // Matches MIME types that end with +json or +xml
    ];
    // Normalize content type to handle cases with parameters like charset
    const normalizedType = contentType.split(';')[0].trim();
    return displayableTypes.some(pattern => pattern.test(normalizedType));
}
function renderHTTPRequest(request) {
    const requestHeaders = request.headers ? Object.keys(request.headers).map(header => `${header}: ${request.headers ? request.headers[header] : ''}\n`) : '';
    const requestBody = typeof request.body === 'string' ? '\n' + request.body : '';
    return `${request.method} ${request.url} ${request.protocol}\n${requestHeaders.toString().replace(',', '')}${requestBody}`;
}
function renderHTTPResponse(response) {
    const responseHeaders = response.headers ? Object.keys(response.headers).map(header => `${header}: ${response.headers ? response.headers[header] : ''}\n`) : '';
    let responseBody;
    if (shouldDisplayBody(response.contentType || undefined)) {
        responseBody = '\n' + Buffer.from(response.body).toString();
    }
    else {
        responseBody = '\nResponse body not displayed due to unsupported Content-Type';
    }
    return `${response.protocol} ${response.status} ${response.statusText}\n${responseHeaders.toString().replaceAll(',', '')}${responseBody}`;
}
function renderStepSummary(steps) {
    console.log(`\n${chalk_1.default.bold('Summary')}\n`);
    steps.forEach(step => {
        if (step.passed) {
            console.log(renderSpaces(2) + chalk_1.default.green('✔ ') + chalk_1.default.bold(step.name || step.id) + ' passed after ' + step.duration / 1000 + 's');
        }
        else if (step.skipped) {
            console.log(renderSpaces(2) + chalk_1.default.yellow('⚠︎ ') + chalk_1.default.bold(step.name || step.id) + ' skipped after ' + step.duration / 1000 + 's');
        }
        else if (!step.passed) {
            console.log(renderSpaces(2) + chalk_1.default.red('✕ ') + chalk_1.default.bold(step.name || step.id) + ' failed after ' + step.duration / 1000 + 's');
        }
    });
}
exports.renderStepSummary = renderStepSummary;
function renderStep(step, options) {
    if (step.errored || step.skipped) {
        console.log(chalk_1.default.yellowBright(`\n⚠︎ ${step.testId} › ${step.name}`));
        return console.log('\n' + step.errorMessage + '\n');
    }
    if (step.passed) {
        console.log(chalk_1.default.greenBright(`\n✔ ${step.testId} › ${step.name}`));
        if (!options?.verbose)
            return;
    }
    else {
        console.log(chalk_1.default.redBright(`\n● ${step.testId} › ${step.name}`));
    }
    renderRequestResponse(step.type, step.request, step.response);
    if (step.captures) {
        console.log(chalk_1.default.bold('\nCaptures\n'));
        console.log((0, cli_highlight_1.highlight)(JSON.stringify(step.captures, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
    }
    if (step.cookies) {
        console.log(chalk_1.default.bold('\nCookies\n'));
        console.log((0, cli_highlight_1.highlight)(JSON.stringify(step.cookies, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
    }
    if (step.checks) {
        console.log(chalk_1.default.bold('\nChecks'));
        const checks = step.checks;
        for (const check in checks) {
            if (['jsonpath', 'jsonata', 'xpath', 'headers', 'messages', 'selector', 'cookies', 'performance', 'captures', 'ssl'].includes(check)) {
                for (const component in checks[check]) {
                    renderStepCheck(labels_json_1.labels[check] + chalk_1.default.gray(' > ') + component, checks[check][component], options);
                }
            }
            else {
                renderStepCheck(labels_json_1.labels[check], checks[check], options);
            }
        }
    }
}
exports.renderStep = renderStep;
function renderRequestResponse(type, request, response) {
    if (type === 'http') {
        console.log(chalk_1.default.bold(`\nRequest ${chalk_1.default.bold.bgGray(' HTTP ')}\n`));
        console.log((0, cli_highlight_1.highlight)(renderHTTPRequest(request), { language: 'http', ignoreIllegals: true, theme: GitHubHighlightTheme }));
        console.log(chalk_1.default.bold(`Response\n`));
        console.log((0, cli_highlight_1.highlight)(renderHTTPResponse(response), { language: 'http', ignoreIllegals: true, theme: GitHubHighlightTheme }));
    }
    if (type === 'sse') {
        console.log(chalk_1.default.bold(`\nRequest ${chalk_1.default.bold.bgGray(' SSE ')}\n`));
        console.log((0, cli_highlight_1.highlight)(JSON.stringify(request, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
        console.log(chalk_1.default.bold(`\nResponse\n`));
        console.log((0, cli_highlight_1.highlight)((response?.body).toString(), { language: 'txt', ignoreIllegals: true, theme: GitHubHighlightTheme }));
    }
    if (type === 'grpc') {
        console.log(chalk_1.default.bold(`\nRequest ${chalk_1.default.bold.bgGray(' GRPC ')}\n`));
        console.log((0, cli_highlight_1.highlight)(JSON.stringify(request, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
        console.log(chalk_1.default.bold(`\nResponse\n`));
        console.log((0, cli_highlight_1.highlight)(JSON.stringify(response?.body, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
    }
}
function renderStepCheck(label, check, options) {
    console.log('\n' + (check.passed ? chalk_1.default.green('✔ ') : chalk_1.default.red('✕ ')) + label);
    if (!check.passed || options?.verbose) {
        console.log(chalk_1.default.gray('\nExpected\n'));
        if ((0, utils_1.isJSON)(check.expected)) {
            console.log((0, cli_highlight_1.highlight)(JSON.stringify(check.expected, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
        }
        else {
            console.log(check.expected);
        }
        console.log(chalk_1.default.gray('\nGiven\n'));
        if ((0, utils_1.isJSON)(check.given)) {
            console.log((0, cli_highlight_1.highlight)(JSON.stringify(check.given, null, 2), { language: 'json', ignoreIllegals: true, theme: GitHubHighlightTheme }));
        }
        else {
            console.log(check.given);
        }
    }
}
function renderSummary(result) {
    const passedTests = result.tests.filter(test => test.passed).length;
    const failedTests = result.tests.filter(test => !test.passed).length;
    const steps = result.tests.map(test => test.steps).flat();
    const passedSteps = steps.filter(step => step.passed).length;
    const skippedSteps = steps.filter(step => step.skipped).length;
    const failedSteps = steps.filter(step => !step.passed).length;
    function colorIfNonZero(n, color, text) {
        return n > 0 ? color.bold(text) : chalk_1.default.bold(text);
    }
    console.log(`\n${chalk_1.default.bold('Tests:')} ${colorIfNonZero(failedTests, chalk_1.default.redBright, failedTests + ' failed')}, ${colorIfNonZero(passedTests, chalk_1.default.greenBright, passedTests + ' passed')}, ${result.tests.length} total`);
    console.log(`${chalk_1.default.bold('Steps:')} ${colorIfNonZero(failedSteps, chalk_1.default.redBright, failedSteps + ' failed')}, ${colorIfNonZero(skippedSteps, chalk_1.default.yellowBright, skippedSteps + ' skipped')}, ${colorIfNonZero(passedSteps, chalk_1.default.greenBright, passedSteps + ' passed')}, ${steps.length} total`);
    console.log(`${chalk_1.default.bold('Time:')}  ${result.duration / 1000}s, estimated ${(result.duration / 1000).toFixed(0)}s`);
    console.log(`${chalk_1.default.bold('CO2:')}   ${chalk_1.default.greenBright(result.co2.toFixed(5) + 'g')}`);
    console.log(result.passed
        ? chalk_1.default.greenBright(`\nWorkflow passed after ${result.duration / 1000}s`)
        : chalk_1.default.redBright(`\nWorkflow failed after ${result.duration / 1000}s`));
}
exports.renderSummary = renderSummary;
function renderFeedbackMessage() {
    console.log(chalk_1.default.cyanBright(`Give us your feedback on ${chalk_1.default.underline('https://step.ci/feedback')}`));
}
exports.renderFeedbackMessage = renderFeedbackMessage;
function renderAnalyticsMessage() {
    if (!process.env.STEPCI_DISABLE_ANALYTICS) {
        console.log(chalk_1.default.gray(`\nⓘ  Anonymous usage data collected. Learn more on https://step.ci/privacy\n`));
    }
}
exports.renderAnalyticsMessage = renderAnalyticsMessage;
function dots(offset) {
    return chalk_1.default.gray('.').repeat(60 - offset);
}
function renderLoadTest(result) {
    console.log(`\nresponse_time:`);
    console.log(`  min: ${dots(0)} ${chalk_1.default.yellow(result.responseTime.min)}`);
    console.log(`  max: ${dots(0)} ${chalk_1.default.yellow(result.responseTime.max)}`);
    console.log(`  avg: ${dots(0)} ${chalk_1.default.yellow(result.responseTime.avg)}`);
    console.log(`  med: ${dots(0)} ${chalk_1.default.yellow(result.responseTime.med)}`);
    console.log(`  p95: ${dots(0)} ${chalk_1.default.yellow(result.responseTime.p95)}`);
    console.log(`  p99: ${dots(0)} ${chalk_1.default.yellow(result.responseTime.p99)}`);
    console.log(`steps:`);
    console.log(`  failed: ${dots(3)} ${chalk_1.default.yellow(result.stats.steps.failed)}`);
    console.log(`  passed: ${dots(3)} ${chalk_1.default.yellow(result.stats.steps.passed)}`);
    console.log(`  skipped: ${dots(4)} ${chalk_1.default.yellow(result.stats.steps.skipped)}`);
    console.log(`  errored: ${dots(4)} ${chalk_1.default.yellow(result.stats.steps.errored)}`);
    console.log(`  total: ${dots(2)} ${chalk_1.default.yellow(result.stats.steps.total)}`);
    console.log(`tests:`);
    console.log(`  failed: ${dots(3)} ${chalk_1.default.yellow(result.stats.tests.failed)}`);
    console.log(`  passed: ${dots(3)} ${chalk_1.default.yellow(result.stats.tests.passed)}`);
    console.log(`  total: ${dots(2)} ${chalk_1.default.yellow(result.stats.tests.total)}`);
    if (result.checks) {
        console.log(`checks`);
        for (const check in result.checks) {
            console.log(`  ${check}: ${dots(0)} ${result.checks[check].passed ? chalk_1.default.green('pass') : chalk_1.default.red('fail')}`);
        }
    }
    console.log(`rps: ${dots(-2)} ${chalk_1.default.yellow(result.rps)}`);
    console.log(`iterations: ${dots(5)} ${chalk_1.default.yellow(result.iterations)}`);
    console.log(`duration: ${dots(3)} ${chalk_1.default.yellow(result.duration)}`);
    console.log(result.passed
        ? chalk_1.default.greenBright(`\nWorkflow passed after ${result.duration / 1000}s`)
        : chalk_1.default.redBright(`\nWorkflow failed after ${result.duration / 1000}s`));
}
exports.renderLoadTest = renderLoadTest;
