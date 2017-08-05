'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { JiraClient } from './jira';
import { QuickPickItem } from 'vscode';
import { Handler } from './handler';

const Copy = require('copy-paste');


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
            Handler.setClient(client);
        } else {
            Handler.error('ERROR: no config file at' + `${cwd}/.vscode/jira.json`);
        }
    });

    let comment = vscode.commands.registerCommand('extension.jiraCommit', () => {
        if (!client.isConnection()) {
            Handler.error('ERROR: can not connect jira host');
            return;
        }
        Handler.addCommentForIssue();
    });

    let tasks = vscode.commands.registerCommand("extension.jiraTasks", () => {
        if (!client.isConnection()) {
            Handler.error('ERROR: can not connect jira host');
            return;
        }
        Handler.getMyIssues(function(data) {
            if (data) {
                Copy.copy(`${data.label} ${data.detail}`, function () {
                    vscode.window.setStatusBarMessage('The issue is copied.', 2000);
                });
            }
        });
    });

    let doTask = vscode.commands.registerCommand("extension.jiraDoTasks", () => {
        if (!client.isConnection()) {
            Handler.error('ERROR: can not connect jira host');
            return;
        }
        Handler.doMyIssue();
    });

    context.subscriptions.concat([comment, tasks, doTask]);
}

// this method is called when your extension is deactivated
export function deactivate() {
}