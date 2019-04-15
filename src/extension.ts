// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import * as crypt from 'crypto';
import * as child_process from 'child_process';

function editPptx(pptxPath:string):void{
	// var powerpoint = require('office-script').powerpoint;
	// powerpoint.open(pptxPath, (err, presentation)=>{
	// 	if(err){throw err;} 

	// 	console.log("Presentation path: ", presentation.attr({name: 'Path'}, true));

	// });
	return;
}
// 
async function copy2autoshape(activeTextEditor:vscode.TextEditor):Promise<void>{	
	let active_file_path:string = activeTextEditor.document.fileName;
	let active_file_path_for_vscode_URI = "file"+active_file_path.replace(/(c|C)\:/g,"").replace(/\\/g,"/");
	let uri = activeTextEditor.document.uri;
	let symbol:Array<any> = <Array<any>> await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider",uri);
	let functions = symbol.filter((elem, index, array)=>{
		return (elem.kind == 11)
	})
	
	activeTextEditor.selections.forEach( async (selection, index, array)=>{                
		let start_line:string = (selection.start.line +1).toString();
		let end_line:string = (selection.end.line +1).toString();
		let line_str:string = selection.isSingleLine?start_line:start_line+" - "+end_line;
		let lang:string = activeTextEditor.document.languageId;
	
		let matched_function_name = "undefined";
		for(let f of functions){
			if( (f.location.range._start.line <= selection.start.line)
			){
				matched_function_name = f.name;            
			}else{
				break;
			}
		}
		
		let copyText = 
`---
title: code2autoshape
author: copy2autoshape
date: ${Date.now().toLocaleString()}
fontsize: 11pt
---
# ${active_file_path.replace("\\","/")}:${line_str}, func: ${matched_function_name}
\`\`\`${lang}
${activeTextEditor.document.getText(selection)}
\`\`\``;		

		// output as markdown
		let tempDir;
		if((vscode.workspace.rootPath !== undefined) && (process.platform === 'win32')){
			let workspaceId = path.basename(vscode.workspace.rootPath);
			let tempDir = `C:/Users/akieg/AppData/Local/Temp/vscode-copy2autoshape/${workspaceId}`;
			child_process.execSync(`powershell.exe -Command {New-Item -ItemType Directory -Force "${tempDir}"}`);
		
			// let tempMdFilePath =  `C:/work/vscode/copy-as-autoshape/temp/temp.md`;
			let tempMdFilePath =  `${tempDir}/temp.md`;
			// let tempPptxFilePath =  `C:/work/vscode/copy-as-autoshape/temp/temp.pptx`;
			let tempPptxFilePath =  `${tempDir}/temp.pptx`;
			let pandocCustomReferenceFilePath = "C:/work/vscode/copy-as-autoshape/reference.pptx";
			let ret = fsExtra.outputFileSync(tempMdFilePath,copyText, 'utf-8');
			child_process.execSync(`pandoc ${tempMdFilePath} --reference-doc ${pandocCustomReferenceFilePath} -o ${tempPptxFilePath}`);

			// small modify a pptx file
			editPptx(tempPptxFilePath);
			child_process.execSync(`start ${tempPptxFilePath}`);
		}		
	});


	// tslint:disable-next-line:no-unused-expression
	new Promise<void>((resolve)=>{
		resolve();
	});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "copy-as-autoshape" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.copy2autoshape', () => {
		// The code you place here will be executed every time your command is executed
		if(undefined !== vscode.window.activeTextEditor){
			let activeTextEditor:vscode.TextEditor = vscode.window.activeTextEditor;
			copy2autoshape(activeTextEditor);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
