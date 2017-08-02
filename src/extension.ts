'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { JiraClient } from './jira';
import { QuickPickItem } from 'vscode';
import { Handler } from './handler';



export function activate(context: vscode.ExtensionContext) {


    console.log('Congratulations, your extension "jira" is now active!');
    let commits: any[],
        cwd = vscode.workspace.rootPath,
        issueNumber: string,
        jiraConfDir: string = path.join(cwd,'.vscode','jira.json'),
        client: JiraClient = null;

    fs.stat(jiraConfDir, function (err, stats) {
        if (err === null) {
            let jiraConfig = require(jiraConfDir);
            client = new JiraClient(jiraConfig);
            if (!client.server) {
                Handler.error('ERROR: can not get jira host at config file');
            }
        } else {
            Handler.error('ERROR: no config file at' + `${cwd}/.vscode/jira.json`);
        }
    });

    let comment = vscode.commands.registerCommand('extension.jiraCommit', () => {
        if (!client.isConnection()) {
            Handler.error('ERROR: can not connect jira host');
            return;
        }
        Handler.addCommentForIssue(client);
    });

    let tasks = vscode.commands.registerCommand("extension.jiraTasks", () => {
        if (!client.isConnection()) {
            Handler.error('ERROR: can not connect jira host');
            return;
        }
        Handler.getMyIssues(client);
    });

    context.subscriptions.concat([comment, tasks]);
}

// this method is called when your extension is deactivated
export function deactivate() {
}