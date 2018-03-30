'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind, Executable, ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';
import { workspace, window } from "vscode";

export function registerCommands(client: LanguageClient): vscode.Disposable {

	let _lastMapConfig: string = undefined;

	let buildMap = async (args: any[]) => {
		let config = vscode.workspace.getConfiguration("wurst");

		let mapPromise: Thenable<string>;
		if (args && args.length > 0) {
			mapPromise = Promise.resolve(args[0]);
		} else {
			let items = workspace.findFiles('*.w3x', null, 10)
				.then(uris => uris.sort(function(a, b) {
					return fs.statSync(b.fsPath).mtime.getTime() -
							fs.statSync(a.fsPath).mtime.getTime();
				}))
				.then(uris => uris.map(uri => uri.path))
			mapPromise = window.showQuickPick(items)
		}
		let mappath = await mapPromise;
		if (!mappath) {
			return Promise.reject("No map selected.");
		}

		let request: ExecuteCommandParams = {
			command: "wurst.buildmap",
			arguments: [{
				'mappath': mappath
			}]
		};
		return client.sendRequest(ExecuteCommandRequest.type, request)
	};

	let startMap = async (args: any[]) => {
		let config = vscode.workspace.getConfiguration("wurst");
		let wc3path = config.get<string>("wc3path");
		if (!wc3path) {
			return Promise.reject("Warcraft path not set (change 'wurst.wc3path' in your settings).");
		}

		let mapPromise: Thenable<string>;
		if (args && args.length > 0) {
			mapPromise = Promise.resolve(args[0]);
		} else {
			let items = workspace.findFiles('*.w3x', null, 10)
				.then(uris => uris.sort(function(a, b) {
					return fs.statSync(b.fsPath).mtime.getTime() -
							fs.statSync(a.fsPath).mtime.getTime();
				}))
				.then(uris => uris.map(uri => uri.path))
			mapPromise = window.showQuickPick(items)
		}
		let mappath = await mapPromise;
		if (!mappath) {
			return Promise.reject("No map selected.");
		}

		let request: ExecuteCommandParams = {
			command: "wurst.startmap",
			arguments: [{
				'mappath': mappath,
				'wc3path': wc3path
			}]
		};
		_lastMapConfig = mappath
		return client.sendRequest(ExecuteCommandRequest.type, request)
	};
	let custom_command = async (args: any[]) => {
		let config = vscode.workspace.getConfiguration("wurst");
		let apppath = config.get<string>("apppath");
		let command = config.get<string>("command");
		if (!apppath) {
			return Promise.reject("apppath not set (change 'wurst.apppath' in your settings).");
		}
		if (!command) {
			return Promise.reject("command not set (change 'wurst.command' in your settings).");
		}
		let mapPromise: Thenable<string>;
		if (args && args.length > 0) {
			mapPromise = Promise.resolve(args[0]);
		} else {
			let items = workspace.findFiles('*.w3x', null, 10)
				.then(uris => uris.sort(function(a, b) {
					return fs.statSync(b.fsPath).mtime.getTime() -
							fs.statSync(a.fsPath).mtime.getTime();
				}))
				.then(uris => uris.map(uri => uri.path))
			mapPromise = window.showQuickPick(items)
		}
		let mappath = await mapPromise;
		if (!mappath) {
			return Promise.reject("No map selected.");
		}

		let request: ExecuteCommandParams = {
			command: "wurst.custom_command",
			arguments: [{
				'mappath': mappath,
				'wc3path': wc3path,
				'command': command
			}]
		};
		_lastMapConfig = mappath
		return client.sendRequest(ExecuteCommandRequest.type, request)
	};

	let startLast = () => {
		if (_lastMapConfig) {
			return startMap([_lastMapConfig]);
		} else {
			return startMap([]);
		}
	};

	let tests = (mode: 'all'|'file'|'func') => {
		let data: any = {}
		if (mode != 'all') {
			data.filename = window.activeTextEditor.document.fileName
		}
		if (mode == 'func') {
			let sel = window.activeTextEditor.selection
			if (sel) {
				data.line = sel.start.line
				data.column = sel.start.character
			}
		}
		let request: ExecuteCommandParams = {
			command: "wurst.tests",
			arguments: [data]
		};
		return client.sendRequest(ExecuteCommandRequest.type, request)
	}

	let performCodeAction = (args: any[]) => {
		let request: ExecuteCommandParams = {
			command: "wurst.perform_code_action",
			arguments: args
		};
		return client.sendRequest(ExecuteCommandRequest.type, request)
	}


	return vscode.Disposable.from(
		//vscode.commands.registerCommand('wurst.restart', () => client.restart()),
		// vscode.commands.registerCommand('wurst.clean', () => client.clean()),
		vscode.commands.registerCommand('wurst.startmap', (args: any[]) => startMap(args)),
		vscode.commands.registerCommand('wurst.custom_command', (args: any[]) => custom_command(args)),
		vscode.commands.registerCommand('wurst.startlast', () => startLast()),
		vscode.commands.registerCommand('wurst.buildmap', (args: any[]) => buildMap(args)),
		vscode.commands.registerCommand('wurst.tests', () => tests('all')),
		vscode.commands.registerCommand('wurst.tests_file', () => tests('file')),
		vscode.commands.registerCommand('wurst.tests_func', () => tests('func')),
		vscode.commands.registerCommand('wurst.perform_code_action', (args: any[]) => performCodeAction(args)),
	);
}
