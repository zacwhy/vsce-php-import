// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as phpParser from 'php-parser';

interface UseGroup extends phpParser.Statement {
    items: phpParser.UseItem[];
}

const decorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(0,255,0, 0.3)',
});

const parser = new phpParser.Engine({
    ast: {
        withPositions: true
    }
});

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsce-php-import" is now active!');

	vscode.window.onDidChangeActiveTextEditor(editor => {
		highlight();
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		highlight();
	}, null, context.subscriptions);

	highlight();
}

// this method is called when your extension is deactivated
export function deactivate() {}

function highlight() {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		return;
	}

	if (editor.document.languageId !== 'php') {
		return;
	}

	const text = editor.document.getText();
	const program = parser.parseCode(text, '');

	const container = program.children[0].kind === 'namespace'
		? program.children[0] as phpParser.Namespace
		: program;

	const useGroups = container.children.filter(node => node.kind === 'usegroup') as UseGroup[];

	const ranges: vscode.Range[] = [];

	// start from index 1, no need to check the first UseGroup
	for (let i = 1; i < useGroups.length; i++) {
		const useGroup = useGroups[i];
		const previousUseGroup = useGroups[i - 1];

		const name = useGroup.items[0].name;
		const previousName = previousUseGroup.items[0].name;

		if (name > previousName) {
			continue;
		}

		if (!useGroup.loc) {
			continue;
		}

		const start = editor.document.positionAt(useGroup.loc.start.offset);
		const end = editor.document.positionAt(useGroup.loc.end.offset);
		ranges.push(new vscode.Range(start, end));
	}

	editor.setDecorations(decorationType, ranges);
}
