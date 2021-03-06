var util = require("util");
var ts = require("typescript");
var helper = require("./lib/ast-helper");

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
function escape(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function walkAst(node) {
    if (!node.clobber) { return; }
    // console.log(node.kindStr + " => " + node.source() + "\n============================");

    switch (node.kind) {
        case ts.SyntaxKind.ExportKeyword:
            if (node.parent && node.parent.kind === ts.SyntaxKind.FunctionDeclaration) {
                node.clobber(node.source().replace("export", "declare"));
            }
            break;
    }
}


module.exports = function(input, opts) {
    // Use typescript itself to extract the AST
    var sourceFile = ts.createSourceFile("tmp.d.ts", input, ts.ScriptTarget.ES6, true);
    // convert it to a flow library definition
    var flowLibDef = helper(sourceFile.text, sourceFile, walkAst);
    // use whatever line endings the file uses.
    var lineEnding = "\n";
    var nlIndex = sourceFile.text.indexOf("\n");
    if (nlIndex > 0 && sourceFile.text[nlIndex-1] === "\r") {
        lineEnding = "\r\n";
    }

    // remove all blank lines: This makes testing output a bit nicer
    flowLibDef = flowLibDef.split("\n").filter(function(line) {
        return line.trim().length > 0;
    }).map(function(line) {
        // trim all trailing whitespace (also kills stray \r's)
        return line.trimRight(); // Node seems to have this :D
    }).join(lineEnding);
    return "// @flow\n// Auto-generated by ProbablyFlowTyped: https://github.com/Kegsay/ProbablyFlowTyped\n" + flowLibDef;
}

